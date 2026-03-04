"use client";

/**
 * usePipelineSteps — derives agent step states from pipeline + events.
 *
 * Memoized computation that converts raw WebSocket events into the
 * ordered step list consumed by AgentStepper.
 */

import { useMemo } from "react";
import {
  AGENT_NAMES,
  type AgentStep,
} from "@/components/agent-stepper";
import type { Pipeline, PipelineEvent } from "@/lib/api/types";

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

export function usePipelineSteps(
  pipeline: Pipeline | null,
  events: PipelineEvent[],
): AgentStep[] {
  return useMemo(
    () => (pipeline ? buildSteps(pipeline, events) : []),
    [pipeline, events],
  );
}
