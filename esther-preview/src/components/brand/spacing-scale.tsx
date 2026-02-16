"use client";

/**
 * SpacingScale — visual representation of the design system spacing scale.
 */

interface SpacingStep {
  name: string;
  px: number;
}

export function SpacingScale({ steps }: { steps: SpacingStep[] }) {
  const maxPx = Math.max(...steps.map((s) => s.px), 1);

  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.name} className="flex items-center gap-3">
          <span className="w-12 shrink-0 text-right text-xs font-mono text-muted-foreground">
            {step.name}
          </span>
          <div
            className="h-4 rounded bg-blue-400 dark:bg-blue-600 transition-all"
            style={{ width: `${(step.px / maxPx) * 100}%`, minWidth: 2 }}
          />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {step.px}px
          </span>
        </div>
      ))}
    </div>
  );
}
