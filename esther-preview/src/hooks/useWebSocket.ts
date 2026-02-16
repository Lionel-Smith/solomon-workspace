"use client";

/**
 * useWebSocket — subscribe to real-time pipeline events.
 *
 * Connects to the cloud WebSocket endpoint for a given pipeline and
 * delivers typed PipelineEvent objects.  Auto-reconnects with
 * exponential backoff (1 s → 2 s → 4 s … max 30 s).
 */

import { useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import type { PipelineEvent } from "@/lib/api/types";

const INITIAL_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const BACKOFF_FACTOR = 2;

export interface UseWebSocketResult {
  /** Most-recent-first event log for this pipeline. */
  events: PipelineEvent[];
  /** Whether the socket is currently open. */
  isConnected: boolean;
  /** Last error (reset on successful reconnect). */
  error: string | null;
}

export function useWebSocket(
  pipelineId: string | null,
): UseWebSocketResult {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pipelineId) return;

    let delay = INITIAL_DELAY_MS;
    let disposed = false;

    function connect() {
      if (disposed) return;

      const ws = new WebSocket(
        `${config.wsBaseUrl}/ws/pipelines/${pipelineId}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        delay = INITIAL_DELAY_MS;
      };

      ws.onmessage = (evt) => {
        try {
          const event = JSON.parse(evt.data) as PipelineEvent;
          setEvents((prev) => [event, ...prev]);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onerror = () => {
        setError("WebSocket error");
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!disposed) {
          retryRef.current = setTimeout(connect, delay);
          delay = Math.min(delay * BACKOFF_FACTOR, MAX_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      disposed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [pipelineId]);

  return { events, isConnected, error };
}
