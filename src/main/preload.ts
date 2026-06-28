import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings, D2ptApi, DownloadRequest, DownloadStatus } from "../shared/types";

const api: D2ptApi = {
  selectTargetFolder: () => ipcRenderer.invoke("select-target-folder"),
  openTargetFolder: (targetFolder: string) => ipcRenderer.invoke("open-target-folder", targetFolder),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke("save-settings", settings),
  downloadMetaGrid: (request: DownloadRequest) => ipcRenderer.invoke("download-meta-grid", request),
  onDownloadStatus: (callback: (status: DownloadStatus) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: DownloadStatus) => callback(status);
    ipcRenderer.on("download-status", listener);
    return () => ipcRenderer.removeListener("download-status", listener);
  }
};

contextBridge.exposeInMainWorld("d2pt", api);
