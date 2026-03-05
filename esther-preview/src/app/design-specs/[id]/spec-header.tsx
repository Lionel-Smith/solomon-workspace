/**
 * SpecHeader — title, version badge, status, date, and back button.
 */

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DesignSpec } from "@/lib/api/types";

interface SpecHeaderProps {
  spec: DesignSpec;
}

export function SpecHeader({ spec }: SpecHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Design Spec</h1>
        <div className="mt-1 flex items-center gap-3">
          <Badge variant="secondary">v{spec.version}</Badge>
          <Badge variant="secondary">{spec.status}</Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(spec.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
      >
        Back
      </Button>
    </div>
  );
}
