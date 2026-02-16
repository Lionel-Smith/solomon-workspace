"use client";

/**
 * NewPipelineDialog — modal form for creating a new design pipeline.
 *
 * Fields: project name, brief (textarea), intent (select).
 * Validates with zod, POSTs to /pipelines, redirects to detail page.
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { startPipeline } from "@/lib/api/pipelines";
import type { PipelineIntent } from "@/lib/api/types";

// ── Validation ──────────────────────────────────────────────────────

const pipelineSchema = z.object({
  project_name: z.string().min(1, "Project name is required").max(100),
  brief_text: z.string().min(10, "Brief must be at least 10 characters").max(5000),
  intent: z.enum(["new_brand", "redesign", "component_library", "landing_page"]),
});

type PipelineForm = z.infer<typeof pipelineSchema>;

const INTENT_OPTIONS: { value: PipelineIntent; label: string }[] = [
  { value: "new_brand", label: "New Brand" },
  { value: "redesign", label: "Redesign" },
  { value: "component_library", label: "Component Library" },
  { value: "landing_page", label: "Landing Page" },
];

// ── Component ───────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewPipelineDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [briefText, setBriefText] = useState("");
  const [intent, setIntent] = useState<PipelineIntent>("new_brand");
  const [errors, setErrors] = useState<Partial<Record<keyof PipelineForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = pipelineSchema.safeParse({
      project_name: projectName,
      brief_text: briefText,
      intent,
    });

    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PipelineForm;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const pipeline = await startPipeline(result.data);
      toast.success("Pipeline created", {
        description: `${result.data.project_name} is now running.`,
      });
      onOpenChange(false);
      router.push(`/pipelines/${pipeline.id}`);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to create pipeline",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Pipeline</DialogTitle>
          <DialogDescription>
            Describe what you want Esther to design. The AI agents will take it
            from here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
          {/* Project Name */}
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. Sunrise Bakery"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            {errors.project_name && (
              <p className="text-xs text-destructive">{errors.project_name}</p>
            )}
          </div>

          {/* Intent */}
          <div className="grid gap-2">
            <Label>Design Intent</Label>
            <Select value={intent} onValueChange={(v) => setIntent(v as PipelineIntent)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brief */}
          <div className="grid gap-2">
            <Label htmlFor="brief">Design Brief</Label>
            <Textarea
              id="brief"
              placeholder="Describe the brand, target audience, visual preferences, and any specific requirements..."
              rows={5}
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
            />
            {errors.brief_text && (
              <p className="text-xs text-destructive">{errors.brief_text}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Start Pipeline"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
