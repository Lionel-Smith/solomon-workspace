"use client";

/**
 * usePipelineData — owns pipeline state, loading, checkpoint, and actions.
 *
 * Combines initial data fetch, WebSocket-driven refetch on terminal events,
 * checkpoint tracking, and the pause action.
 */

import { useEffect, useState, useCallback } from "react";
import { getPipeline, pausePipeline } from "@/lib/api/pipelines";
import { getCheckpoints } from "@/lib/api/checkpoints";
import type { Pipeline, Checkpoint, PipelineEvent } from "@/lib/api/types";

export interface UsePipelineDataResult {
  pipeline: Pipeline | null;
  loading: boolean;
  pendingCheckpoint: Checkpoint | null;
  handlePause: () => Promise<void>;
  handleCheckpointResolved: () => void;
}

export function usePipelineData(
  id: string,
  events: PipelineEvent[],
): UsePipelineDataResult {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [pendingCheckpoint, setPendingCheckpoint] = useState<Checkpoint | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Initial data fetch
  useEffect(() => {
    async function load() {
      try {
        const [p, cps] = await Promise.all([
          getPipeline(id),
          getCheckpoints(id),
        ]);
        setPipeline(p);
        const pending = cps.find((c) => c.status === "pending");
        setPendingCheckpoint(pending ?? null);
      } catch {
        // API error — leave pipeline null
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Update pipeline status from WebSocket events
  useEffect(() => {
    const latest = events[0];
    if (!latest || !pipeline) return;

    if (
      latest.type === "pipeline_completed" ||
      latest.type === "pipeline_failed"
    ) {
      // Refetch to get final state
      getPipeline(id).then(setPipeline).catch(() => {});
    }
    if (latest.type === "checkpoint_pending") {
      getCheckpoints(id).then((cps) => {
        const pending = cps.find((c) => c.status === "pending");
        setPendingCheckpoint(pending ?? null);
      }).catch(() => {});
    }
    if (
      latest.type === "checkpoint_approved" ||
      latest.type === "checkpoint_rejected"
    ) {
      setPendingCheckpoint(null);
    }
  }, [events, id, pipeline]);

  const handlePause = useCallback(async () => {
    const updated = await pausePipeline(id);
    setPipeline(updated);
  }, [id]);

  const handleCheckpointResolved = useCallback(() => {
    setPendingCheckpoint(null);
    getPipeline(id).then(setPipeline).catch(() => {});
  }, [id]);

  return { pipeline, loading, pendingCheckpoint, handlePause, handleCheckpointResolved };
}
