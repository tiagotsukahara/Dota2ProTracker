import { FolderOpen, Info } from "lucide-react";
import type { DotaCfgFolder } from "../../shared/types";
import type { AppCopy } from "../i18n";

interface TargetFolderSectionProps {
  copy: AppCopy;
  targetFolder: string;
  detectedFolders: DotaCfgFolder[];
  isBusy: boolean;
  isDetecting: boolean;
  onChooseFolder: () => void;
  onChooseDetectedFolder: (cfgPath: string) => void;
}

export function TargetFolderSection({
  copy,
  targetFolder,
  detectedFolders,
  isBusy,
  isDetecting,
  onChooseFolder,
  onChooseDetectedFolder
}: TargetFolderSectionProps) {
  const selectedDetectedFolder = detectedFolders.some((item) => item.cfgPath === targetFolder) ? targetFolder : "";

  return (
    <section className="target-section" aria-label={copy.targetTitle}>
      <div className="section-heading">
        <div>
          <h2>{copy.targetTitle}</h2>
          <p>{copy.targetSubtitle}</p>
        </div>
        <div className="button-group">
          <button type="button" className="secondary-button" onClick={onChooseFolder} disabled={isBusy}>
            <FolderOpen size={17} />
            {copy.select}
          </button>
        </div>
      </div>

      <div className="instruction-box">
        <Info size={17} />
        <span>
          {copy.instructionPrefix} <strong>{"Steam\\userdata\\<SEU_ID>\\570\\remote\\cfg"}</strong>. {copy.instructionSuffix}
        </span>
      </div>

      {detectedFolders.length > 1 && (
        <div className="detected-row">
          <label htmlFor="detected-folder">{copy.accountLabel}</label>
          <select
            id="detected-folder"
            className="folder-select"
            value={selectedDetectedFolder}
            onChange={(event) => onChooseDetectedFolder(event.target.value)}
            disabled={isBusy || isDetecting}
          >
            <option value="">{copy.accountPlaceholder}</option>
            {detectedFolders.map((folder) => (
              <option key={folder.cfgPath} value={folder.cfgPath}>
                {folder.steamId} {folder.hasHeroGrid ? "- hero_grid_config.json" : "- cfg encontrada"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="path-row">
        <code>{targetFolder || copy.selectedPathPlaceholder}</code>
      </div>
    </section>
  );
}
