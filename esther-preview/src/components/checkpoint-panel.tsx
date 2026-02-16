"use client";

/**
 * CheckpointPanel — inline approval UI for pending pipeline checkpoints.
 *
 * Renders different preview data based on checkpoint_type, with
 * Approve / Reject actions.
 */

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ColorSwatchGrid } from "@/components/brand/color-swatch-grid";
import { TypographySamples } from "@/components/brand/typography-samples";
import { ContrastMatrix } from "@/components/brand/contrast-matrix";
import { toast } from "sonner";
import { approveCheckpoint, rejectCheckpoint } from "@/lib/api/checkpoints";
import type { Checkpoint, CheckpointType } from "@/lib/api/types";

// ── Checkpoint type labels ──────────────────────────────────────────

const TYPE_LABELS: Record<CheckpointType, string> = {
  brief_approval: "Brief Approval",
  brand_approval: "Brand System Approval",
  layout_approval: "Layout Approval",
  final_review: "Final Review",
};

// ── Preview renderers by checkpoint type ────────────────────────────

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

function FinalReviewPreview({ data }: { data: Record<string, unknown> }) {
  const wcagScore = data.wcag_score as number | undefined;
  const qualityScore = data.quality_score as number | undefined;
  const tokenAdherence = data.token_adherence_score as number | undefined;
  const issues = (data.issues as Array<{ severity: string; message: string }>) ?? [];

  return (
    <div className="space-y-4">
      {/* Score cards */}
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

      {/* Issues */}
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

// ── Main component ──────────────────────────────────────────────────

interface Props {
  checkpoint: Checkpoint;
  onResolved: () => void;
}

export function CheckpointPanel({ checkpoint, onResolved }: Props) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = useCallback(async () => {
    setSubmitting(true);
    try {
      await approveCheckpoint(checkpoint.id, {
        approved_by: "dashboard_user",
      });
      toast.success("Checkpoint approved", {
        description: TYPE_LABELS[checkpoint.checkpoint_type],
      });
      onResolved();
    } catch {
      toast.error("Failed to approve checkpoint");
    } finally {
      setSubmitting(false);
    }
  }, [checkpoint.id, checkpoint.checkpoint_type, onResolved]);

  const handleReject = useCallback(async () => {
    setSubmitting(true);
    try {
      await rejectCheckpoint(checkpoint.id, {
        rejected_by: "dashboard_user",
        reason: rejectReason || "Rejected from dashboard",
      });
      toast.info("Checkpoint rejected", {
        description: "Pipeline will retry with your feedback.",
      });
      onResolved();
    } catch {
      toast.error("Failed to reject checkpoint");
    } finally {
      setSubmitting(false);
    }
  }, [checkpoint.id, rejectReason, onResolved]);

  const previewData = checkpoint.preview_data ?? {};

  return (
    <Card className="border-yellow-300 dark:border-yellow-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {TYPE_LABELS[checkpoint.checkpoint_type]}
          </CardTitle>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            Awaiting Review
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview content — dispatched by type */}
        {checkpoint.checkpoint_type === "brief_approval" && (
          <BriefPreview data={previewData} />
        )}
        {checkpoint.checkpoint_type === "brand_approval" && (
          <BrandPreview data={previewData} />
        )}
        {checkpoint.checkpoint_type === "layout_approval" && (
          <LayoutPreview data={previewData} />
        )}
        {checkpoint.checkpoint_type === "final_review" && (
          <FinalReviewPreview data={previewData} />
        )}

        <Separator />

        {/* Actions */}
        {!showRejectForm ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={submitting}
            >
              {submitting ? "Approving..." : "Approve"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRejectForm(true)}
              disabled={submitting}
            >
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for rejection or revision hints..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting ? "Rejecting..." : "Confirm Reject"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
