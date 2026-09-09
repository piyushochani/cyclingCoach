# @enduragent/core

## 0.0.2

### Patch Changes

- 0b9381f: Reference Wave-2 substrate — architect-review follow-ups on top of F7.

  - **Tightened the `metrics/` re-export gate.** Added a second describe block to `tests/reference-strict-schemas.test.ts` that scans `metrics/*.ts` for `export const *Schema` declarations and asserts each appears in the `metrics/index.ts` barrel. Previously the README's Rule 1 ("every metric schema must be re-exported") was reviewer-enforced — the existing `length > 0` check still passed because the cache barrel supplied the count, so a missed F8/F9/F10/F11 re-export would slip through. Skipped today because no metric schemas declared yet; activates when F8 lands the first one.
  - **Branded the rename layer's return types** so the anti-corruption boundary (ADR-0012) is enforced at the type level. `renameTpFieldsOnActivity` / `renameTpFieldsOnWellnessRow` now return `RenamedActivityRow` / `RenamedWellnessRow` (phantom-branded with a `unique symbol`). Two new helpers `parseRenamedActivity(row)` and `parseRenamedWellnessRow(row)` accept only branded input — a sync-path author who calls `ActivitySchema.parse(apiResponse)` directly bypasses the rename layer; the parse helpers turn that bypass into a type error. Defense-in-depth only — the schemas remain publicly exported, so the brand catches forgetfulness, not malice. Pair with `assertNoTpKeysRemain` for nested-aggregate drift.
  - **Stripped the section-11 attribution comment from `metrics/index.ts`.** The barrel is a project-original contract scaffold (it adapts no upstream code); per the just-merged commit `dc5bca4` discipline, attribution belongs only on files that genuinely originate from section-11.
  - **Documentation.** `metrics/README.md` Rule 1 now points at the mechanical gate; Rule 3 gains the rule-of-three corollary ("and when the third metric does need it, extract it"). `reference/CONTEXT.md`'s F8-wiring obligation now tells future authors to go through `parseRenamedActivity` / `parseRenamedWellnessRow` instead of calling the schemas directly.

  Pure-infra changeset — athletes don't notice; this tightens drift gates that protect Wave 2 metric authors.

- 3418139: Reference test substrate (F7) — privacy hardening + review-feedback polish

  - Inverted the fixture sanitizer from denylist to allowlist (`tests/helpers/sanitize-fixture.ts`). Default-deny: every key outside the schema-derived allowlist is dropped. The prior denylist missed several operator-identifying fields (`power_meter_serial`, `power_meter`, `source` on activity rows, `skyline_chart_bytes`, `athlete_max_hr`, `lthr`, hardware vendor names) — now removed structurally. `realistic-athlete.json` regenerated and shrunk from 347KB to 70KB.
  - Replaced the PII regression scanner with a single allowlist assertion that walks the committed fixture and asserts every key appears in `ALLOWED_FIXTURE_KEYS`. Adds a defense-in-depth check that every `*_id` value is the redacted sentinel.
  - Hardened the rename layer (`reference/sync/rename-tp-fields.ts`) to throw on collisions where the input has both a TP source key and a non-null rename target. Null targets ride through (the real `atl`/`fatigue: null` pattern intervals.icu ships).
  - CLI (`tools/sanitize-fixture.ts`) now rejects unrecognized `--<flag>` arguments with a non-zero exit + stderr listing known flags. Prior CLI silently swallowed typos like `--force-overrride`.
  - Property-test arbitraries: `icu_efficiency_factor` is null when `average_heartrate` is null (same physical constraint as `decoupling`/`pa_hr`). `icu_training_load` and `icu_intensity` wrapped in `fc.option` to exercise the `undefined` branch (WeightTraining shape).

  Pure-infra changeset — athletes don't notice; the change tightens the privacy boundary on a test fixture.

