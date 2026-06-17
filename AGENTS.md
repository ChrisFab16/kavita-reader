# KavitaReader — Agent Instructions

## Kavita API contracts

Before changing `kavitaClient`, filters, pagination, or progress sync, read **[specs/contracts/README.md](./specs/contracts/README.md)**. Update the relevant contract when behavior changes.

## Context7 (Kavita documentation lookup)

**MCP server:** `user-context7` · **Tools:** `resolve-library-id`, `query-docs`

Use Context7 when investigating Kavita API shapes, required fields, enums, or endpoint behavior — **before** web search or training-data guesses.

### Workflow

1. **`resolve-library-id`** — pass `libraryName` + `query` (task-specific, no secrets).
2. **`query-docs`** — pass chosen `libraryId` + specific question (endpoint name, DTO fields, etc.).
3. Distill findings into the relevant **`specs/contracts/*.md`** file.
4. Implement against the contract + `kavitaClient.ts` constants.

**Limits:** max **3 calls per tool per question** (Context7 policy).

### Kavita library IDs (verified 2026-06-16)

| Library ID | Use when |
|------------|----------|
| `/openapi/raw_githubusercontent_kareadita_kavita_develop_openapi_json` | **API contracts** — paths, params, required DTO fields, enums |
| `/kareadita/kavita` | Source/UI behavior, reader flows, non-OpenAPI context |
| `/websites/wiki_kavitareader` | User-facing Kavita docs / setup |

**Do not** paste server URLs, JWTs, API keys, or usernames into Context7 queries.

## Project conventions

- **Privacy:** No analytics or third-party telemetry.
- **Settings parity:** Persisted user config MUST be editable in `SettingsScreen`, not setup-only.
- **Multi-server:** Per-server credential keys and client cache — never mix server auth state.
- **Expo SDK 54:** Match existing dependencies; justify native modules in plan.

**Repo:** `ChrisFab16/kavita-reader` (fork) · upstream `cbytestech/kavita-reader` · package `com.hesshomestead.reader`

## Development

```bash
npm install
npm test                 # unit tests (tsx)
npm start                # Expo dev server
npm run android          # Run on Android
```
