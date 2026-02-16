/** Pipeline API — CRUD + control operations. */

import { get, post } from "./client";
import type {
  Pipeline,
  PaginatedResponse,
  StartPipelineRequest,
} from "./types";

export async function getPipelines(
  page = 1,
  perPage = 20,
): Promise<PaginatedResponse<Pipeline>> {
  return get<PaginatedResponse<Pipeline>>(
    `/api/pipelines?page=${page}&per_page=${perPage}`,
  );
}

export async function getPipeline(id: string): Promise<Pipeline> {
  return get<Pipeline>(`/api/pipelines/${id}`);
}

export async function startPipeline(
  req: StartPipelineRequest,
): Promise<Pipeline> {
  return post<Pipeline>("/api/pipelines", req);
}

export async function pausePipeline(id: string): Promise<Pipeline> {
  return post<Pipeline>(`/api/pipelines/${id}/pause`);
}
