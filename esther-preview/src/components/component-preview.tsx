"use client";

/**
 * ComponentPreview — sandboxed iframe for previewing generated components.
 *
 * Loads content from a presigned DO Spaces URL.
 * Includes responsive viewport toggle and loading/error states.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ── Viewport presets ────────────────────────────────────────────────

const VIEWPORTS = [
  { label: "Mobile", width: 375, icon: "📱" },
  { label: "Tablet", width: 768, icon: "📋" },
  { label: "Desktop", width: 1280, icon: "🖥" },
] as const;

type ViewportLabel = (typeof VIEWPORTS)[number]["label"];

// ── Component ───────────────────────────────────────────────────────

interface Props {
  /** Presigned URL to the component preview HTML. */
  src: string;
  /** Display title for the preview. */
  title?: string;
  /** Initial viewport. */
  defaultViewport?: ViewportLabel;
}

export function ComponentPreview({
  src,
  title = "Preview",
  defaultViewport = "Desktop",
}: Props) {
  const [viewport, setViewport] = useState<ViewportLabel>(defaultViewport);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const activeVp = VIEWPORTS.find((v) => v.label === viewport)!;

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setLoaded(true);
    setError(true);
  }, []);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <div className="flex gap-1">
          {VIEWPORTS.map((vp) => (
            <Button
              key={vp.label}
              variant={viewport === vp.label ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setViewport(vp.label);
                setLoaded(false);
                setError(false);
              }}
            >
              {vp.icon} {vp.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Iframe container */}
      <div className="relative mx-auto overflow-hidden rounded-lg border bg-white">
        {/* Loading skeleton */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        )}

        {/* Error fallback */}
        {error && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Preview unavailable
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                The component preview could not be loaded.
              </p>
            </div>
          </div>
        )}

        {/* Iframe */}
        {!error && (
          <iframe
            src={src}
            title={title}
            sandbox="allow-scripts allow-same-origin"
            className={cn(
              "mx-auto block h-[500px] transition-opacity",
              loaded ? "opacity-100" : "opacity-0",
            )}
            style={{ width: activeVp.width }}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
