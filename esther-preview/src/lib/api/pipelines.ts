/** Pipeline API — CRUD + control operations. */

import { get, post } from "./client";
import type {
  Pipeline,
  PaginatedResponse,
  StartPipelineRequest,
} from "./types";

interface ServerOptions {
  headers?: Record<string, string>;
}

export async function getPipelines(
  page = 1,
  perPage = 20,
  opts?: ServerOptions,
): Promise<PaginatedResponse<Pipeline>> {
  const offset = (page - 1) * perPage;
  const raw = await get<{ pipelines: Pipeline[]; total: number; offset: number; limit: number }>(
    `/pipelines?offset=${offset}&limit=${perPage}`,
    opts,
  );
  return {
    items: raw.pipelines,
    total: raw.total,
    page,
    per_page: perPage,
  };
}

export async function getPipeline(
  id: string,
  opts?: ServerOptions,
): Promise<Pipeline> {
  return get<Pipeline>(`/pipelines/${id}`, opts);
}

export async function startPipeline(
  req: StartPipelineRequest,
): Promise<Pipeline> {
  return post<Pipeline>("/pipelines", req);
}

export async function pausePipeline(id: string): Promise<Pipeline> {
  return post<Pipeline>(`/pipelines/${id}/pause`);
}
