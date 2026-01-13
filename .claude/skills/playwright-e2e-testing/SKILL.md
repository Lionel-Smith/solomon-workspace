---
name: playwright-e2e-testing
description: End-to-end testing using Playwright MCP Server in Claude Code. Use for browser automation, UI testing, user flow verification, visual regression testing, component validation, and Phase 3.6 Visual Verification (v1.8). Provides ready-to-execute prompts for common test scenarios with screenshot capture and detailed reporting.
---

# Playwright E2E Testing

Browser automation and E2E testing using Playwright MCP Server.

## v1.8 Integration

This skill supports two key workflows:

| Workflow | Phase | Purpose |
|----------|-------|---------|
| **Visual Verification** | Phase 3.6 | Screenshots for FE sessions (loading, data, error, mobile) |
| **E2E Testing** | E2E-XX sessions | Full user flow tests with assertions |

### When to Use

- **During FE sessions**: Capture visual verification screenshots before `/complete-session`
- **After FE complete**: Create E2E test suite (E2E-01, E2E-02, etc.)
- **Regression testing**: Use FE screenshots as baselines

## Overview

The Playwright MCP Server enables Claude Code to control a browser for automated testing. This skill provides structured prompts for common testing scenarios.

## Setup

### Enable Playwright MCP Server

In Claude Code settings (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-playwright"]
    }
  }
}
```

### Available MCP Actions

| Action | Description |
|--------|-------------|
| `navigate` | Go to URL |
| `click` | Click element |
| `fill` | Enter text in input |
| `screenshot` | Capture screenshot |
| `evaluate` | Run JavaScript |
| `wait_for_selector` | Wait for element |
| `get_text` | Get element text |

## Test Structure

### Prompt Format

```markdown
Using the Playwright MCP server, execute:

## Test: [Test Name]

### Prerequisites
- [Required state]

### Steps

1. **[Step Name]**
   - Action: [navigate/click/fill/etc]
   - Target: [selector or URL]
   - Assert: [expected outcome]
   - Screenshot: [filename.png]

### Report
| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| 1 | [expected] | [fill in] | ✅/❌ |
```

## Visual Verification for FE Sessions (v1.8)

Every frontend session requires screenshots before completion. Use Playwright to capture these:

### Screenshot Capture Script

```typescript
// scripts/capture-session.ts
import { chromium, devices } from 'playwright';

const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  mobile: devices['iPhone 12'].viewport,
};

async function captureSessionScreenshots(sessionId: string, baseUrl: string) {
  const browser = await chromium.launch();

  // Desktop screenshots
  const desktop = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await desktop.newPage();

  // Loading state (fast - before data loads)
  await page.goto(baseUrl);
  await page.screenshot({ path: `docs/screenshots/${sessionId}-loading.png` });

  // Data state (wait for data)
  await page.waitForSelector('[data-testid="data-loaded"]', { timeout: 10000 });
  await page.screenshot({ path: `docs/screenshots/${sessionId}-data.png` });

  // Error state (stop backend first)
  // Manual: Stop backend, refresh, capture error

  // Mobile viewport
  const mobile = await browser.newContext({ viewport: VIEWPORTS.mobile });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(baseUrl);
  await mobilePage.waitForSelector('[data-testid="data-loaded"]');
  await mobilePage.screenshot({ path: `docs/screenshots/${sessionId}-mobile.png` });

  await browser.close();
  console.log(`✅ Captured screenshots for ${sessionId}`);
}
```

### Required Screenshots per FE Session

| Screenshot | State | Capture Method |
|------------|-------|----------------|
| `{id}-loading.png` | Loading skeleton | Navigate, immediate capture |
| `{id}-data.png` | With API data | Wait for data selector |
| `{id}-error.png` | Error state | Stop backend, navigate |
| `{id}-mobile.png` | Mobile view | 375px viewport |

### Verification Prompt (MCP)

```markdown
Using the Playwright MCP server, capture visual verification screenshots:

## Session: FE-03 Items List

### Step 1: Loading State
- Navigate to: http://localhost:5173/items
- Screenshot immediately (before network idle)
- Save as: FE-03-loading.png
- Assert: Skeleton elements visible

### Step 2: Data State
- Wait for: Table rows to appear
- Assert: Real data from API (check Network tab)
- Screenshot: FE-03-data.png

