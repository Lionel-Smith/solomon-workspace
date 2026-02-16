/** TypeScript types mirroring esther-models Pydantic schemas. */

// ── Enums ────────────────────────────────────────────────────────────

export type PipelineStatus =
  | "created"
  | "running"
  | "paused_at_checkpoint"
  | "completed"
  | "failed"
  | "cancelled";

export type PipelineIntent =
  | "new_brand"
  | "redesign"
  | "component_library"
  | "landing_page";

export type CheckpointType =
  | "brief_approval"
  | "brand_approval"
  | "layout_approval"
  | "final_review";

export type CheckpointStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "revision_requested";

export type TokenCategory =
  | "color"
  | "typography"
  | "spacing"
  | "shadow"
  | "radius";

export type GeneratedFileSource = "v0" | "anima" | "claude" | "template";

// ── Models ───────────────────────────────────────────────────────────

export interface Pipeline {
  id: string;
  brief_id: string;
  brief_text: string;
  intent: PipelineIntent;
  project_name: string;
  current_agent: string;
  status: PipelineStatus;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  created_by: string;
}

export interface Checkpoint {
  id: string;
  pipeline_id: string | null;
  checkpoint_type: CheckpointType;
  status: CheckpointStatus;
  preview_data: Record<string, unknown> | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  revision_hints: string[];
  feedback: string | null;
  created_at: string;
}

export interface DesignSpec {
  id: string;
  pipeline_id: string | null;
  version: number;
  status: string;
  brand_tokens_json: Record<string, unknown>;
  components_json: Record<string, unknown>;
  layouts_json: Record<string, unknown>;
  audit_report_json: Record<string, unknown> | null;
  solomon_handoff_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BrandToken {
  id: string;
  design_spec_id: string | null;
  category: TokenCategory;
  token_key: string;
  token_value: string;
  css_variable: string;
  tailwind_class: string | null;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  source: GeneratedFileSource;
  confidence: number;
}

export interface AuditReport {
  wcag_score: number;
  quality_score: number;
  token_adherence_score: number;
  issues: Record<string, unknown>[];
  passed: boolean;
}

// ── Request types ────────────────────────────────────────────────────

export interface StartPipelineRequest {
  brief_text: string;
  intent: PipelineIntent;
  project_name: string;
}

export interface ApproveCheckpointRequest {
  approved_by: string;
  feedback?: string;
  modifications?: Record<string, unknown>;
}

export interface RejectCheckpointRequest {
  rejected_by: string;
  reason: string;
  revision_hints?: string[];
}

// ── Response wrappers ────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

// ── WebSocket events ─────────────────────────────────────────────────

export type PipelineEventType =
  | "agent_started"
  | "agent_completed"
  | "agent_failed"
  | "checkpoint_pending"
  | "checkpoint_approved"
  | "checkpoint_rejected"
  | "pipeline_completed"
  | "pipeline_failed";

export interface PipelineEvent {
  type: PipelineEventType;
  pipeline_id: string;
  agent?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}
