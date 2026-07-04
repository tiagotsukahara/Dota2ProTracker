import { Download, Loader2 } from "lucide-react";
import type { MetaMode } from "../../shared/types";
import type { ModeCopy } from "../i18n";

export interface ModeOption extends ModeCopy {
  mode: MetaMode;
}

interface ModeGridProps {
  title: string;
  subtitle: string;
  downloadLabel: string;
  modes: ModeOption[];
  activeMode: MetaMode | null;
  isDisabled: boolean;
  onDownload: (mode: MetaMode) => void;
}

export function ModeGrid({ title, subtitle, downloadLabel, modes, activeMode, isDisabled, onDownload }: ModeGridProps) {
  return (
    <section className="mode-grid" aria-label={title}>
      <div className="section-heading compact">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {modes.map((item) => (
        <article className="mode-row" key={item.mode}>
          <div>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </div>
          <button type="button" className="primary-button" onClick={() => onDownload(item.mode)} disabled={isDisabled}>
            {activeMode === item.mode ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
            {downloadLabel}
          </button>
        </article>
      ))}
    </section>
  );
}
