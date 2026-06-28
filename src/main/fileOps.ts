import { promises as fs } from "node:fs";
import path from "node:path";
import type { MetaMode } from "../shared/types";

const HERO_GRID_FILE = "hero_grid_config.json";

export interface InstallHeroGridResult {
  destinationPath: string;
  backupPath: string | null;
  fileSizeBytes: number;
  savedAt: string;
  warning: string | null;
}

export function isLikelyDotaCfgPath(targetFolder: string): boolean {
  const normalized = path.normalize(targetFolder).toLowerCase();
  return /steam[\\/]userdata[\\/][^\\/]+[\\/]570[\\/]remote[\\/]cfg$/.test(normalized);
}

export function getDotaCfgWarning(targetFolder: string): string | null {
  if (isLikelyDotaCfgPath(targetFolder)) {
    return null;
  }

  return "A pasta selecionada nao parece ser ...\\Steam\\userdata\\<STEAM_ID>\\570\\remote\\cfg. O arquivo foi salvo, mas o Dota 2 pode nao carregar esse grid.";
}

export async function validateHeroGridJson(filePath: string): Promise<void> {
  let parsed: unknown;
  const raw = await fs.readFile(filePath, "utf8");

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("O arquivo baixado nao e um JSON valido. Nada foi alterado na pasta de destino.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("O arquivo baixado nao tem o formato esperado de hero grid. Nada foi alterado na pasta de destino.");
  }
}

export async function installValidatedHeroGrid(
  sourceJsonPath: string,
  targetFolder: string,
  _mode: MetaMode,
  now = new Date()
): Promise<InstallHeroGridResult> {
  await validateHeroGridJson(sourceJsonPath);
  await fs.access(targetFolder);

  const destinationPath = path.join(targetFolder, HERO_GRID_FILE);
  const backupPath = await backupExistingHeroGrid(destinationPath, now);

  await fs.copyFile(sourceJsonPath, destinationPath);
  const stats = await fs.stat(destinationPath);

  return {
    destinationPath,
    backupPath,
    fileSizeBytes: stats.size,
    savedAt: now.toISOString(),
    warning: getDotaCfgWarning(targetFolder)
  };
}

async function backupExistingHeroGrid(destinationPath: string, now: Date): Promise<string | null> {
  try {
    await fs.access(destinationPath);
  } catch {
    return null;
  }

  const parsed = path.parse(destinationPath);
  const backupPath = path.join(
    parsed.dir,
    `${parsed.name}.backup-${formatTimestamp(now)}${parsed.ext}`
  );

  await fs.copyFile(destinationPath, backupPath);
  return backupPath;
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}
