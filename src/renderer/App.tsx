import { AlertTriangle, CheckCircle2, Download, ExternalLink, FolderOpen, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DownloadResult, DownloadStatus, MetaMode } from "../shared/types";
import { META_MODE_LABELS } from "../shared/types";

const MODES: Array<{
  mode: MetaMode;
  title: string;
  description: string;
}> = [
  {
    mode: "most-played",
    title: "Most Played",
    description: "Top 7 herois mais escolhidos por funcao no patch atual."
  },
  {
    mode: "high-winrate",
    title: "High Winrate",
    description: "Herois populares filtrados por mais de 50% de winrate."
  },
  {
    mode: "d2pt-rating",
    title: "D2PT Rating",
    description: "Ranking pelo sistema de avaliacao do Dota2ProTracker."
  }
];

export default function App() {
  const [targetFolder, setTargetFolder] = useState<string>("");
  const [status, setStatus] = useState<DownloadStatus | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<MetaMode | null>(null);

  const isBusy = activeMode !== null;
  const folderWarning = useMemo(() => {
    if (!targetFolder) {
      return null;
    }

    return /steam[\\/]userdata[\\/][^\\/]+[\\/]570[\\/]remote[\\/]cfg$/i.test(targetFolder)
      ? null
      : "A pasta selecionada nao parece ser a pasta cfg do Dota 2.";
  }, [targetFolder]);

  useEffect(() => {
    window.d2pt.getSettings().then((settings) => {
      if (settings.targetFolder) {
        setTargetFolder(settings.targetFolder);
      }
    });

    return window.d2pt.onDownloadStatus((nextStatus) => {
      setStatus(nextStatus);
    });
  }, []);

  async function chooseFolder() {
    const selected = await window.d2pt.selectTargetFolder();
    if (!selected) {
      return;
    }

    setTargetFolder(selected);
    await window.d2pt.saveSettings({ targetFolder: selected });
  }

  async function openFolder() {
    if (targetFolder) {
      await window.d2pt.openTargetFolder(targetFolder);
    }
  }

  async function download(mode: MetaMode) {
    if (!targetFolder || isBusy) {
      return;
    }

    setActiveMode(mode);
    setError(null);
    setResult(null);
    setStatus({ phase: "loading-page", message: `Preparando ${META_MODE_LABELS[mode]}...` });

    try {
      const nextResult = await window.d2pt.downloadMetaGrid({ mode, targetFolder });
      setResult(nextResult);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Falha inesperada ao baixar o Hero Grid.";
      setError(message);
    } finally {
      setActiveMode(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <h1>Dota2ProTracker Meta Grid</h1>
          <p>Baixe o meta atual direto para o Hero Grid do Dota 2.</p>
        </div>
        <ShieldCheck className="toolbar-icon" aria-hidden="true" />
      </section>

      <section className="target-section" aria-label="Pasta de destino">
        <div className="section-heading">
          <h2>Pasta de destino</h2>
          <button type="button" className="secondary-button" onClick={chooseFolder} disabled={isBusy}>
            <FolderOpen size={18} />
            Selecionar
          </button>
        </div>

        <div className="path-row">
          <code>{targetFolder || "Nenhuma pasta selecionada"}</code>
          <button type="button" className="icon-button" onClick={openFolder} disabled={!targetFolder || isBusy} title="Abrir pasta">
            <ExternalLink size={18} />
          </button>
        </div>

        {folderWarning && (
          <p className="warning-line">
            <AlertTriangle size={17} />
            {folderWarning}
          </p>
        )}
      </section>

      <section className="mode-grid" aria-label="Modos de Hero Grid">
        {MODES.map((item) => (
          <article className="mode-card" key={item.mode}>
            <div>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => download(item.mode)}
              disabled={!targetFolder || isBusy}
            >
              {activeMode === item.mode ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
              Baixar
            </button>
          </article>
        ))}
      </section>

      <section className="status-section" aria-live="polite">
        <h2>Status</h2>
        <StatusBody status={status} result={result} error={error} />
      </section>
    </main>
  );
}

function StatusBody({
  status,
  result,
  error
}: {
  status: DownloadStatus | null;
  result: DownloadResult | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="status-box error">
        <AlertTriangle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  if (result) {
    return (
      <div className="result-stack">
        <div className="status-box success">
          <CheckCircle2 size={20} />
          <span>Salvo em {result.destinationPath}</span>
        </div>
        {result.backupPath && <p>Backup criado: {result.backupPath}</p>}
        {result.warning && <p className="warning-text">{result.warning}</p>}
        <p>
          Arquivo: {(result.fileSizeBytes / 1024).toFixed(1)} KB - {new Date(result.savedAt).toLocaleString()}
        </p>
      </div>
    );
  }

  if (status) {
    return (
      <div className="status-box neutral">
        {status.phase === "done" ? <CheckCircle2 size={20} /> : <Loader2 size={20} className="spin" />}
        <span>{status.message}</span>
      </div>
    );
  }

  return <p className="muted">Selecione uma pasta e escolha um modo para baixar.</p>;
}
