"use client";

/**
 * SpecViewer — Thin orchestrator composing hooks and tab sub-components.
 *
 * State:        useSpecData (fetch spec + tokens, export handler)
 * Presentation: SpecHeader, TokensTab, ComponentsTab, CodeTab, ExportTab
 */

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpecData } from "@/hooks/useSpecData";
import { SpecHeader } from "./spec-header";
import { TokensTab, ComponentsTab, CodeTab, ExportTab } from "./spec-viewer-tabs";

export function SpecViewer({ specId }: { specId: string }) {
  const router = useRouter();
  const { spec, tokens, loading, handleExport } = useSpecData(specId);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-muted-foreground">Loading design spec...</p>
      </main>
    );
  }

  if (!spec) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <p className="text-destructive">Design spec not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Back
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <SpecHeader spec={spec} />

      <Tabs defaultValue="tokens">
        <TabsList>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Brand Tokens ({tokens.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tokens.length > 0 ? (
                <TokensTab tokens={tokens} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tokens generated yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Component Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <ComponentsTab spec={spec} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Generated Code</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeTab spec={spec} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export &amp; Handoff</CardTitle>
            </CardHeader>
            <CardContent>
              <ExportTab spec={spec} onExport={handleExport} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