### Step 3: Error State
- Stop backend server
- Refresh page
- Assert: ErrorState component visible
- Assert: Retry button present
- Screenshot: FE-03-error.png

### Step 4: Mobile View
- Set viewport: 375x667
- Navigate to: http://localhost:5173/items
- Wait for data
- Screenshot: FE-03-mobile.png

### Report
| Screenshot | Captured | File |
|------------|----------|------|
| Loading | ⬜ | FE-03-loading.png |
| Data | ⬜ | FE-03-data.png |
| Error | ⬜ | FE-03-error.png |
| Mobile | ⬜ | FE-03-mobile.png |
```

## E2E Session Template (v1.8)

E2E sessions follow the same XML structure as other sessions:

```xml
<session id="E2E-01" project="{PROJECT}">
  <metadata>
    <working_directory>{project}-web</working_directory>
    <estimated_time>45 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">FE-04</requires>
  </dependencies>

  <integration_gate enabled="true">
    <check name="backend">curl -sf http://localhost:5000/health</check>
    <check name="frontend">curl -sf http://localhost:5173</check>
    <check name="data">curl -sf http://localhost:5000/api/v1/{entity} | jq '.total > 0'</check>
  </integration_gate>

  <skills>
    <skill>playwright-e2e-testing</skill>
  </skills>

  <context>
    <summary>Create E2E tests for critical user flows</summary>
  </context>

  <tasks>
    <task id="1" file="e2e/setup.ts" action="CREATE">
      <title>Configure Playwright for E2E tests</title>
    </task>
    <task id="2" file="e2e/{flow}.spec.ts" action="CREATE">
      <title>Create E2E test for {flow}</title>
    </task>
  </tasks>

  <verification>
    <check name="tests_pass" command="npx playwright test">All E2E tests pass</check>
    <check name="screenshots" command="ls e2e/screenshots/*.png | wc -l">Screenshots captured</check>
  </verification>

  <commit>
    <type>test</type>
    <scope>e2e</scope>
    <description>add E2E tests for {flow}</description>
  </commit>
</session>
```

## Integration with FE Sessions

Visual verification screenshots captured during FE sessions can be reused as baseline images for E2E regression tests:

```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test('items list matches baseline', async ({ page }) => {
  await page.goto('/items');
  await page.waitForSelector('[data-testid="data-loaded"]');

  // Compare against FE-03 screenshot baseline
  await expect(page).toHaveScreenshot('FE-03-data.png', {
    maxDiffPixels: 100,
  });
});
```

## Common Test Scenarios

### Scenario 1: Guest Order Flow

```markdown
Using the Playwright MCP server, execute the complete guest ordering E2E test:

## Test: Guest Order Happy Path

### Prerequisites
- Backend running at http://localhost:5000
- Frontend running at http://localhost:5173
- Test data seeded

### Steps

1. **Load Menu Page**
   - Navigate to: http://localhost:5173/v/test-venue
   - Wait for: Network idle
   - Assert: Page contains venue name
   - Assert: Menu categories visible
   - Screenshot: guest-01-menu.png

2. **Browse Categories**
   - Count category headers
   - Assert: At least 3 categories
   - Assert: At least 5 menu items
   - Screenshot: guest-02-categories.png

3. **Select Item**
   - Click: Menu item "Conch Fritters"
   - Wait for: Modal to open
   - Assert: Item name visible
   - Assert: Price visible
   - Assert: Add to Cart button visible
   - Screenshot: guest-03-modal.png

4. **Configure and Add**
   - Set quantity: 2
   - Click: "Add to Cart"
   - Wait for: Modal close
   - Assert: Cart badge shows 2
   - Screenshot: guest-04-added.png

5. **View Cart**
   - Click: Cart icon
   - Wait for: Cart page
   - Assert: Item in cart
   - Assert: Subtotal correct
   - Screenshot: guest-05-cart.png

6. **Checkout**
   - Click: "Checkout"
   - Wait for: Checkout page
   - Select: 18% tip
   - Screenshot: guest-06-checkout.png

7. **Payment**
   - Fill card: 4111111111111111
   - Fill expiry: 12/28
   - Fill CVV: 123
   - Fill name: Test Customer
   - Screenshot: guest-07-payment.png

