import { promises as fs } from "node:fs";
import path from "node:path";
import type { AppLanguage, AppSettings } from "../shared/types";

const DEFAULT_SETTINGS: AppSettings = {
  targetFolder: null,
  language: "en"
};

export async function readSettings(userDataPath: string): Promise<AppSettings> {
  const settingsPath = getSettingsPath(userDataPath);

  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppSettings>;

    return {
      targetFolder: typeof parsed.targetFolder === "string" ? parsed.targetFolder : null,
      language: normalizeLanguage(parsed.language)
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(userDataPath: string, settings: AppSettings): Promise<AppSettings> {
  const normalized: AppSettings = {
    targetFolder: settings.targetFolder || null,
    language: normalizeLanguage(settings.language)
  };

  await fs.mkdir(userDataPath, { recursive: true });
  await fs.writeFile(getSettingsPath(userDataPath), JSON.stringify(normalized, null, 2), "utf8");

  return normalized;
}

function getSettingsPath(userDataPath: string): string {
  return path.join(userDataPath, "settings.json");
}

function normalizeLanguage(value: unknown): AppLanguage {
  return value === "pt-BR" || value === "es" || value === "en" ? value : "en";
}
