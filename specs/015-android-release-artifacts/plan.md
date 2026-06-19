# Plan: Android Release Artifact Naming

**Feature**: `015-android-release-artifacts`

## Approach

1. Expo config plugin `plugins/withAndroidReleaseApkName.js` uses `withAppBuildGradle` + `mergeContents` to inject `applicationVariants` output renaming.
2. Register plugin in `app.json` so `expo prebuild` reapplies after native regen.
3. Document output path and build commands in `AGENTS.md` Development section.

## Output

`android/app/build/outputs/apk/release/kavita-reader-<version>.apk`

## Risks

| Risk | Mitigation |
|------|------------|
| Prebuild overwrites manual Gradle edits | Config plugin is source of truth |
| AGP API change for `outputFileName` | Uses `configureEach` pattern compatible with current AGP |
