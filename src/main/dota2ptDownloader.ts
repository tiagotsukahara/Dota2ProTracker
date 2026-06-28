import { promises as fs } from "node:fs";
import path from "node:path";
import { BrowserWindow, app } from "electron";
import type { DownloadStatus, MetaMode } from "../shared/types";

const META_GRID_URL = "https://dota2protracker.com/meta-hero-grids";
const DOWNLOAD_TIMEOUT_MS = 120_000;
const PAGE_READY_TIMEOUT_MS = 180_000;

type StatusReporter = (status: DownloadStatus) => void;

interface DownloadedFile {
  path: string;
  bytes: number;
}

const DOWNLOAD_INDEX_BY_MODE: Record<MetaMode, number> = {
  "most-played": 0,
  "high-winrate": 1,
  "d2pt-rating": 2
};

export async function downloadMetaGridFromOfficialPage(
  mode: MetaMode,
  reportStatus: StatusReporter
): Promise<string> {
  const tempPath = path.join(app.getPath("temp"), `d2pt-meta-grid-${mode}-${Date.now()}.json`);
  await removeIfExists(tempPath);

  const window = new BrowserWindow({
    width: 1100,
    height: 820,
    show: false,
    title: "Dota2ProTracker Meta Hero Grids",
    webPreferences: {
      partition: "persist:d2pt-meta-grid",
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedD2ptUrl(url)) {
      event.preventDefault();
    }
  });

  try {
    reportStatus({ phase: "loading-page", message: "Abrindo Dota2ProTracker..." });
    await window.loadURL(META_GRID_URL);
    await waitForUsablePage(window, reportStatus);

    const downloadPromise = waitForDownload(window, tempPath, reportStatus);

    reportStatus({ phase: "clicking-download", message: "Selecionando o download oficial..." });
    const clicked = await clickDownloadButton(window, mode);

    if (!clicked) {
      throw new Error("Nao encontrei o botao de download na pagina oficial. Tente novamente apos a pagina carregar completamente.");
    }

    const downloaded = await downloadPromise;

    if (downloaded.bytes <= 0) {
      throw new Error("O download terminou vazio. Nada foi alterado na pasta de destino.");
    }

    return downloaded.path;
  } catch (error) {
    await removeIfExists(tempPath);
    throw error;
  } finally {
    if (!window.isDestroyed()) {
      window.destroy();
    }
  }
}

async function waitForUsablePage(window: BrowserWindow, reportStatus: StatusReporter): Promise<void> {
  const startedAt = Date.now();
  let exposedChallenge = false;

  while (Date.now() - startedAt < PAGE_READY_TIMEOUT_MS) {
    const state = await inspectPageState(window);

    if (state.hasMetaGridContent) {
      return;
    }

    if (state.hasCloudflareChallenge && !exposedChallenge) {
      exposedChallenge = true;
      window.show();
      reportStatus({
        phase: "waiting-cloudflare",
        message: "O Cloudflare pediu verificacao. Complete a verificacao na janela aberta; o app continua depois."
      });
    }

    await delay(1000);
  }

  throw new Error("A pagina oficial nao ficou pronta a tempo. Verifique sua conexao e tente novamente.");
}

async function inspectPageState(window: BrowserWindow): Promise<{
  hasMetaGridContent: boolean;
  hasCloudflareChallenge: boolean;
}> {
  return window.webContents.executeJavaScript(
    `(() => {
      const text = document.body?.innerText || "";
      return {
        hasMetaGridContent: text.includes("Dota2ProTracker Meta Hero Grids") && text.includes("Download Hero Grid Configuration"),
        hasCloudflareChallenge: text.includes("Just a moment") || text.includes("Enable JavaScript and cookies") || text.includes("Checking your browser")
      };
    })()`,
    true
  );
}

async function clickDownloadButton(window: BrowserWindow, mode: MetaMode): Promise<boolean> {
  const buttonIndex = DOWNLOAD_INDEX_BY_MODE[mode];

  return window.webContents.executeJavaScript(
    `(() => {
      const mode = ${JSON.stringify(mode)};
      const labels = {
        "most-played": "Most Played",
        "high-winrate": "High Winrate",
        "d2pt-rating": "D2PT Rating"
      };
      const wanted = labels[mode];
      const candidates = Array.from(document.querySelectorAll("button, a"))
        .filter((node) => (node.textContent || "").trim().toLowerCase() === "download");

      const headings = Array.from(document.querySelectorAll("h2, h3, h4"));
      const heading = headings.find((node) => (node.textContent || "").trim().toLowerCase() === wanted.toLowerCase());

      if (heading) {
        let current = heading;
        for (let i = 0; i < 12 && current; i += 1) {
          const scopedButton = current.querySelector?.("button, a");
          if (scopedButton && (scopedButton.textContent || "").trim().toLowerCase() === "download") {
            scopedButton.click();
            return true;
          }

          current = current.nextElementSibling;
          if (current && /^h[234]$/i.test(current.tagName)) {
            break;
          }
        }

        const parentButton = heading.parentElement?.querySelector("button, a");
        if (parentButton && (parentButton.textContent || "").trim().toLowerCase() === "download") {
          parentButton.click();
          return true;
        }
      }

      const fallback = candidates[${buttonIndex}];
      if (fallback) {
        fallback.click();
        return true;
      }

      return false;
    })()`,
    true
  );
}

function waitForDownload(
  window: BrowserWindow,
  tempPath: string,
  reportStatus: StatusReporter
): Promise<DownloadedFile> {
  const downloadSession = window.webContents.session;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("O download nao iniciou a tempo. Tente novamente."));
    }, DOWNLOAD_TIMEOUT_MS);

    const onWillDownload = (_event: Electron.Event, item: Electron.DownloadItem) => {
      reportStatus({ phase: "downloading", message: "Baixando arquivo JSON..." });
      item.setSavePath(tempPath);

      item.once("done", (_doneEvent, state) => {
        cleanup();

        if (state === "completed") {
          resolve({
            path: tempPath,
            bytes: item.getReceivedBytes()
          });
          return;
        }

        reject(new Error(`O download nao foi concluido (${state}). Nada foi alterado na pasta de destino.`));
      });
    };

    const cleanup = () => {
      clearTimeout(timeout);
      downloadSession.removeListener("will-download", onWillDownload);
    };

    downloadSession.once("will-download", onWillDownload);
  });
}

async function removeIfExists(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File does not exist or cannot be removed; the caller will surface write errors if needed.
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAllowedD2ptUrl(url: string): boolean {
  try {
    return new URL(url).origin === "https://dota2protracker.com";
  } catch {
    return false;
  }
}
