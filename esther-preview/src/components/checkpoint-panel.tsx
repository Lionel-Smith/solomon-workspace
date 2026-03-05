"use client";

/**
 * CheckpointPanel — Thin orchestrator composing preview and action sub-components.
 *
 * Preview dispatch: CheckpointPreview (type-specific renderers)
 * Actions:          CheckpointActions (approve/reject with reject form)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckpointPreview, TYPE_LABELS } from "@/components/checkpoint-previews";
import { CheckpointActions } from "@/components/checkpoint-actions";
import type { Checkpoint } from "@/lib/api/types";

interface Props {
  checkpoint: Checkpoint;
  onResolved: () => void;
}

export function CheckpointPanel({ checkpoint, onResolved }: Props) {
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
        <CheckpointPreview
          type={checkpoint.checkpoint_type}
          data={previewData}
        />

        <Separator />

        <CheckpointActions
          checkpointId={checkpoint.id}
          checkpointType={checkpoint.checkpoint_type}
          onResolved={onResolved}
        />
      </CardContent>
    </Card>
  );
}
