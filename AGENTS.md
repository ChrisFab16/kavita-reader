# KavitaReader — Agent Instructions

## Fork vs upstream branches

| Branch | Documentation |
|--------|----------------|
| **`speckit-work`** (this branch) | Full Spec Kit — `.specify/`, `specs/001`–`010`, skills |
| **Upstream PR branches** | `specs/contracts/` + slim `AGENTS.md` only |

Policy: **[docs/upstream-contribution.md](./docs/upstream-contribution.md)** · Agent summary: `.specify/memory/upstream-contribution-policy.md`

---

## Spec Kit methodology (NON-NEGOTIABLE on `speckit-work`)

**Every code change** in this repo MUST follow the Spec Kit workflow and be traceable to `specs/<NNN>-<name>/`. See `.specify/memory/change-policy.md`.

```
/speckit-specify → /speckit-clarify → /speckit-checklist → /speckit-plan → /speckit-tasks → /speckit-analyze → /speckit-implement
```

### Before ANY edit to `src/`, `App.tsx`, or `app.json`

1. Read `.specify/feature.json` and `.specify/memory/change-policy.md`.
2. If touching Kavita API calls (`kavitaClient`, filters, pagination), read **[specs/contracts/README.md](./specs/contracts/README.md)** first.
3. If the contract is missing or stale, **query Context7** (see below) before guessing from memory or web search.
4. Confirm an existing feature covers the work, or **create** `specs/<NNN>-<name>/` with `spec.md`, `plan.md`, `tasks.md` first.
5. Add or update task IDs in `tasks.md` that the implementation will satisfy.
6. Run mental `/speckit-analyze` — spec, plan, and tasks must agree before coding.

### During implementation

- Implement only what tasks describe; mark `[x]` as you complete each task.
- Update `plan.md` if approach changes; do not let code drift from artifacts.
- API changes → update [specs/contracts/](./specs/contracts/README.md) (canonical) and link from the feature spec; keep `src/api/kavitaFilterV2.ts` in sync.
- **Context7 lookups** inform contracts; **`specs/contracts/`** remains the client source of truth after distillation.
- Manual QA → `quickstart.md`; sign-off → `validation-results.md`.

### Before PR / done

- `/speckit-analyze` consistency (or `analysis-report.md` in the feature dir).
- No unchecked tasks for shipped scope unless explicitly deferred in spec.
- Do not check PR test-plan items without `validation-results.md` or explicit user sign-off.
- If quickstart needs credentials the agent cannot access, ask the user — do not loop on brittle `adb input` UI automation.

### Multi-feature branches

One branch may include several `specs/00N/` directories (e.g. 001 perf + 002 auth + 003 bootstrap). Update **each** affected feature’s artifacts; set `.specify/feature.json` to the feature you are actively implementing.

**Active context:** `.cursor/rules/specify-rules.mdc` · `.specify/memory/constitution.md` · `.specify/memory/project-brief.md`

**Repo:** `ChrisFab16/kavita-reader` (fork) · upstream `cbytestech/kavita-reader` · package `com.hesshomestead.reader`

## Context7 (Kavita documentation lookup)

**MCP server:** `user-context7` · **Tools:** `resolve-library-id`, `query-docs`

Use Context7 when investigating Kavita API shapes, required fields, enums, or endpoint behavior — **before** web search or training-data guesses. Do **not** use for app refactors, business logic, or code review.

### Workflow

1. Read tool schemas under `.cursor/projects/.../mcps/user-context7/tools/` (both tools require a `query` string).
2. **`resolve-library-id`** — pass `libraryName` + `query` (task-specific, no secrets).
3. **`query-docs`** — pass chosen `libraryId` + specific question (endpoint name, DTO fields, etc.).
4. Distill findings into the relevant **`specs/contracts/*.md`** file; link Context7 library ID in the contract header.
5. Implement against the contract + `kavitaClient.ts` constants.

**Limits:** max **3 calls per tool per question** (Context7 policy). Prefer one focused `query-docs` over broad fishing.

### Kavita library IDs (verified 2026-06-16)

| Library ID | Use when |
|------------|----------|
| `/openapi/raw_githubusercontent_kareadita_kavita_develop_openapi_json` | **API contracts** — paths, params, required DTO fields, enums (805 snippets) |
| `/kareadita/kavita` | Source/UI behavior, reader flows, non-OpenAPI context (473 snippets) |
| `/websites/wiki_kavitareader` | User-facing Kavita docs / setup (not primary for client integration) |

**Example** (reading progress): resolve `Kavita` → query OpenAPI library with `"Reader progress POST progress ProgressDto get-progress libraryId required fields"` → update [kavita-reader-progress.md](./specs/contracts/kavita-reader-progress.md).

**Do not** paste server URLs, JWTs, API keys, or usernames into Context7 queries.

## Project conventions

- **Privacy:** No analytics or third-party telemetry. Update privacy docs if data handling changes.
- **Settings parity:** Persisted user config MUST be editable in `SettingsScreen`, not setup-only.
- **Multi-server:** Per-server credential keys and client cache — never mix server auth state.
- **Expo SDK 54:** Match existing dependencies; justify native modules in plan.
- Only commit when the user asks.

## Development

```bash
npm install
npm start          # Expo dev server
npm run android    # Run on Android
eas build --platform android --profile preview   # APK
```
