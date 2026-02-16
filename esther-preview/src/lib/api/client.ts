/** Typed fetch wrapper — all API calls flow through here. */

import { config } from "@/lib/config";
import type { ApiError } from "./types";

// ── Error class ─────────────────────────────────────────────────────

export class EstherApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EstherApiError";
  }
}

// ── Base helpers ────────────────────────────────────────────────────

function url(path: string): string {
  return `${config.apiBaseUrl}${path}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let body: ApiError | undefined;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // non-JSON error body — fall through
    }
    throw new EstherApiError(
      res.status,
      body?.code ?? "UNKNOWN",
      body?.message ?? res.statusText,
    );
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Public API ──────────────────────────────────────────────────────

interface FetchOptions {
  /** Extra headers (e.g. Cookie forwarded from server component). */
  headers?: Record<string, string>;
}

export async function get<T>(
  path: string,
  opts?: FetchOptions,
): Promise<T> {
  const res = await fetch(url(path), {
    credentials: "include",
    headers: { Accept: "application/json", ...opts?.headers },
  });
  return handleResponse<T>(res);
}

export async function post<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url(path), {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function put<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url(path), {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function del<T = void>(path: string): Promise<T> {
  const res = await fetch(url(path), {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return handleResponse<T>(res);
}
