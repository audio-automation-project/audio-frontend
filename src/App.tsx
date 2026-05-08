import { useEffect, useMemo, useState } from "react";
import {
  getCoreHealth,
  getSilenceHealth,
  subscribeToAudiobooks,
  subscribeToJobLogs,
  type AudiobookRow,
  type JobLog,
} from "./api/client";

type Page = "dashboard" | "jobs" | "library" | "health" | "logs";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [health, setHealth] = useState<{ core: string; silence: string } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [jobLogs, setJobLogs] = useState<JobLog[]>([]);
  const [audiobooks, setAudiobooks] = useState<AudiobookRow[]>([]);

  useEffect(() => {
    const unsub = subscribeToJobLogs(setJobLogs);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToAudiobooks(setAudiobooks);
    return unsub;
  }, []);

  const title = useMemo(() => {
    if (page === "jobs") return "Jobs and Tasks";
    if (page === "library") return "Library (PostgreSQL)";
    if (page === "health") return "Service Health";
    if (page === "logs") return "Logs and Validation";
    return "Platform Dashboard";
  }, [page]);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const [core, silence] = await Promise.all([getCoreHealth(), getSilenceHealth()]);
      setHealth({ core, silence });
      setPage("health");
    } finally {
      setCheckingHealth(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Audio Automation Platform</h1>
          <button
            type="button"
            onClick={checkHealth}
            disabled={checkingHealth}
            className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium hover:bg-indigo-400"
          >
            {checkingHealth ? "Checking..." : "Check Services"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-lg border border-slate-800 bg-slate-900 p-4 md:col-span-3">
          <nav className="space-y-2">
            <Tab label="Dashboard" active={page === "dashboard"} onClick={() => setPage("dashboard")} />
            <Tab label="Jobs" active={page === "jobs"} onClick={() => setPage("jobs")} />
            <Tab label="Library" active={page === "library"} onClick={() => setPage("library")} />
            <Tab label="Service Health" active={page === "health"} onClick={() => setPage("health")} />
            <Tab label="Logs" active={page === "logs"} onClick={() => setPage("logs")} />
          </nav>
        </aside>

        <section className="col-span-12 rounded-lg border border-slate-800 bg-slate-900 p-5 md:col-span-9">
          <h2 className="mb-4 text-xl font-semibold">{title}</h2>
          {page === "dashboard" && (
            <div className="space-y-3 text-sm text-slate-300">
              <p>Use this console to operate core audio automation workflows.</p>
              <p className="text-slate-400">
                Operational catalog and jobs load from the core REST API (PostgreSQL). Firestore is server-side mirror only
                when enabled; the browser never reads Firestore for these views.
              </p>
            </div>
          )}
          {page === "jobs" && <JobLogPanel logs={jobLogs} />}
          {page === "library" && <AudiobookPanel rows={audiobooks} />}
          {page === "logs" && <p>Inspect validation results, execution logs, and error traces.</p>}
          {page === "health" && (
            <div className="space-y-2">
              <p>Core backend: {health?.core ?? "unknown"}</p>
              <p>Silence service: {health?.silence ?? "unknown"}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "text-yellow-400",
  PENDING: "text-yellow-400",
  IN_PROGRESS: "text-yellow-400",
  COMPLETED: "text-green-400",
  FAILED: "text-red-400",
};

function AudiobookPanel({ rows }: { rows: AudiobookRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        No audiobooks loaded yet, or the core API is unreachable. Data comes from{" "}
        <code className="rounded bg-slate-800 px-1">GET /api/v1/library/audiobooks</code> (PostgreSQL{" "}
        <code className="rounded bg-slate-800 px-1">library_audiobook</code>), polled every few seconds.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="rounded-md border border-slate-700 bg-slate-800 p-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">{row.title?.trim() ? row.title : "(untitled)"}</span>
            <span className="text-xs text-slate-400">{row.processingStatus ?? "—"}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            id <code className="text-slate-300">{row.id}</code>
            {row.fileId && (
              <>
                {" "}
                · file <code className="text-slate-300">{row.fileId}</code>
              </>
            )}
          </div>
          {(row.author || row.narrator) && (
            <div className="mt-1 text-xs text-slate-300">
              {[row.author, row.narrator].filter(Boolean).join(" · ")}
            </div>
          )}
          {distributionPlatforms(row.distributedTo).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {distributionPlatforms(row.distributedTo).map((label) => (
                <span
                  key={label}
                  className="rounded bg-emerald-900/50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-200"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function distributionPlatforms(d: AudiobookRow["distributedTo"]): string[] {
  if (!d) return [];
  const labels: string[] = [];
  if (d.youtubeVideoId?.trim()) labels.push("YouTube");
  if (d.telegramFileId?.trim()) labels.push("Telegram");
  return labels;
}

function JobLogPanel({ logs }: { logs: JobLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="text-slate-400 text-sm">
        No job logs yet. Entries load from the core API and refresh every few seconds.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.jobId} className="rounded-md border border-slate-700 bg-slate-800 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{log.jobType}</span>
            <span className={STATUS_COLORS[log.status] ?? "text-slate-300"}>{log.status}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {log.startedAt}
            {log.completedAt && ` → ${log.completedAt}`}
          </div>
          {log.summary && <div className="mt-1 text-xs text-slate-300">{log.summary}</div>}
          {log.errorMessage && (
            <div className="mt-1 text-xs text-red-400">{log.errorMessage}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`w-full rounded-md px-3 py-2 text-left text-sm ${
        active ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
