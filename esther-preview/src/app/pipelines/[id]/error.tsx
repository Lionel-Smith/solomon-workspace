"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PipelineDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Failed to load pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
          <div className="flex gap-2">
            <Button onClick={reset} size="sm">
              Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/pipelines")}
            >
              Back to Pipelines
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
