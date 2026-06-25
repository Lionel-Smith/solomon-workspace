/**
 * Post-handoff accessibility gate (ESV-09) — INTEGRATION (browser-driven).
 *
 * Runs axe-core against the RENDERED esther-preview pages and fails on any
 * serious/critical WCAG 2.1 AA violation. This is the runner that produces the
 * report consumed by the Python verdict in
 *   hfs-aiops/esther/services/accessibility_gate_service.py
 *
 * Not part of the default install / tsc build (this dir is in tsconfig "exclude").
 * To run:
 *   npm i -D @playwright/test @axe-core/playwright
 *   npx playwright install
 *   npm run dev   # in another shell
 *   npx playwright test e2e/a11y.spec.ts
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = ["/", "/login", "/pipelines", "/design-specs"];

for (const route of ROUTES) {
  test(`a11y: ${route} — no serious/critical WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}
