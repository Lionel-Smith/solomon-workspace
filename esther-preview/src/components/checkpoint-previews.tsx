/**
 * Checkpoint preview renderers — type-specific content display
 * for each checkpoint_type variant.
 */

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ColorSwatchGrid } from "@/components/brand/color-swatch-grid";
import { TypographySamples } from "@/components/brand/typography-samples";
import { ContrastMatrix } from "@/components/brand/contrast-matrix";
import type { CheckpointType } from "@/lib/api/types";

// ── Preview dispatcher ──────────────────────────────────────────────

export function CheckpointPreview({
  type,
  data,
}: {
  type: CheckpointType;
  data: Record<string, unknown>;
}) {
  switch (type) {
    case "brief_approval":
      return <BriefPreview data={data} />;
    case "brand_approval":
      return <BrandPreview data={data} />;
    case "layout_approval":
      return <LayoutPreview data={data} />;
    case "final_review":
      return <FinalReviewPreview data={data} />;
  }
}

// ── Type labels ─────────────────────────────────────────────────────

export const TYPE_LABELS: Record<CheckpointType, string> = {
  brief_approval: "Brief Approval",
  brand_approval: "Brand System Approval",
  layout_approval: "Layout Approval",
  final_review: "Final Review",
};

// ── Individual preview renderers ────────────────────────────────────

function BriefPreview({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-3">
      {typeof data.project_name === "string" && (
        <div>
          <p className="text-xs text-muted-foreground">Project</p>
          <p className="text-sm font-medium">{data.project_name}</p>
        </div>
      )}
      {typeof data.intent === "string" && (
        <div>
          <p className="text-xs text-muted-foreground">Intent</p>
          <Badge variant="secondary">{data.intent}</Badge>
        </div>
      )}
      {typeof data.brief_text === "string" && (
        <div>
          <p className="text-xs text-muted-foreground">Brief</p>
          <p className="text-sm whitespace-pre-wrap">{data.brief_text}</p>
        </div>
      )}
      {Array.isArray(data.extracted_requirements) && (
        <div>
          <p className="text-xs text-muted-foreground">Extracted Requirements</p>
          <ul className="list-disc pl-4 text-sm space-y-1">
            {(data.extracted_requirements as string[]).map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BrandPreview({ data }: { data: Record<string, unknown> }) {
  const colors = (data.colors as Array<{ name: string; hex: string; contrastOnWhite?: number }>) ?? [];
  const typography = data.typography as {
    heading: { family: string; weights: number[] };
    body: { family: string; weights: number[] };
    mono?: { family: string; weights: number[] };
  } | undefined;
  const contrastEntries = (data.contrast_matrix as Array<{
    fg: string; fgHex: string; bg: string; bgHex: string; ratio: number;
  }>) ?? [];
  const colorNames = colors.map((c) => c.name);

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Color Palette</h4>
          <ColorSwatchGrid colors={colors} />
        </div>
      )}

      {typography && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-3">Typography</h4>
            <TypographySamples spec={typography} />
          </div>
        </>
      )}

      {contrastEntries.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-semibold mb-3">Contrast Matrix</h4>
            <ContrastMatrix entries={contrastEntries} colors={colorNames} />
          </div>
        </>
      )}
    </div>
  );
}

function LayoutPreview({ data }: { data: Record<string, unknown> }) {
  const previewUrl = data.preview_url as string | undefined;
  return (
    <div className="space-y-3">
      {previewUrl ? (
        <iframe
          src={previewUrl}
          title="Layout Preview"
          sandbox="allow-scripts allow-same-origin"
          className="h-[400px] w-full rounded-lg border"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Layout preview data not available.
        </p>
      )}
    </div>
  );
}

function FinalReviewPreview({ data }: { data: Record<string, unknown> }) {
  const wcagScore = data.wcag_score as number | undefined;
  const qualityScore = data.quality_score as number | undefined;
  const tokenAdherence = data.token_adherence_score as number | undefined;
  const issues = (data.issues as Array<{ severity: string; message: string }>) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {wcagScore != null && (
          <ScoreCard label="WCAG" score={wcagScore} />
        )}
        {qualityScore != null && (
          <ScoreCard label="Quality" score={qualityScore} />
        )}
        {tokenAdherence != null && (
          <ScoreCard label="Token Adherence" score={tokenAdherence} />
        )}
      </div>

      {issues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">
            Issues ({issues.length})
          </h4>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge
                  variant="secondary"
                  className={
                    issue.severity === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }
                >
                  {issue.severity}
                </Badge>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90
      ? "text-green-600"
      : pct >= 70
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{pct}%</p>
    </div>
  );
}