8. **Submit Order**
   - Click: "Pay Now"
   - Wait for: Order confirmation
   - Assert: Order number displayed
   - Assert: Status is "Confirmed"
   - Screenshot: guest-08-confirmed.png

### Report
| Step | Expected | Actual | Status |
|------|----------|--------|--------|
| 1. Menu | Page loads | | ⬜ |
| 2. Categories | 3+ visible | | ⬜ |
| 3. Modal | Opens with details | | ⬜ |
| 4. Add | Cart updates | | ⬜ |
| 5. Cart | Shows items | | ⬜ |
| 6. Checkout | Tip selection | | ⬜ |
| 7. Payment | Form accepts input | | ⬜ |
| 8. Confirm | Order created | | ⬜ |

Total: X/8 steps passed
```

### Scenario 2: Admin Order Management

```markdown
Using the Playwright MCP server, execute admin order management test:

## Test: Admin Order Lifecycle

### Prerequisites
- An order exists (run guest flow first)

### Steps

1. **Login**
   - Navigate to: http://localhost:5173/admin/login
   - Fill email: admin@test.com
   - Fill password: admin123
   - Click: "Login"
   - Wait for: Dashboard
   - Assert: User name visible
   - Screenshot: admin-01-login.png

2. **View Orders**
   - Navigate to: Orders page
   - Wait for: Orders list
   - Assert: At least 1 order
   - Screenshot: admin-02-orders.png

3. **Open Order**
   - Click: Most recent order
   - Wait for: Detail view
   - Assert: Order number visible
   - Assert: Items listed
   - Screenshot: admin-03-detail.png

4. **Update to Preparing**
   - Click: "Preparing" status
   - Wait for: Status update
   - Assert: Status shows "Preparing"
   - Screenshot: admin-04-preparing.png

5. **Verify Real-Time**
   - Open new tab
   - Navigate to: Guest order page
   - Assert: Status shows "Preparing"
   - Screenshot: admin-05-realtime.png
   - Close tab

6. **Complete Order**
   - Update status: Ready
   - Wait for: Confirmation
   - Update status: Completed
   - Assert: Order completed
   - Screenshot: admin-06-completed.png

### Report
All admin tests: PASSED/FAILED
```

### Scenario 3: Kitchen Display

```markdown
Using the Playwright MCP server, execute kitchen display test:

## Test: Kitchen Order Processing

### Steps

1. **Kitchen Login**
   - Navigate to: http://localhost:5173/admin/login
   - Fill email: kitchen@test.com
   - Fill password: kitchen123
   - Click: Login
   - Screenshot: kitchen-01-login.png

2. **Navigate to Kitchen**
   - Click: "Kitchen" in nav
   - Wait for: Queue interface
   - Screenshot: kitchen-02-queue.png

3. **Verify Order Card**
   - Find order with "Confirmed" status
   - Assert: Order number visible
   - Assert: Table number visible
   - Assert: Items listed
   - Screenshot: kitchen-03-card.png

4. **Process Items**
   - Click first item → "Preparing"
   - Click again → "Ready"
   - Assert: Visual indicators update
   - Screenshot: kitchen-04-items.png

5. **Bump Order**
   - Click: "Bump" button
   - Assert: Order removed from queue
   - Screenshot: kitchen-05-bumped.png

### Report
Kitchen workflow: PASSED/FAILED
```

### Scenario 4: Component Validation

```markdown
Using the Playwright MCP server, validate UI components:

## Test: Component Validation

### Test A: Menu Item Component
1. Navigate to menu page
2. Assert first item has:
   - Name (text not empty)
   - Price (contains $)
   - Clickable area
3. Click item → Assert modal opens
4. Screenshot: component-menu-item.png

### Test B: Cart Badge
1. Add item to cart
2. Assert badge shows count > 0
3. Add another item
4. Assert badge updates
5. Screenshot: component-cart-badge.png

### Test C: Payment Form
1. Navigate to checkout
2. Submit empty form
3. Assert: Validation errors appear
4. Fill invalid card (1234)
5. Assert: Card error shown
6. Fill valid card (4111111111111111)
7. Assert: No card error
8. Screenshot: component-payment.png

