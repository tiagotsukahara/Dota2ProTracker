import { promises as fs } from "node:fs";
import path from "node:path";
import type { DotaCfgFolder } from "../shared/types";

export const DEFAULT_STEAM_USERDATA_PATH = "C:\\Program Files (x86)\\Steam\\userdata";

const HERO_GRID_FILE = "hero_grid_config.json";

export async function detectDotaCfgFolders(
  userdataRoots: string[] = [DEFAULT_STEAM_USERDATA_PATH]
): Promise<DotaCfgFolder[]> {
  const folders = new Map<string, DotaCfgFolder>();

  for (const root of userdataRoots) {
    const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);

    for (const entry of entries) {
      if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) {
        continue;
      }

      const cfgPath = path.join(root, entry.name, "570", "remote", "cfg");
      const stats = await fs.stat(cfgPath).catch(() => null);

      if (!stats?.isDirectory()) {
        continue;
      }

      const key = path.normalize(cfgPath).toLowerCase();
      folders.set(key, {
        steamId: entry.name,
        cfgPath,
        hasHeroGrid: await fileExists(path.join(cfgPath, HERO_GRID_FILE))
      });
    }
  }

  return Array.from(folders.values()).sort((left, right) => {
    if (left.hasHeroGrid !== right.hasHeroGrid) {
      return left.hasHeroGrid ? -1 : 1;
    }

    return left.steamId.localeCompare(right.steamId, undefined, { numeric: true });
  });
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}
