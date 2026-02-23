/** Checkpoint API — approval / rejection workflow. */

import { get, post } from "./client";
import type {
  Checkpoint,
  ApproveCheckpointRequest,
  RejectCheckpointRequest,
} from "./types";

export async function getCheckpoints(
  pipelineId: string,
): Promise<Checkpoint[]> {
  return get<Checkpoint[]>(`/pipelines/${pipelineId}/checkpoints`);
}

export async function approveCheckpoint(
  checkpointId: string,
  req: ApproveCheckpointRequest,
): Promise<Checkpoint> {
  return post<Checkpoint>(
    `/checkpoints/${checkpointId}/approve`,
    req,
  );
}

export async function rejectCheckpoint(
  checkpointId: string,
  req: RejectCheckpointRequest,
): Promise<Checkpoint> {
  return post<Checkpoint>(
    `/checkpoints/${checkpointId}/reject`,
    req,
  );
}