- 3418139: Reference test substrate + anti-corruption layer (F7 + Layer A, Wave 2).
  Lands the privacy-denylist sanitizer (`tools/sanitize-fixture.ts`), the
  schema-checked fixture loader (`tests/helpers/load-fixture.ts`), the
  property-test arbitraries (`tests/helpers/reference-arbitraries.ts`), the
  `tests/fixtures/` directory with its first golden + synthetic fixtures,
  and the trademark-wall mechanical assertion
  (`tests/reference-input-schemas-no-tp.test.ts`).

  Repairs `ActivitySchema` in `src/reference/schemas/inputs.ts` to match
  intervals.icu API reality (Decision 3 of the F7 battle plan: real shape
  rides through `z.looseObject` unmodified). Surfaces revealed by piping a
  real 12-week pull through the substrate:

  - `Activity.id` accepts `string | number` (the API uses both forms).
  - `Activity.average_watts`, `average_heartrate`, `icu_training_load`,
    `icu_intensity` are now `.optional()` — real activities can lack a power
    meter (no Ride power data), an HR strap, or a load score (WeightTraining).
  - `icu_zone_times` / `pace_zone_times` / `hr_zone_times` accept the union
    `Array<number | { id?, secs }>` via the new shared `ZoneTimeEntrySchema`,
    and are `.nullable()` because the API writes `null` (not just absent)
    for activities lacking the series.

  Adds the anti-corruption layer (ADR-0012) between intervals.icu's
  TP-trademarked API fields and the project's typed surface:

  - `src/reference/trademark-policy.ts` — single source of truth for
    `TP_API_FIELDS` (7) and `TP_DENYLIST_FIELDS` (10). Migrates the
    sanitize helper and the no-TP regression test to import from it.
  - `src/reference/sync/rename-tp-fields.ts` — `renameTpFieldsOnWellnessRow`,
    `renameTpFieldsOnActivity`, and a defensive `assertNoTpKeysRemain`
    recursive walker (uses `[<index>]` paths only — no row-id leakage).
  - `schemas/inputs.ts` — 5 new wellness fields (`fitness`, `fatigue`,
    `fitnessContribution`, `fatigueContribution`, `weeklyFitnessChange`)
    and 2 new activity fields (`fitnessAtEnd`, `fatigueAtEnd`).
  - `tools/sanitize-fixture.ts` — pipeline now reads raw bundle → rename →
    `assertNoTpKeysRemain` → sanitize → atomic write. Non-number TP values
    surface as a stderr aggregate-warn so operator drift fails loudly.
  - `tools/fetch-real-athlete.ts` — operator fetch CLI promoted from the
    gitignored `scripts/` directory; the two tools now form one operator
    pipeline.
  - Regenerated `tests/fixtures/golden/realistic-athlete.json` with plain-
    English keys throughout; F8-F11 metric tests consume `fitness` /
    `fatigue` / `fitnessAtEnd` directly without reaching into the
    index-signature underlay.

  Pure-infra; no athlete-visible changes.

- 3418139: Reference test substrate — sanitizer home + fixture checksum (follow-up to #100)

  - Moved the fixture sanitizer from `packages/core/tests/helpers/sanitize-fixture.ts` to `tools/sanitize-fixture-transform.ts`. The sanitizer is operator tooling (one CLI consumer, run on the operator's laptop) — `tools/` is the right home alongside `check-trademarks.ts` and `fetch-real-athlete.ts`. Tests now import the transform via `tools/sanitize-fixture-transform.js` (dependency direction matches lifecycle: tests verify operator-produced artifacts).
  - Added `realistic-athlete.json.sha256` next to the committed fixture. CI verifies the two match on every run via `realistic-athlete-fixture-checksum.test.ts` — catches accidental in-place mutation (bad merge, editor save, formatter pass) that the operator-only byte-stability test doesn't see. The sanitize CLI now emits the checksum alongside the JSON, so operator regens stay in sync.
  - CONTRIBUTING.md gained a "Fixture stewardship" subsection naming the regen flow, the checksum guard, and the reviewer obligation when schema additions widen the allowlist.

  Pure-infra changeset.

## 0.0.1

### Patch Changes

- 4a4f538: User-facing: Tightened access — the bot now only responds to authorized Telegram senders. Existing operators: send `/start` once after upgrading, the bot prompts to claim ownership.

  Adds a per-user-ID allowlist to the Telegram channel. New behavior:

  - **Auth middleware** registered before any handler (factory-wrap pattern) filters every inbound message on `from.id`. Strangers in pairing mode get a one-time challenge with their own user-ID and instructions; allowlist mode silently drops.
  - **Migration:** no auto-claim. Default policy is `pairing` whenever `~/.cycling-coach/allowed-senders.json` is missing. On interactive startup (TTY), the bot prompts to claim. Headless paths fall back to pairing-mode + CLI claim.
  - **CLI:** `cycling-coach add-sender <id>`, `remove-sender <id>`, `list-senders`. PID lockfile serializes mutations.
  - **Persistence:** atomic `.tmp` + rename, mode `0o600`, dir mode tightened to `0o700`. Schema-validated on load with explicit fallback to `pairing` on malformed input. Transformer-pattern `saveAllowedSenders` ensures the read-modify-write cycle is atomic per process (closes a TOCTOU class).
  - **`notifyUpdate`** now filters its broadcast list against `allowFrom`, so pre-allowlist strangers' chat-ids stop receiving update pings.
  - **No proactive Telegram broadcast** under any branch (operator constraint). Migration diagnostics go to stderr only.

  Env vars: `CYCLING_COACH_OPERATOR_ID` (single ID, file precedence beats env), `CYCLING_COACH_DM_POLICY=open` (debug escape), `CYCLING_COACH_SETUP_CAPTURE_TIMEOUT_MS` (default 60s), `CYCLING_COACH_CAPTURE_CONFIRM_TIMEOUT_MS` (default 5min).
