import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const fileOps = require("../dist/main/fileOps.js");
const steamDetector = require("../dist/main/steamDetector.js");

test("detects the Dota 2 cfg folder shape", () => {
  assert.equal(
    fileOps.isLikelyDotaCfgPath("C:\\Program Files (x86)\\Steam\\userdata\\123\\570\\remote\\cfg"),
    true
  );
  assert.equal(fileOps.isLikelyDotaCfgPath("C:\\Temp\\cfg"), false);
});

test("validates JSON before installing and leaves existing grid untouched on invalid input", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "d2pt-invalid-"));

  try {
    const target = path.join(dir, "target");
    const source = path.join(dir, "download.json");
    await mkdir(target);
    await writeFile(path.join(target, "hero_grid_config.json"), "{\"old\":true}", "utf8");
    await writeFile(source, "not-json", "utf8");

    await assert.rejects(
      () => fileOps.installValidatedHeroGrid(source, target, "most-played"),
      /JSON valido/
    );

    assert.equal(await readFile(path.join(target, "hero_grid_config.json"), "utf8"), "{\"old\":true}");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("creates a dated backup before replacing hero_grid_config.json", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "d2pt-backup-"));

  try {
    const target = path.join(dir, "target");
    const source = path.join(dir, "download.json");
    await mkdir(target);
    await writeFile(path.join(target, "hero_grid_config.json"), "{\"old\":true}", "utf8");
    await writeFile(source, "{\"new\":true}", "utf8");

    const result = await fileOps.installValidatedHeroGrid(
      source,
      target,
      "high-winrate",
      new Date(2026, 5, 28, 12, 34, 56)
    );

    assert.match(result.backupPath, /hero_grid_config\.backup-20260628-123456\.json$/);
    assert.equal(await readFile(result.backupPath, "utf8"), "{\"old\":true}");
    assert.equal(await readFile(path.join(target, "hero_grid_config.json"), "utf8"), "{\"new\":true}");
    assert.match(result.warning, /nao parece/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("detects Dota 2 cfg folders from Steam userdata roots", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "d2pt-steam-"));

  try {
    const userdata = path.join(dir, "userdata");
    const firstCfg = path.join(userdata, "111", "570", "remote", "cfg");
    const secondCfg = path.join(userdata, "222", "570", "remote", "cfg");
    await mkdir(firstCfg, { recursive: true });
    await mkdir(secondCfg, { recursive: true });
    await mkdir(path.join(userdata, "not-a-steam-id", "570", "remote", "cfg"), { recursive: true });
    await writeFile(path.join(secondCfg, "hero_grid_config.json"), "{\"grid\":true}", "utf8");

    const folders = await steamDetector.detectDotaCfgFolders([userdata]);

    assert.deepEqual(folders, [
      {
        steamId: "222",
        cfgPath: secondCfg,
        hasHeroGrid: true
      },
      {
        steamId: "111",
        cfgPath: firstCfg,
        hasHeroGrid: false
      }
    ]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("returns an empty list when Steam userdata root does not exist", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "d2pt-no-steam-"));

  try {
    const folders = await steamDetector.detectDotaCfgFolders([path.join(dir, "missing")]);
    assert.deepEqual(folders, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
