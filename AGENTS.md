# KavitaReader — Agent Instructions

## Spec Kit methodology (always)

All feature work on **KavitaReader** follows the **Spec Kit** workflow. Do not jump straight to code for new features or significant changes.

```
/speckit-specify → /speckit-clarify → /speckit-checklist → /speckit-plan → /speckit-tasks → /speckit-analyze → /speckit-implement
```

**Before coding:**

1. Read `.specify/memory/constitution.md`, `.specify/memory/project-brief.md`, and the active feature under `specs/`.
2. Check `.specify/feature.json` for the current feature directory.
3. Ensure `spec.md`, `plan.md`, and `tasks.md` exist (or create them via Spec Kit) before implementation.

**Before marking implement done:** `/speckit-analyze` checks spec/plan/tasks consistency only — not code, races, or runtime regressions. Run manual quickstart on a device or emulator for reader and sync changes.

**Before PR sign-off:** Do not check PR test-plan items or imply merge-readiness until each item is verified and recorded in `specs/<feature>/validation-results.md` (or the user explicitly signs off manual QA). If quickstart needs live credentials or a server the agent cannot access, stop after code/logcat-level checks and ask the user — do not loop on brittle `adb input` UI automation.

**During implementation:**

- Execute tasks from `specs/<feature>/tasks.md` in order; mark tasks complete as you go.
- Keep API contracts aligned with `src/api/kavitaClient.ts` and `src/types/kavita.ts`.
- Manual QA steps belong in `quickstart.md`; sign-off in `validation-results.md` when applicable.

**Active context:** `.cursor/rules/specify-rules.mdc` (managed Spec Kit section).

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
