/** Environment configuration — all external URLs and feature flags. */

export const config = {
  /** Esther cloud API base URL (hfs-aiops Quart server) */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000",

  /** WebSocket URL for real-time pipeline events */
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:5000",

  /** Auth cookie name (httpOnly, set by server) */
  authCookieName: "esther_token",
} as const;
