"use client";

/**
 * SpecViewer — tabbed Design Spec viewer.
 *
 * Tabs: Tokens | Components | Code | Export
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ComponentPreview } from "@/components/component-preview";
import { getDesignSpec, getDesignSpecTokens, exportSpec } from "@/lib/api/design-specs";
import type { DesignSpec, BrandToken, GeneratedFile } from "@/lib/api/types";

// ── Token visual preview ────────────────────────────────────────────

function TokenValuePreview({ token }: { token: BrandToken }) {
  if (token.category === "color") {
    return (
      <div className="flex items-center gap-2">
        <div
          className="h-5 w-5 rounded border"
          style={{ backgroundColor: token.token_value }}
        />
        <span className="font-mono text-xs">{token.token_value}</span>
      </div>
    );
  }
  return <span className="font-mono text-xs">{token.token_value}</span>;
}

// ── Tokens tab ──────────────────────────────────────────────────────

function TokensTab({ tokens }: { tokens: BrandToken[] }) {
  const categories = [...new Set(tokens.map((t) => t.category))];

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 text-sm font-semibold capitalize">{cat}</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>CSS Variable</TableHead>
                  <TableHead>Tailwind</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens
                  .filter((t) => t.category === cat)
                  .map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-sm">
                        {t.token_key}
                      </TableCell>
                      <TableCell>
                        <TokenValuePreview token={t} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {t.css_variable}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {t.tailwind_class ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Components tab ──────────────────────────────────────────────────

function ComponentsTab({ spec }: { spec: DesignSpec }) {
  const components = spec.components_json as Record<
    string,
    { name: string; preview_url?: string; description?: string }
  >;
  const entries = Object.entries(components);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No components generated yet.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([key, comp]) => (
        <div key={key}>
          <h3 className="mb-2 text-sm font-semibold">{comp.name ?? key}</h3>
          {comp.description && (
            <p className="mb-3 text-xs text-muted-foreground">
              {comp.description}
            </p>
          )}
          {comp.preview_url ? (
            <ComponentPreview
              src={comp.preview_url}
              title={comp.name ?? key}
            />
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Preview not available
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Code tab ────────────────────────────────────────────────────────

function CodeTab({ spec }: { spec: DesignSpec }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Extract files from components_json or layouts_json
  const files: GeneratedFile[] = [];
  const cJson = spec.components_json as { files?: GeneratedFile[] };
  const lJson = spec.layouts_json as { files?: GeneratedFile[] };
  if (cJson?.files) files.push(...cJson.files);
  if (lJson?.files) files.push(...lJson.files);

  const active = files.find((f) => f.path === selectedFile) ?? files[0];

  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No generated code files yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
      {/* File tree */}
      <div className="flex md:flex-col gap-1 md:gap-0.5 overflow-x-auto md:overflow-x-visible rounded-lg border p-2">
        {files.map((f) => (
          <button
            key={f.path}
            onClick={() => setSelectedFile(f.path)}
            className={`w-full rounded px-2 py-1 text-left text-xs font-mono truncate ${
              active?.path === f.path
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {f.path}
          </button>
        ))}
      </div>

      {/* Code viewer */}
      {active && (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <span className="text-xs font-mono text-muted-foreground">
              {active.path}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {active.source}
              </Badge>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {Math.round(active.confidence * 100)}% confidence
              </span>
            </div>
          </div>
          <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
            <code>{active.content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Export tab ───────────────────────────────────────────────────────

function ExportTab({
  spec,
  onExport,
}: {
  spec: DesignSpec;
  onExport: (format: "json" | "css" | "tailwind") => void;
}) {
  const handoff = spec.solomon_handoff_json;

  return (
    <div className="space-y-6">
      {/* Export buttons */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">Download</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onExport("json")}>
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport("css")}>
            Export CSS
          </Button>
          <Button variant="outline" size="sm" onClick={() => onExport("tailwind")}>
            Export Tailwind
          </Button>
        </div>
      </div>

      {/* Solomon handoff */}
      {handoff && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Solomon Handoff</h3>
          <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/50 p-3 text-xs">
            <code>{JSON.stringify(handoff, null, 2)}</code>
          </pre>
        </div>
      )}

      {/* Implementation notes from audit */}
      {spec.audit_report_json && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Audit Report</h3>
          <pre className="max-h-60 overflow-auto rounded-lg border bg-muted/50 p-3 text-xs">
            <code>{JSON.stringify(spec.audit_report_json, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────

export function SpecViewer({ specId }: { specId: string }) {
  const router = useRouter();
  const [spec, setSpec] = useState<DesignSpec | null>(null);
  const [tokens, setTokens] = useState<BrandToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // specId here is the pipeline ID — the API resolves the latest spec
        const s = await getDesignSpec(specId);
        setSpec(s);
        const t = await getDesignSpecTokens(s.id);
        setTokens(t);
      } catch {
        // leave null
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [specId]);

  const handleExport = useCallback(
    async (format: "json" | "css" | "tailwind") => {
      if (!spec) return;
      try {
        const data = await exportSpec(spec.id, format);
        // Download as file
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `design-spec.${format === "json" ? "json" : format === "css" ? "css" : "config.js"}`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        // export failed silently
      }
    },
    [spec],
  );

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
      {/* Header */}
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

      {/* Tabbed viewer */}
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
