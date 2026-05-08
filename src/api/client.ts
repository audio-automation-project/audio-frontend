const CORE_BASE_URL = import.meta.env.VITE_CORE_API_URL ?? "http://localhost:8088";
const SILENCE_BASE_URL = import.meta.env.VITE_SILENCE_API_URL ?? "http://localhost:8090";

/** Matches core API {@code JobLogResponse} JSON (Instant fields serialize as ISO-8601 strings). */
export interface JobLog {
  jobId: string;
  jobType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  summary?: string;
  errorMessage?: string;
}

/** Matches core {@code AudiobookDto}; {@code id} is PostgreSQL {@code library_audiobook.catalog_public_id} (UUID string). */
export interface AudiobookRow {
  id: string;
  bookId?: number;
  cycleId?: number;
  fileId?: string;
  title?: string;
  author?: string;
  narrator?: string;
  originalTitle?: string;
  part?: string;
  sourceLink?: string;
  duration?: number;
  uploadDate?: string;
  description?: string;
  coverImageIds?: string[];
  distributedTo?: {
    youtubeVideoId?: string;
    telegramFileId?: string;
  };
  processingStatus?: string;
}

/**
 * Polls the operational audiobook catalog from PostgreSQL via the core API (not Firestore).
 */
export function subscribeToAudiobooks(
  onUpdate: (rows: AudiobookRow[]) => void,
  pollIntervalMs = 8000
): () => void {
  let cancelled = false;

  async function poll() {
    try {
      const response = await fetch(`${CORE_BASE_URL}/api/v1/library/audiobooks`);
      if (!response.ok) {
        throw new Error(`audiobooks ${response.status}`);
      }
      const data = (await response.json()) as AudiobookRow[];
      if (!cancelled) {
        onUpdate(Array.isArray(data) ? data : []);
      }
    } catch {
      if (!cancelled) {
        onUpdate([]);
      }
    }
  }

  void poll();
  const timer = window.setInterval(() => void poll(), pollIntervalMs);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}

/** Polls {@code GET /api/v1/job-logs} (PostgreSQL); not Firestore. */
export function subscribeToJobLogs(
  onUpdate: (logs: JobLog[]) => void,
  maxCount = 50,
  pollIntervalMs = 5000
): () => void {
  let cancelled = false;

  async function poll() {
    try {
      const response = await fetch(`${CORE_BASE_URL}/api/v1/job-logs?limit=${maxCount}`);
      if (!response.ok) {
        throw new Error(`job-logs ${response.status}`);
      }
      const data = (await response.json()) as JobLog[];
      if (!cancelled) {
        onUpdate(Array.isArray(data) ? data : []);
      }
    } catch {
      if (!cancelled) {
        onUpdate([]);
      }
    }
  }

  void poll();
  const timer = window.setInterval(() => void poll(), pollIntervalMs);
  return () => {
    cancelled = true;
    window.clearInterval(timer);
  };
}

async function healthRequest(baseUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${baseUrl}/actuator/health`, {
      signal: controller.signal,
    });
    if (!response.ok) return `error (${response.status})`;
    return "ok";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "timeout";
    }
    return "offline-or-cors";
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getCoreHealth(): Promise<string> {
  return healthRequest(CORE_BASE_URL);
}

export function getSilenceHealth(): Promise<string> {
  return healthRequest(SILENCE_BASE_URL);
}
