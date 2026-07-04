import { useEffect, useMemo, useState } from "react";
import type { AppLanguage, DotaCfgFolder, DownloadResult, DownloadStatus, MetaMode } from "../shared/types";
import { META_MODE_LABELS } from "../shared/types";
import { AppToolbar } from "./components/AppToolbar";
import { ModeGrid, type ModeOption } from "./components/ModeGrid";
import { StatusBar } from "./components/StatusBar";
import { TargetFolderSection } from "./components/TargetFolderSection";
import { COPY, detectInitialLanguage } from "./i18n";

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => detectInitialLanguage());
  const [targetFolder, setTargetFolder] = useState<string>("");
  const [status, setStatus] = useState<DownloadStatus | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<MetaMode | null>(null);
  const [detectedFolders, setDetectedFolders] = useState<DotaCfgFolder[]>([]);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const isBusy = activeMode !== null;
  const copy = COPY[language];
  const modes = useMemo<ModeOption[]>(
    () =>
      (Object.keys(copy.modes) as MetaMode[]).map((mode) => ({
        mode,
        ...copy.modes[mode]
      })),
    [copy]
  );
  const folderWarning = useMemo(() => {
    if (!targetFolder) {
      return null;
    }

    return /steam[\\/]userdata[\\/][^\\/]+[\\/]570[\\/]remote[\\/]cfg$/i.test(targetFolder)
      ? null
      : copy.folderWarning;
  }, [copy.folderWarning, targetFolder]);

  useEffect(() => {
    let mounted = true;

    window.d2pt.getSettings().then((settings) => {
      if (!mounted) {
        return;
      }

      setLanguage(settings.language);
      const savedTargetFolder = settings.targetFolder || "";
      if (settings.targetFolder) {
        setTargetFolder(savedTargetFolder);
      }

      detectFolders(true, savedTargetFolder);
    });

    const unsubscribe = window.d2pt.onDownloadStatus((nextStatus) => {
      setStatus(nextStatus);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function saveAppSettings(folder: string | null, nextLanguage = language) {
    await window.d2pt.saveSettings({ targetFolder: folder, language: nextLanguage });
  }

  async function applyTargetFolder(folder: string, message: string | null) {
    setTargetFolder(folder);
    setDetectionMessage(message);
    await saveAppSettings(folder);
  }

  async function changeLanguage(nextLanguage: AppLanguage) {
    if (nextLanguage === language) {
      return;
    }

    setLanguage(nextLanguage);
    await saveAppSettings(targetFolder || null, nextLanguage);
  }

  async function chooseFolder() {
    const selected = await window.d2pt.selectTargetFolder();
    if (!selected) {
      return;
    }

    await applyTargetFolder(selected, copy.manualFolder);
  }

  async function detectFolders(silent = false, currentTargetFolder = targetFolder) {
    if (isBusy || isDetecting) {
      return;
    }

    setIsDetecting(true);
    if (!silent) {
      setDetectionMessage(null);
    }

    try {
      const folders = await window.d2pt.detectDotaCfgFolders();
      setDetectedFolders(folders);

      if (folders.length === 0) {
        setDetectionMessage(copy.noSteamFolder);
        return;
      }

      if (folders.length === 1) {
        if (silent && currentTargetFolder) {
          setDetectionMessage(null);
          return;
        }

        await applyTargetFolder(folders[0].cfgPath, `${copy.autoFolder}: Steam ID ${folders[0].steamId}.`);
        return;
      }

      if (silent && currentTargetFolder) {
        setDetectionMessage(null);
        return;
      }

      setDetectionMessage(`${folders.length} ${copy.multipleAccounts}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : copy.detectError;
      setDetectionMessage(message);
    } finally {
      setIsDetecting(false);
    }
  }

  async function chooseDetectedFolder(cfgPath: string) {
    const folder = detectedFolders.find((item) => item.cfgPath === cfgPath);
    if (!folder) {
      return;
    }

    await applyTargetFolder(folder.cfgPath, `${copy.selectedFolder}: Steam ID ${folder.steamId}.`);
  }

  async function download(mode: MetaMode) {
    if (!targetFolder || isBusy) {
      return;
    }

    setActiveMode(mode);
    setError(null);
    setResult(null);
    setStatus({ phase: "loading-page", message: `${copy.preparing} ${META_MODE_LABELS[mode]}...` });

    try {
      const nextResult = await window.d2pt.downloadMetaGrid({ mode, targetFolder });
      setResult(nextResult);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : copy.detectError;
      setError(message);
    } finally {
      setActiveMode(null);
    }
  }

  return (
    <main className="app-shell">
      <AppToolbar subtitle={copy.subtitle} language={language} onChangeLanguage={changeLanguage} />

      <TargetFolderSection
        copy={copy}
        targetFolder={targetFolder}
        detectedFolders={detectedFolders}
        isBusy={isBusy}
        isDetecting={isDetecting}
        onChooseFolder={chooseFolder}
        onChooseDetectedFolder={chooseDetectedFolder}
      />

      <ModeGrid
        title={copy.gridTitle}
        subtitle={copy.gridSubtitle}
        downloadLabel={copy.download}
        modes={modes}
        activeMode={activeMode}
        isDisabled={!targetFolder || isBusy}
        onDownload={download}
      />

      <StatusBar status={status} result={result} error={error} alert={folderWarning || detectionMessage} copy={copy} />
    </main>
  );
}
