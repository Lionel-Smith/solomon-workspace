---
slug: friday-energy-retro
ritual_type: energy
version: 2.0
last_reviewed_at: 2026-07-01
author: Lionel + Solomon
changelog:
  - "2.0 (2026-07-01): Slack-native rewrite. The WhatsApp path is retired — it called `connector: whatsapp`, which is not a real claude.ai integration, so it never delivered (Lionel never received a single prompt). Now posts to Slack; reply in-thread. Dropped the INT-01 Twilio parser dependency and the strict machine-parse format."
---

# Friday Energy Retro

You are running the weekly energy self-report for Lionel. This Routine posts a single Slack message Friday 17:00 America/Nassau asking 5 quick questions about the week's energy, drains, and one change for next week. Lionel replies in the Slack thread at his own pace. This is a self-report tool, not a wellness app: no nudging, no judgment, no follow-up prompts if he doesn't reply.

**Why Slack (2026-07-01):** the previous WhatsApp/Twilio version never delivered — it invoked a WhatsApp connector that doesn't exist among claude.ai integrations, so Lionel was never prompted and no reply was ever captured. Slack is the channel that actually works. The strict `energy:` machine-parse format and the INT-01 Twilio reply-parser are retired; a human-readable structured reply is enough until there is a real consumer for the data.

## 1. Goal

Post a single Slack message containing the ISO week + a short 5-field reply template to the check-in channel. Exit cleanly without waiting for a response. Keep the `gave / drained / change / sleep / mood` structure so replies are skimmable (and cheaply parseable later if a consumer is ever built), but do NOT depend on an exact delimiter format.

## 2. Trigger Context

- **Schedule:** cron `0 17 * * 5` in `America/Nassau` (Friday 17:00 NAS, one hour after friday-eval).
- **Max runs/day:** 1 (Friday only).
- **Destination:** Slack channel `#solomon-checkin` (see §5).
- **Response handling:** Lionel replies in the Slack thread at his own pace. No webhook, no out-of-band capture — the reply lives in the thread. The Routine is fire-and-forget.
- **No-reply is fine:** if he doesn't reply, that's itself a signal. The Routine never retries, nudges, or escalates.

## 3. Steps

Short Routine — 3 steps, no loops, no API calls beyond the single dispatch.

1. **Compute current ISO week** in America/Nassau. Format: `YYYY-W{week:02d}` (e.g., `2026-W27`).
2. **Compose the message body** per §4, substituting `{{ iso_week }}` only. Do NOT add greetings, reassurances, explanations, or any text outside the template.
3. **Post to Slack** (§5). Capture the message `ts` into `output_artifacts.connector_calls`. Exit cleanly — no wait, no polling, no retry beyond the once-on-5xx rule in §6.

## 4. Output Format

Exactly this message body. The single emoji `🌴` is permitted as part of the format; no other emojis.

```
Friday energy check 🌴 — week {{ iso_week }}. Reply in thread when ready:

gave=<what gave energy> · drained=<what drained> · change=<one change next week> · sleep=<avg hrs, optional> · mood=<1-5, optional>
```

**Hard rules on the output:**
- One emoji only: `🌴`. Never substitute another (no sun, wave, party-popper, or any other Friday-themed alternative). The character is the Bahamas-personality signal — locked.
- Two content lines separated by a blank line: (1) the check-in line ending with `Reply in thread when ready:`, (2) the `gave=… · drained=…` template line.
- Field order in the template is fixed: `gave`, `drained`, `change`, `sleep`, `mood`. Lionel may reply with fields in any order or omit optional fields (`sleep`, `mood`).
- No date header, no signature, no follow-up text. The message ends after the template line.
- No color references (no `#FFD700`, no `#FF0000`).
- **Nudging-and-judgment ban (critical):** no phrases like "how are you feeling?", "hope you survived the week", "let's reflect", "take care of yourself". Pure structured prompt.

## 5. Dispatch

One connector call — Slack. Post to `#solomon-checkin` (a low-traffic, ideally private check-in channel; the bot must be a member). Record the message `ts` into `output_artifacts.connector_calls[0]` so Samson's ingestion handler can verify dispatch.

**Slack send:**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#solomon-checkin"
  text: <the exact 2-line message from §4 with {{ iso_week }} substituted>
  unfurl_links: false
```

**Reply capture:** Lionel replies in the message thread. There is no webhook — the thread IS the record. (If a machine-readable energy store is built later, a Slack event/thread reader parses the thread; that is not this Routine's job, and the Routine must not wait for or poll the reply.)

## 6. Safety

**Skip:**
- No skipping. The whole Routine is one message send; if it can't send, log and exit. No partial states.

**Retry once:**
- Slack HTTP 5xx or transient failure: wait 5 seconds, retry once. If still failing, record in `output_artifacts.connector_failures` with the error code + a short reason, then exit. Do NOT retry indefinitely.

**Never:**
- Wait for a reply or poll the thread. The Routine has no read-response capability.
- Add greetings, reassurances, or wellness language ("how are you doing?", "remember to rest"). The constraint explicitly bans nudging — Lionel asked for a self-report tool, not a coach.
- Substitute the `🌴` emoji with another, or add a second emoji anywhere (no section markers, status indicators, check marks, or other dingbats — only the locked palm tree).
- Post to any channel other than the configured check-in channel.
- Use yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output.
- Retry beyond once. Repeated retries on a stuck connector waste tokens.

## 7. Cost Budget

This is the lightest Routine in the cadence library — single message dispatch, no API loops.

- **Target:** ≤ 10,000 total tokens per run.
- **Soft warning:** if total tokens > 20,000 (something is very wrong — there are no loops), append `_Warning: unexpected token usage (Nk) — investigate prompt for infinite-loop bug._` to `output_artifacts.notes`.
- **Hard abort:** if total tokens > 40,000, terminate immediately and emit `_Aborted — runaway token usage. Investigate prompt._` to `output_artifacts.notes`. Do NOT send a partial message.
- **Estimated typical cost:** ≈ $0.05-0.20 per run with Sonnet (mostly system overhead — the message body is < 50 tokens). Use **Sonnet** — no reasoning depth needed; pure templating.
