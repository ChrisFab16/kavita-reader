# Quickstart: App Session Bootstrap

## Prerequisites

- Logged-in session (server saved + valid credentials)
- Dev build on emulator or device

## Test 1 — Cold start with session

1. Sign in successfully; confirm Home shows libraries.
2. Force-stop the app (swipe away / `adb shell am force-stop com.hesshomestead.reader`).
3. Relaunch the app.

**Pass**: Opens directly to **My Libraries** (Home), not Connect/Sign In.

## Test 2 — Cold start after logout

1. Settings → Logout (all servers removed).
2. Force-stop and relaunch.

**Pass**: Opens to **Connect** wizard.

## Sign-off

Record in [validation-results.md](./validation-results.md).
