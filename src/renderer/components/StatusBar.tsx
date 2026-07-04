import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import type { DownloadResult, DownloadStatus } from "../../shared/types";
import type { AppCopy } from "../i18n";

interface StatusBarProps {
  status: DownloadStatus | null;
  result: DownloadResult | null;
  error: string | null;
  alert: string | null;
  copy: AppCopy;
}

export function StatusBar({ status, result, error, alert, copy }: StatusBarProps) {
  return (
    <section className="status-section" aria-live="polite">
      <StatusBody status={status} result={result} error={error} alert={alert} copy={copy} />
    </section>
  );
}

function StatusBody({ status, result, error, alert, copy }: StatusBarProps) {
  if (error) {
    return (
      <div className="bottom-bar error">
        <AlertTriangle size={20} />
        <div>
          <strong>{copy.errorTitle}</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="bottom-bar success">
        <CheckCircle2 size={20} />
        <div>
          <strong title={result.destinationPath}>
            {copy.savedPrefix} {result.destinationPath}
          </strong>
          <span title={result.backupPath || undefined}>
            {result.backupPath ? `${copy.backupPrefix} ${result.backupPath}` : copy.noBackup}
          </span>
          <span>
            {copy.filePrefix} {(result.fileSizeBytes / 1024).toFixed(1)} KB - {new Date(result.savedAt).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }

  if (status) {
    return (
      <div className="bottom-bar neutral">
        {status.phase === "done" ? <CheckCircle2 size={20} /> : <Loader2 size={20} className="spin" />}
        <div>
          <strong>{copy.statusTitle}</strong>
          <span>{status.message}</span>
        </div>
      </div>
    );
  }

  if (alert) {
    return (
      <div className="bottom-bar warning">
        <AlertTriangle size={20} />
        <div>
          <strong>{copy.warningTitle}</strong>
          <span>{alert}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bottom-bar neutral">
      <Info size={20} />
      <div>
        <strong>{copy.readyTitle}</strong>
        <span>{copy.readyMessage}</span>
      </div>
    </div>
  );
}
