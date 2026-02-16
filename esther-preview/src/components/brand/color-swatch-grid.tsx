"use client";

/**
 * ColorSwatchGrid — renders a brand color palette.
 *
 * Each swatch shows the color, its hex value, and optional contrast ratio
 * against white/black backgrounds.
 */

interface ColorSwatch {
  name: string;
  hex: string;
  contrastOnWhite?: number;
  contrastOnBlack?: number;
}

function contrastLabel(ratio: number): string {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-lg";
  return "Fail";
}

function contrastColor(ratio: number): string {
  if (ratio >= 4.5) return "text-green-600";
  if (ratio >= 3) return "text-yellow-600";
  return "text-red-600";
}

export function ColorSwatchGrid({ colors }: { colors: ColorSwatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {colors.map((c) => (
        <div key={c.name} className="overflow-hidden rounded-lg border">
          {/* Color block */}
          <div
            className="h-20"
            style={{ backgroundColor: c.hex }}
          />
          {/* Info */}
          <div className="space-y-0.5 p-2">
            <p className="text-xs font-medium truncate">{c.name}</p>
            <p className="text-[11px] font-mono text-muted-foreground">
              {c.hex}
            </p>
            {c.contrastOnWhite != null && (
              <p className="text-[10px]">
                <span className="text-muted-foreground">on white: </span>
                <span className={contrastColor(c.contrastOnWhite)}>
                  {c.contrastOnWhite.toFixed(1)} ({contrastLabel(c.contrastOnWhite)})
                </span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
