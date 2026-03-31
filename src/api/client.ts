const CORE_BASE_URL = import.meta.env.VITE_CORE_API_URL ?? "http://localhost:8088";
const SILENCE_BASE_URL = import.meta.env.VITE_SILENCE_API_URL ?? "http://localhost:8090";

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
