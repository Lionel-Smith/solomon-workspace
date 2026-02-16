"use client";

/**
 * ContrastMatrix — grid showing foreground/background contrast ratios.
 *
 * Rows = foreground colors, columns = background colors.
 * Each cell shows the WCAG contrast ratio and pass/fail level.
 */

interface ContrastEntry {
  fg: string;
  fgHex: string;
  bg: string;
  bgHex: string;
  ratio: number;
}

function cellClass(ratio: number): string {
  if (ratio >= 7) return "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300";
  if (ratio >= 4.5) return "bg-green-50/50 text-green-600 dark:bg-green-950/50 dark:text-green-400";
  if (ratio >= 3) return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
  return "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400";
}

function label(ratio: number): string {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA-lg";
  return "Fail";
}

export function ContrastMatrix({
  entries,
  colors,
}: {
  entries: ContrastEntry[];
  colors: string[];
}) {
  // Build lookup: entries keyed by "fg|bg"
  const lookup = new Map<string, ContrastEntry>();
  for (const e of entries) {
    lookup.set(`${e.fg}|${e.bg}`, e);
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left text-muted-foreground">fg \ bg</th>
            {colors.map((c) => (
              <th key={c} className="p-2 text-center font-mono text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {colors.map((fg) => (
            <tr key={fg}>
              <td className="p-2 font-mono text-muted-foreground">{fg}</td>
              {colors.map((bg) => {
                const entry = lookup.get(`${fg}|${bg}`);
                if (!entry || fg === bg) {
                  return (
                    <td
                      key={bg}
                      className="p-2 text-center text-muted-foreground/30"
                    >
                      —
                    </td>
                  );
                }
                return (
                  <td
                    key={bg}
                    className={`p-2 text-center rounded ${cellClass(entry.ratio)}`}
                  >
                    <div className="font-semibold tabular-nums">
                      {entry.ratio.toFixed(1)}
                    </div>
                    <div className="text-[10px]">{label(entry.ratio)}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
