import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const originalFetch = globalThis.fetch;

function stubFetchForDashboard() {
  globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : String(input);
    if (url.includes("/api/v1/job-logs")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    }
    return Promise.reject(new Error(`unmocked fetch: ${url}`));
  }) as unknown as typeof fetch;
}

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = originalFetch;
  cleanup();
});

describe("App", () => {
  beforeEach(() => {
    stubFetchForDashboard();
  });

  it("renders platform title", () => {
    render(<App />);
    expect(screen.getByText("Audio Automation Platform")).toBeInTheDocument();
  });

  it("switches to jobs page", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Jobs" })[0]);
    expect(screen.getByText("Jobs and Tasks")).toBeInTheDocument();
  });

  it("checks services and shows healthy state", async () => {
    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : String(input);
      if (url.includes("/api/v1/job-logs")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
      } as Response);
    }) as unknown as typeof fetch;

    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "Check Services" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Core backend: ok")).toBeInTheDocument();
      expect(screen.getByText("Silence service: ok")).toBeInTheDocument();
    });
  });
});
