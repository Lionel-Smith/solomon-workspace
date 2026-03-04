"use client";

/**
 * PipelineHeader — title, status badge, elapsed time, live indicator,
 * and action buttons (pause / resume / back).
 */

import { useRouter } from "next/navigation";
import { PipelineStatusBadge } from "@/components/pipeline-status-badge";
import { Button } from "@/components/ui/button";
import type { Pipeline } from "@/lib/api/types";

function elapsed(pipeline: Pipeline): string {
  const start = new Date(pipeline.created_at).getTime();
  const end = pipeline.completed_at
    ? new Date(pipeline.completed_at).getTime()
    : Date.now();
  const mins = Math.round((end - start) / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface PipelineHeaderProps {
  pipeline: Pipeline;
  isConnected: boolean;
  onPause: () => void;
}

export function PipelineHeader({
  pipeline,
  isConnected,
  onPause,
}: PipelineHeaderProps) {
  const router = useRouter();
  const isRunning = pipeline.status === "running";
  const isPaused = pipeline.status === "paused_at_checkpoint";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {pipeline.project_name}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
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
          <Button variant="outline" size="sm" onClick={onPause}>
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
  );
}
