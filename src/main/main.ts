import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  type IpcMainInvokeEvent,
  type OpenDialogOptions
} from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppSettings, DownloadRequest, DownloadStatus, MetaMode } from "../shared/types";
import { installValidatedHeroGrid } from "./fileOps";
import { readSettings, writeSettings } from "./settings";
import { downloadMetaGridFromOfficialPage } from "./dota2ptDownloader";

let mainWindow: BrowserWindow | null = null;

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 940,
    height: 680,
    minWidth: 760,
    minHeight: 560,
    title: "Dota2ProTracker Meta Grid",
    backgroundColor: "#111316",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  registerIpc();
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function registerIpc(): void {
  ipcMain.handle("select-target-folder", async (event) => {
    assertTrustedSender(event);

    const dialogOptions: OpenDialogOptions = {
      title: "Selecione a pasta cfg do Dota 2",
      properties: ["openDirectory", "createDirectory"]
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    return result.canceled ? null : result.filePaths[0] ?? null;
  });

  ipcMain.handle("open-target-folder", async (event, targetFolder: unknown) => {
    assertTrustedSender(event);

    const normalizedTargetFolder = await normalizeExistingDirectory(targetFolder);
    await shell.openPath(normalizedTargetFolder);
  });

  ipcMain.handle("get-settings", (event) => {
    assertTrustedSender(event);

    return readSettings(app.getPath("userData"));
  });

  ipcMain.handle("save-settings", async (event, settings: unknown) => {
    assertTrustedSender(event);

    return writeSettings(app.getPath("userData"), validateSettings(settings));
  });

  ipcMain.handle("download-meta-grid", async (event, unsafeRequest: unknown) => {
    assertTrustedSender(event);

    const request = await validateDownloadRequest(unsafeRequest);
    const reportStatus = (status: DownloadStatus) => event.sender.send("download-status", status);
    let downloadedPath: string | null = null;

    try {
      reportStatus({ phase: "loading-page", message: "Preparando download..." });
      downloadedPath = await downloadMetaGridFromOfficialPage(request.mode, reportStatus);

      reportStatus({ phase: "validating", message: "Validando JSON baixado..." });
      reportStatus({ phase: "saving", message: "Salvando hero_grid_config.json..." });

      const result = await installValidatedHeroGrid(downloadedPath, request.targetFolder, request.mode);
      reportStatus({ phase: "done", message: "Hero Grid atualizado." });

      return {
        mode: request.mode,
        ...result
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha inesperada ao baixar o Hero Grid.";
      reportStatus({ phase: "error", message });
      throw error;
    } finally {
      if (downloadedPath) {
        await fs.unlink(downloadedPath).catch(() => undefined);
      }
    }
  });
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (!mainWindow || event.sender !== mainWindow.webContents) {
    throw new Error("Origem IPC nao autorizada.");
  }
}

function validateSettings(settings: unknown): AppSettings {
  if (!settings || typeof settings !== "object") {
    return { targetFolder: null };
  }

  const targetFolder = (settings as Partial<AppSettings>).targetFolder;
  return {
    targetFolder: typeof targetFolder === "string" && targetFolder.trim() ? targetFolder : null
  };
}

async function validateDownloadRequest(request: unknown): Promise<DownloadRequest> {
  if (!request || typeof request !== "object") {
    throw new Error("Pedido de download invalido.");
  }

  const candidate = request as Partial<DownloadRequest>;
  if (!isMetaMode(candidate.mode)) {
    throw new Error("Modo de meta invalido.");
  }

  return {
    mode: candidate.mode,
    targetFolder: await normalizeExistingDirectory(candidate.targetFolder)
  };
}

async function normalizeExistingDirectory(value: unknown): Promise<string> {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Pasta de destino invalida.");
  }

  const normalized = path.resolve(value);
  if (!path.isAbsolute(normalized)) {
    throw new Error("A pasta de destino precisa ser um caminho absoluto.");
  }

  const stats = await fs.stat(normalized).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error("A pasta de destino nao existe ou nao e uma pasta.");
  }

  return normalized;
}

function isMetaMode(value: unknown): value is MetaMode {
  return value === "most-played" || value === "high-winrate" || value === "d2pt-rating";
}
