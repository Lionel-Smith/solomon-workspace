---
slug: friday-energy-retro
ritual_type: energy
version: 1.0
last_reviewed_at: 2026-05-06
author: Lionel + Solomon
---

# Friday Energy Retro

You are running the weekly energy self-report for Lionel. This Routine sends a single WhatsApp message Friday 17:00 America/Nassau asking 5 quick questions about the week's energy, drains, and a one-change-for-next-week. The Routine's job ends at message dispatch — response capture is handled by INT-01's Twilio webhook (`EnergyService.parse_whatsapp_reply`), which writes `cadence_energy_entries`. This is a self-report tool, not a wellness app: no nudging, no judgment, no follow-up prompts if Lionel doesn't reply.

## 1. Goal

Send a single WhatsApp message containing the week ISO + a 5-field reply template. Exit cleanly without waiting for a response. The message must use the exact `energy: gave=… drained=… change=… sleep=… mood=…` format so INT-01's parser can extract the fields when Lionel replies.

## 2. Trigger Context

- **Schedule:** cron `0 17 * * 5` in `America/Nassau` (Friday 17:00 NAS, one hour after friday-eval).
- **Max runs/day:** 1 (Friday only).
- **Daily slot budget:** counts as 1 of 15 daily Routine slots.
- **Out-of-band response handling:** Lionel replies via WhatsApp at his own pace. Twilio webhook → INT-01 `whatsapp_handler` parses `energy:` prefix → `EnergyService.parse_whatsapp_reply` → writes `cadence_energy_entries` row (UNIQUE on `week_iso`). The Routine is fire-and-forget.
- **Late-reply signal:** if no reply by Sunday 22:00 NAS, the weekly meta-retro reporter (BE-11) surfaces "energy retro not logged — itself a signal" rather than this Routine retrying or escalating.

## 3. Steps

Short Routine — 3 steps, no loops, no API calls beyond the single dispatch.

1. **Compute current ISO week** in America/Nassau. Format: `YYYY-W{week:02d}` (e.g., `2026-W21`).

2. **Compose the message body** per the §4 template, substituting `{{ iso_week }}` only. Do NOT add greetings ("Hi Lionel"), reassurances ("hope your week went well"), explanations ("we need this data because..."), or any text outside the template.

3. **Dispatch** via the WhatsApp connector (§5). Capture the message_sid into `output_artifacts.connector_calls`. Exit cleanly — no wait, no response polling, no retry beyond the once-on-5xx rule in §6.

## 4. Output Format

Exactly this message body. The single emoji `🌴` is permitted as part of the format; no other emojis.

```
Friday energy check 🌴 (week {{ iso_week }}). Reply when ready, format:

energy: gave=<what gave energy> drained=<what drained> change=<one change next week> sleep=<avg hours optional> mood=<1-5 optional>
```

**Hard rules on the output:**
- One emoji only: `🌴`. Never substitute any other emoji (no sun, wave, party-popper, or any other Friday-themed alternative). The character is the Bahamas-personality signal — locked.
- Two content lines separated by a blank line: (1) the greeting+format-intro line ending with `format:`, (2) the `energy: gave=…` template line.
- The `energy:` prefix is exact — lowercase, no leading space, colon-space delimiter. INT-01's parser splits on this.
- Field order in the template is fixed: `gave`, `drained`, `change`, `sleep`, `mood`. Lionel may reply with fields in any order or omit optional fields (`sleep`, `mood`), but the *prompt template* never reorders.
- `sleep` and `mood` are explicitly tagged `optional` — INT-01's parser tolerates their absence.
- No date header, no signature, no follow-up text. The message ends after the template line.
- No color references (no `#FFD700`, no `#FF0000`).
- **Nudging-and-judgment ban (critical):** no phrases like "how are you feeling?", "hope you survived the week", "let's reflect", "take care of yourself". Pure structured prompt.

## 5. Dispatch

One connector call. No fallback to Slack — per inventory.yml this Routine's only connector is `whatsapp`. If WhatsApp is unavailable, the Sunday 22:00 weekly-meta-reporter signal handles the absence.

**WhatsApp send:**
```
connector: whatsapp
method: send_message
payload:
  to: <Lionel's number from Routine secret WHATSAPP_TO>
  body: <the exact 2-line message from §4 with {{ iso_week }} substituted>
```

Capture the response's `message_sid` (or equivalent identifier) into `output_artifacts.connector_calls[0]` so Samson's ingestion handler can verify dispatch.

## 6. Safety

**Skip:**
- No skipping. The whole Routine is one message send; if it can't send, log and exit. No partial states.

**Retry once:**
- WhatsApp connector HTTP 5xx or transient failure: wait 5 seconds, retry once. If still failing, record in `output_artifacts.connector_failures` with the error code + a short reason. Do NOT retry indefinitely — the Sunday signal catches the missing entry.

**Never:**
- Wait for a reply. The Routine has no read-response capability — INT-01's webhook handles inbound separately.
- Add greetings, reassurances, or wellness language ("how are you doing?", "remember to rest"). The constraint explicitly bans nudging — Lionel asked for a self-report tool, not a coach.
- Substitute the `🌴` emoji with another. The character is locked.
- Add a second emoji anywhere (no section markers, status indicators, check marks, or other dingbats — only the locked palm tree).
- Send to anyone other than `WHATSAPP_TO`. The Routine has a single recipient.
- Use yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output (defensive — WhatsApp doesn't render colors but the rule applies to any output_artifacts text too).
- Retry beyond once. Repeated retries on a stuck connector waste tokens; the weekly-meta signal recovers.

## 7. Cost Budget

This is the lightest Routine in the cadence library — single message dispatch, no API loops.

- **Target:** ≤ 10,000 total tokens per run.
- **Soft warning:** if total tokens > 20,000 (something is very wrong — there are no loops), append `_Warning: unexpected token usage (Nk) — investigate prompt for infinite-loop bug._` to `output_artifacts.notes`.
- **Hard abort:** if total tokens > 40,000, terminate immediately and emit `_Aborted — runaway token usage. Investigate prompt._` to `output_artifacts.notes`. Do NOT send a partial message.
- **Estimated typical cost:** ≈ $0.05-0.20 per run with Sonnet (mostly the system overhead — the actual message body is < 50 tokens). Use **Sonnet** — no reasoning depth needed; this is pure templating.
