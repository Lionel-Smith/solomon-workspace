"use client";

/**
 * EventLog — card displaying the most recent pipeline WebSocket events.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineEvent } from "@/lib/api/types";

interface EventLogProps {
  events: PipelineEvent[];
}

export function EventLog({ events }: EventLogProps) {
  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm font-mono">
          {events.slice(0, 20).map((evt, i) => (
            <li key={i} className="text-muted-foreground">
              <span className="text-xs opacity-60">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>{" "}
              <span className="text-foreground">{evt.type}</span>
              {evt.agent && (
                <span className="text-blue-500"> {evt.agent}</span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
