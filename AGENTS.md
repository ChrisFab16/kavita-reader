# KavitaReader — Agent Instructions

## Spec Kit methodology (NON-NEGOTIABLE)

**Every code change** in this repo MUST follow the Spec Kit workflow and be traceable to `specs/<NNN>-<name>/`. See `.specify/memory/change-policy.md`.

```
/speckit-specify → /speckit-clarify → /speckit-checklist → /speckit-plan → /speckit-tasks → /speckit-analyze → /speckit-implement
```

### Before ANY edit to `src/`, `App.tsx`, or `app.json`

1. Read `.specify/feature.json` and `.specify/memory/change-policy.md`.
2. Confirm an existing feature covers the work, or **create** `specs/<NNN>-<name>/` with `spec.md`, `plan.md`, `tasks.md` first.
3. Add or update task IDs in `tasks.md` that the implementation will satisfy.
4. Run mental `/speckit-analyze` — spec, plan, and tasks must agree before coding.

### During implementation

- Implement only what tasks describe; mark `[x]` as you complete each task.
- Update `plan.md` if approach changes; do not let code drift from artifacts.
- API changes → update `contracts/` or types in the feature spec.
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
