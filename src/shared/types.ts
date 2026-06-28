export type MetaMode = "most-played" | "high-winrate" | "d2pt-rating";

export interface AppSettings {
  targetFolder: string | null;
}

export interface DownloadRequest {
  mode: MetaMode;
  targetFolder: string;
}

export interface DownloadResult {
  mode: MetaMode;
  destinationPath: string;
  backupPath: string | null;
  fileSizeBytes: number;
  savedAt: string;
  warning: string | null;
}

export interface DownloadStatus {
  phase:
    | "loading-page"
    | "waiting-cloudflare"
    | "clicking-download"
    | "downloading"
    | "validating"
    | "saving"
    | "done"
    | "error";
  message: string;
}

export interface D2ptApi {
  selectTargetFolder: () => Promise<string | null>;
  openTargetFolder: (targetFolder: string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<AppSettings>;
  downloadMetaGrid: (request: DownloadRequest) => Promise<DownloadResult>;
  onDownloadStatus: (callback: (status: DownloadStatus) => void) => () => void;
}

export const META_MODE_LABELS: Record<MetaMode, string> = {
  "most-played": "Most Played",
  "high-winrate": "High Winrate",
  "d2pt-rating": "D2PT Rating"
};
