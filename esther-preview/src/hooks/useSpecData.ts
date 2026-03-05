"use client";

/**
 * useSpecData — state management for SpecViewer.
 *
 * Owns: spec + tokens fetch, loading state, export handler.
 */

import { useEffect, useState, useCallback } from "react";
import { getDesignSpec, getDesignSpecTokens, exportSpec } from "@/lib/api/design-specs";
import type { DesignSpec, BrandToken } from "@/lib/api/types";

export interface UseSpecDataResult {
  spec: DesignSpec | null;
  tokens: BrandToken[];
  loading: boolean;
  handleExport: (format: "json" | "css" | "tailwind") => Promise<void>;
}

export function useSpecData(specId: string): UseSpecDataResult {
  const [spec, setSpec] = useState<DesignSpec | null>(null);
  const [tokens, setTokens] = useState<BrandToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
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

  return { spec, tokens, loading, handleExport };
}
