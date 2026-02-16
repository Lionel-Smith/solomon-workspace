/**
 * Pipeline list page — Server Component.
 *
 * Fetches pipelines server-side, renders a table with status badges.
 * Clicking a row navigates to /pipelines/[id].
 */

import Link from "next/link";
import { getPipelines } from "@/lib/api/pipelines";
import { serverHeaders } from "@/lib/api/server";
import { PipelineStatusBadge } from "@/components/pipeline-status-badge";
import { NewPipelineButton } from "@/components/new-pipeline-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pipeline } from "@/lib/api/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duration(pipeline: Pipeline): string {
  const start = new Date(pipeline.created_at).getTime();
  const end = pipeline.completed_at
    ? new Date(pipeline.completed_at).getTime()
    : Date.now();
  const mins = Math.round((end - start) / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default async function PipelinesPage() {
  const headers = await serverHeaders();
  let data;
  try {
    data = await getPipelines(1, 50, { headers });
  } catch {
    // API unavailable — render empty state
    data = null;
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
          <p className="text-sm text-muted-foreground">
            Manage design generation pipelines
          </p>
        </div>
        <NewPipelineButton />
      </div>

      {!data || data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No pipelines yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <Link
                      href={`/pipelines/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.project_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PipelineStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.current_agent}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(p.created_at)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {duration(p)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
