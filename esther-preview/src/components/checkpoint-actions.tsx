"use client";

/**
 * CheckpointActions — Approve/Reject action form for pending checkpoints.
 *
 * Owns: reject form toggle, textarea state, and API submission.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { approveCheckpoint, rejectCheckpoint } from "@/lib/api/checkpoints";
import type { CheckpointType } from "@/lib/api/types";
import { TYPE_LABELS } from "@/components/checkpoint-previews";

interface CheckpointActionsProps {
  checkpointId: string;
  checkpointType: CheckpointType;
  onResolved: () => void;
}

export function CheckpointActions({
  checkpointId,
  checkpointType,
  onResolved,
}: CheckpointActionsProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = useCallback(async () => {
    setSubmitting(true);
    try {
      await approveCheckpoint(checkpointId, {
        approved_by: "dashboard_user",
      });
      toast.success("Checkpoint approved", {
        description: TYPE_LABELS[checkpointType],
      });
      onResolved();
    } catch {
      toast.error("Failed to approve checkpoint");
    } finally {
      setSubmitting(false);
    }
  }, [checkpointId, checkpointType, onResolved]);

  const handleReject = useCallback(async () => {
    setSubmitting(true);
    try {
      await rejectCheckpoint(checkpointId, {
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
  }, [checkpointId, rejectReason, onResolved]);

  if (!showRejectForm) {
    return (
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
    );
  }

  return (
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
  );
}
