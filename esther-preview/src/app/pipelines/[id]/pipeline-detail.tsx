"use client";

/**
 * PipelineDetail — Thin orchestrator composing hooks and sub-components.
 *
 * State:        usePipelineData (fetch, WS-driven refetch, checkpoint, pause)
 * Derivation:   usePipelineSteps (events → agent step list)
 * Presentation: PipelineHeader, AgentStepper card, CheckpointPanel, EventLog
 */

import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { usePipelineData } from "@/hooks/usePipelineData";
import { usePipelineSteps } from "@/hooks/usePipelineSteps";
import { AgentStepper } from "@/components/agent-stepper";
import { CheckpointPanel } from "@/components/checkpoint-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PipelineHeader } from "./pipeline-header";
import { EventLog } from "./event-log";

export function PipelineDetail({ id }: { id: string }) {
  const router = useRouter();
  const { events, isConnected } = useWebSocket(id);
  const { pipeline, loading, pendingCheckpoint, handlePause, handleCheckpointResolved } =
    usePipelineData(id, events);
  const steps = usePipelineSteps(pipeline, events);

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

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PipelineHeader
        pipeline={pipeline}
        isConnected={isConnected}
        onPause={handlePause}
      />

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

      <EventLog events={events} />
    </main>
  );
}
