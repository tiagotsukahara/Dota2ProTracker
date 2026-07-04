import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
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
import { detectDotaCfgFolders } from "./steamDetector";

let mainWindow: BrowserWindow | null = null;

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function getAppIconPath(): string {
  return path.join(app.getAppPath(), "build", "app-icon.ico");
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 620,
    minWidth: 920,
    minHeight: 620,
    maxWidth: 920,
    maxHeight: 620,
    useContentSize: true,
    resizable: false,
    title: "Dota2ProTracker Meta Grid",
    icon: getAppIconPath(),
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
  Menu.setApplicationMenu(null);
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

  ipcMain.handle("detect-dota-cfg-folders", async (event) => {
    assertTrustedSender(event);

    return detectDotaCfgFolders();
  });

  ipcMain.handle("open-target-folder", async (event, targetFolder: unknown) => {
    assertTrustedSender(event);

    const normalizedTargetFolder = await normalizeExistingDirectory(targetFolder);
    await shell.openPath(normalizedTargetFolder);
  });

  ipcMain.handle("get-settings", async (event) => {
    assertTrustedSender(event);

    const settings = await readSettings(app.getPath("userData"));
    if (!settings.targetFolder) {
      return settings;
    }

    const stats = await fs.stat(settings.targetFolder).catch(() => null);
    if (stats?.isDirectory()) {
      return settings;
    }

    return writeSettings(app.getPath("userData"), { ...settings, targetFolder: null });
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
    return { targetFolder: null, language: "en" };
  }

  const targetFolder = (settings as Partial<AppSettings>).targetFolder;
  const language = (settings as Partial<AppSettings>).language;
  return {
    targetFolder: typeof targetFolder === "string" && targetFolder.trim() ? targetFolder : null,
    language: language === "pt-BR" || language === "en" || language === "es" ? language : "en"
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
