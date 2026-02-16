"use client";

/**
 * AgentStepper — visual progress through Esther's 7-agent pipeline.
 *
 * Each node shows one of 5 states: pending, active, completed, failed, skipped.
 * Horizontal on desktop (md+), vertical on mobile.
 */

import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────

export type AgentStepStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "skipped";

export interface AgentStep {
  name: string;
  status: AgentStepStatus;
  /** Duration in milliseconds — only shown when completed. */
  durationMs?: number;
}

/** The canonical 7-agent pipeline order. */
export const AGENT_NAMES = [
  "Discovery",
  "Brand System",
  "Layout",
  "Component Library",
  "Code Generation",
  "Review",
  "Deployment Prep",
] as const;

// ── Helpers ─────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

// ── Icons (inline SVG to avoid extra deps) ──────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4 12 12M12 4 4 12" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Node styles ─────────────────────────────────────────────────────

const NODE_STYLES: Record<
  AgentStepStatus,
  { ring: string; bg: string; text: string }
> = {
  pending: {
    ring: "border-gray-300 dark:border-gray-600",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-400 dark:text-gray-500",
  },
  active: {
    ring: "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-600 dark:text-blue-400",
  },
  completed: {
    ring: "border-green-500",
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-600 dark:text-green-400",
  },
  failed: {
    ring: "border-red-500",
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-600 dark:text-red-400",
  },
  skipped: {
    ring: "border-dashed border-gray-300 dark:border-gray-600",
    bg: "bg-gray-50 dark:bg-gray-900",
    text: "text-gray-400 dark:text-gray-500",
  },
};

// ── Connector line ──────────────────────────────────────────────────

function Connector({ done }: { done: boolean }) {
  return (
    <>
      {/* Horizontal connector (md+) */}
      <div
        className={cn(
          "hidden md:block h-0.5 flex-1 min-w-4",
          done
            ? "bg-green-400 dark:bg-green-600"
            : "bg-gray-200 dark:bg-gray-700",
        )}
      />
      {/* Vertical connector (mobile) */}
      <div
        className={cn(
          "md:hidden w-0.5 h-6 ml-5",
          done
            ? "bg-green-400 dark:bg-green-600"
            : "bg-gray-200 dark:bg-gray-700",
        )}
      />
    </>
  );
}

// ── Single step node ────────────────────────────────────────────────

function StepNode({ step }: { step: AgentStep }) {
  const s = NODE_STYLES[step.status];

  return (
    <div className="flex items-center gap-2 md:flex-col md:items-center md:gap-1">
      {/* Circle */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
          s.ring,
          s.bg,
        )}
      >
        {step.status === "completed" && (
          <CheckIcon className={cn("h-5 w-5", s.text)} />
        )}
        {step.status === "failed" && (
          <XIcon className={cn("h-5 w-5", s.text)} />
        )}
        {step.status === "active" && (
          <Spinner className={cn("h-5 w-5", s.text)} />
        )}
      </div>

      {/* Label + duration */}
      <div className="md:text-center">
        <p
          className={cn(
            "text-xs font-medium leading-tight",
            step.status === "pending" || step.status === "skipped"
              ? "text-muted-foreground"
              : "text-foreground",
          )}
        >
          {step.name}
        </p>
        {step.status === "completed" && step.durationMs != null && (
          <p className="text-[10px] tabular-nums text-muted-foreground">
            {formatDuration(step.durationMs)}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────

export function AgentStepper({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.name} className="contents">
          <StepNode step={step} />
          {i < steps.length - 1 && (
            <Connector done={step.status === "completed"} />
          )}
        </div>
      ))}
    </div>
  );
}
