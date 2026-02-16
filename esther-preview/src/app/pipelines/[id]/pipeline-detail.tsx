"use client";

/**
 * PipelineDetail — Client Component with real-time WebSocket updates.
 *
 * Shows: header, agent stepper, action buttons, and checkpoint panel.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  AgentStepper,
  AGENT_NAMES,
  type AgentStep,
} from "@/components/agent-stepper";
import { PipelineStatusBadge } from "@/components/pipeline-status-badge";
import { CheckpointPanel } from "@/components/checkpoint-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPipeline, pausePipeline } from "@/lib/api/pipelines";
import { getCheckpoints } from "@/lib/api/checkpoints";
import type { Pipeline, Checkpoint, PipelineEvent } from "@/lib/api/types";

// ── Helpers ─────────────────────────────────────────────────────────

function buildSteps(
  pipeline: Pipeline,
  events: PipelineEvent[],
): AgentStep[] {
  const completedAgents = new Map<string, number>();
  const failedAgents = new Set<string>();
  let activeAgent: string | null = null;

  // Process events oldest-first to build state
  for (const evt of [...events].reverse()) {
    if (evt.type === "agent_completed" && evt.agent) {
      const dur =
        (evt.data as { duration_ms?: number } | undefined)?.duration_ms ?? 0;
      completedAgents.set(evt.agent, dur);
    }
    if (evt.type === "agent_failed" && evt.agent) {
      failedAgents.add(evt.agent);
    }
    if (evt.type === "agent_started" && evt.agent) {
      activeAgent = evt.agent;
    }
  }

  // If no events, use pipeline.current_agent
  if (!activeAgent && pipeline.status === "running") {
    activeAgent = pipeline.current_agent;
  }

  return AGENT_NAMES.map((name) => {
    const key = name.toLowerCase().replace(/ /g, "_");
    if (completedAgents.has(key)) {
      return {
        name,
        status: "completed" as const,
        durationMs: completedAgents.get(key),
      };
    }
    if (failedAgents.has(key)) return { name, status: "failed" as const };
    if (activeAgent === key) return { name, status: "active" as const };
    if (pipeline.status === "cancelled") return { name, status: "skipped" as const };
    return { name, status: "pending" as const };
  });
}

function elapsed(pipeline: Pipeline): string {
  const start = new Date(pipeline.created_at).getTime();
  const end = pipeline.completed_at
    ? new Date(pipeline.completed_at).getTime()
    : Date.now();
  const mins = Math.round((end - start) / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ── Component ───────────────────────────────────────────────────────

export function PipelineDetail({ id }: { id: string }) {
  const router = useRouter();
  const { events, isConnected } = useWebSocket(id);
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

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-muted-foreground">Loading pipeline...</p>
      </main>
    );
  }

  if (!pipeline) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p className="text-destructive">Pipeline not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </main>
    );
  }

  const steps = buildSteps(pipeline, events);
  const isRunning = pipeline.status === "running";
  const isPaused = pipeline.status === "paused_at_checkpoint";

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pipeline.project_name}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <PipelineStatusBadge status={pipeline.status} />
            <span className="text-sm text-muted-foreground">
              {elapsed(pipeline)}
            </span>
            {isConnected && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {isRunning && (
            <Button variant="outline" size="sm" onClick={handlePause}>
              Pause
            </Button>
          )}
          {isPaused && (
            <Button size="sm" onClick={() => router.refresh()}>
              Resume
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/pipelines")}
          >
            Back
          </Button>
        </div>
      </div>

      {/* Agent Stepper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Agent Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentStepper steps={steps} />
        </CardContent>
      </Card>

      {/* Checkpoint Panel */}
      {pendingCheckpoint && (
        <CheckpointPanel
          checkpoint={pendingCheckpoint}
          onResolved={handleCheckpointResolved}
        />
      )}

      {/* Event log */}
      {events.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm font-mono">
              {events.slice(0, 20).map((evt, i) => (
                <li key={i} className="text-muted-foreground">
                  <span className="text-xs opacity-60">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>{" "}
                  <span className="text-foreground">{evt.type}</span>
                  {evt.agent && (
                    <span className="text-blue-500"> {evt.agent}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
