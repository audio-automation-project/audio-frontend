import { useMemo, useState } from "react";
import { getCoreHealth, getSilenceHealth } from "./api/client";

type Page = "dashboard" | "jobs" | "health" | "logs";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [health, setHealth] = useState<{ core: string; silence: string } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const title = useMemo(() => {
    if (page === "jobs") return "Jobs and Tasks";
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
            <Tab label="Service Health" active={page === "health"} onClick={() => setPage("health")} />
            <Tab label="Logs" active={page === "logs"} onClick={() => setPage("logs")} />
          </nav>
        </aside>

        <section className="col-span-12 rounded-lg border border-slate-800 bg-slate-900 p-5 md:col-span-9">
          <h2 className="mb-4 text-xl font-semibold">{title}</h2>
          {page === "dashboard" && <p>Use this console to operate core audio automation workflows.</p>}
          {page === "jobs" && <p>Track queued and running jobs from core and support services.</p>}
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
