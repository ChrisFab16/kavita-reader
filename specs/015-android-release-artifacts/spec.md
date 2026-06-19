# Feature Specification: Android Release Artifact Naming

**Feature**: `015-android-release-artifacts`

**Created**: 2026-06-19

**Status**: Implemented (Phase 1)

**Input**: Local Gradle release APKs must be named `{slug}-{version}.apk` (e.g. `kavita-reader-1.0.1.apk`) instead of the default `app-release.apk`, so releases are identifiable when copied or sideloaded.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Local `./gradlew assembleRelease` APK filename | EAS cloud artifact naming |
| Persist convention across `expo prebuild` | iOS IPA naming |
| Document in AGENTS.md for agents and maintainers | Play Store AAB naming |

## Requirements

- **FR-001**: Release APK output MUST be named `{expo.slug}-{versionName}.apk`.
- **FR-002**: Naming MUST survive `expo prebuild` via config plugin (not manual-only Gradle edits).
- **FR-003**: Version MUST track `app.json` `expo.version` / Gradle `versionName`.

## Success Criteria

- **SC-001**: After `assembleRelease`, `android/app/build/outputs/apk/release/` contains exactly one APK named `kavita-reader-<version>.apk`.
- **SC-002**: Bumping `expo.version` and rebuilding updates the filename without code changes.
