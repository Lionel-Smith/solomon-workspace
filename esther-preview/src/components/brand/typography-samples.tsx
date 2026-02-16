"use client";

/**
 * TypographySamples — preview heading, body, and mono fonts at various sizes.
 */

interface TypographySpec {
  heading: { family: string; weights: number[] };
  body: { family: string; weights: number[] };
  mono?: { family: string; weights: number[] };
}

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";

function FontPreview({
  label,
  family,
  weights,
  sizes,
}: {
  label: string;
  family: string;
  weights: number[];
  sizes: { label: string; className: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h4 className="text-sm font-semibold">{label}</h4>
        <span className="text-xs text-muted-foreground font-mono">
          {family}
        </span>
      </div>

      {sizes.map((s) => (
        <div key={s.label} className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {s.label}
          </p>
          <p className={s.className} style={{ fontFamily: family }}>
            {SAMPLE_TEXT}
          </p>
        </div>
      ))}

      <div className="flex gap-3">
        {weights.map((w) => (
          <span
            key={w}
            className="text-sm"
            style={{ fontFamily: family, fontWeight: w }}
          >
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TypographySamples({ spec }: { spec: TypographySpec }) {
  return (
    <div className="space-y-8">
      <FontPreview
        label="Heading"
        family={spec.heading.family}
        weights={spec.heading.weights}
        sizes={[
          { label: "H1", className: "text-3xl font-bold" },
          { label: "H2", className: "text-2xl font-semibold" },
          { label: "H3", className: "text-xl font-medium" },
        ]}
      />

      <FontPreview
        label="Body"
        family={spec.body.family}
        weights={spec.body.weights}
        sizes={[
          { label: "Large", className: "text-lg" },
          { label: "Base", className: "text-base" },
          { label: "Small", className: "text-sm" },
        ]}
      />

      {spec.mono && (
        <FontPreview
          label="Monospace"
          family={spec.mono.family}
          weights={spec.mono.weights}
          sizes={[
            { label: "Code", className: "text-sm" },
          ]}
        />
      )}
    </div>
  );
}
