import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppSettings } from "../shared/types";

const DEFAULT_SETTINGS: AppSettings = {
  targetFolder: null
};

export async function readSettings(userDataPath: string): Promise<AppSettings> {
  const settingsPath = getSettingsPath(userDataPath);

  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      targetFolder: typeof parsed.targetFolder === "string" ? parsed.targetFolder : null
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(userDataPath: string, settings: AppSettings): Promise<AppSettings> {
  const normalized: AppSettings = {
    targetFolder: settings.targetFolder || null
  };

  await fs.mkdir(userDataPath, { recursive: true });
  await fs.writeFile(getSettingsPath(userDataPath), JSON.stringify(normalized, null, 2), "utf8");

  return normalized;
}

function getSettingsPath(userDataPath: string): string {
  return path.join(userDataPath, "settings.json");
}