### Test D: Status Badge
1. Navigate to order page
2. Assert badge has:
   - Correct color for status
   - Status text matches
3. Screenshot: component-status.png

### Report
| Component | Validations | Status |
|-----------|-------------|--------|
| Menu Item | name, price, modal | ⬜ |
| Cart Badge | count, updates | ⬜ |
| Payment Form | validation | ⬜ |
| Status Badge | colors, text | ⬜ |
```

### Scenario 5: Edge Cases

```markdown
Using the Playwright MCP server, test edge cases:

## Test: Edge Cases

### Test 1: Empty Cart Checkout
1. Navigate to venue page (fresh session)
2. Try to access checkout directly
3. Assert: Blocked or error shown
4. Screenshot: edge-empty-cart.png

### Test 2: Session Persistence
1. Add items to cart
2. Note cart count
3. Refresh page
4. Assert: Cart items preserved
5. Screenshot: edge-session.png

### Test 3: Invalid Table Code
1. Navigate to: /v/venue?table=INVALID
2. Assert: Error message OR graceful handling
3. Screenshot: edge-invalid-table.png

### Test 4: Quantity Limits
1. Open item modal
2. Try quantity = 0
3. Assert: Prevented
4. Try quantity = 100
5. Assert: Upper limit applied or warning
6. Screenshot: edge-quantity.png

### Test 5: Concurrent Orders
1. Open two tabs with same session
2. Add items in both
3. Assert: Cart syncs or handles conflict
4. Screenshot: edge-concurrent.png

### Report
| Edge Case | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Empty cart | Blocked | | ⬜ |
| Session | Persists | | ⬜ |
| Invalid table | Handled | | ⬜ |
| Quantity | Limited | | ⬜ |
| Concurrent | Synced | | ⬜ |
```

## Full Test Suite

```markdown
Using the Playwright MCP server, execute complete E2E suite:

## Full Test Suite

### Phase 1: Prerequisites Check
1. Navigate to http://localhost:5000/health
   - Assert: { "status": "healthy" }
2. Navigate to http://localhost:5173
   - Assert: Page loads
3. Navigate to http://localhost:5173/v/test-venue
   - Assert: Menu visible

### Phase 2: Guest Flow (Scenario 1)
Execute all 8 steps
Record: Order ID for admin tests

### Phase 3: Admin Flow (Scenario 2)
Execute all 6 steps
Use order from Phase 2

### Phase 4: Kitchen Flow (Scenario 3)
Execute all 5 steps

### Phase 5: Components (Scenario 4)
Execute all 4 component tests

### Phase 6: Edge Cases (Scenario 5)
Execute all 5 edge case tests

## Final Report

### Summary
| Phase | Tests | Passed | Failed |
|-------|-------|--------|--------|
| Prerequisites | 3 | | |
| Guest Flow | 8 | | |
| Admin Flow | 6 | | |
| Kitchen Flow | 5 | | |
| Components | 4 | | |
| Edge Cases | 5 | | |
| **TOTAL** | **31** | | |

### Screenshots
[List all captured screenshots]

### Issues Found
[List any failures with details]

### Recommendations
[Suggested fixes]
```

## Best Practices

### Screenshot Naming

```
{phase}-{step}-{description}.png

Examples:
guest-01-menu-loaded.png
admin-03-order-detail.png
edge-empty-cart.png
```

### Wait Strategies

```markdown
✅ Good: Wait for specific element
   - Wait for: selector ".order-confirmed"
   
✅ Good: Wait for network
   - Wait for: Network idle

❌ Bad: Fixed delay
   - Wait 3 seconds
```

### Assertions

```markdown
✅ Clear assertions:
   - Assert: Element ".cart-badge" contains "2"
   - Assert: URL contains "/order/"
   - Assert: Text "Confirmed" is visible

❌ Vague assertions:
   - Assert: Page looks correct
   - Assert: It works
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Element not found | Wait for element before interacting |
| Timeout | Increase timeout or check if page loads |
| Stale element | Re-query element after navigation |
| Click intercepted | Scroll into view or close overlays |

### Debug Tips

```markdown
When test fails:

1. Take screenshot at failure point
2. Log current URL
3. Get page HTML for debugging
4. Check console for JavaScript errors
5. Verify test data exists
```
