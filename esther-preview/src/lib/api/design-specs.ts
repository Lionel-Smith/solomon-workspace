/** Design Spec API — read specs, tokens, and export. */

import { get } from "./client";
import type { DesignSpec, BrandToken } from "./types";

export async function getDesignSpec(
  pipelineId: string,
): Promise<DesignSpec> {
  return get<DesignSpec>(`/api/pipelines/${pipelineId}/design-spec`);
}

export async function getDesignSpecTokens(
  specId: string,
): Promise<BrandToken[]> {
  return get<BrandToken[]>(`/api/design-specs/${specId}/tokens`);
}

export async function exportSpec(
  specId: string,
  format: "json" | "css" | "tailwind" = "json",
): Promise<Record<string, unknown>> {
  return get<Record<string, unknown>>(
    `/api/design-specs/${specId}/export?format=${format}`,
  );
}
