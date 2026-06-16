# Quickstart: Auth Login Fix

## Setup

- Emulator with app connected to real Kavita server
- Log in once successfully, then **Settings → Logout**

## Test 1 — First login after logout

1. Connect → enter server URL → Sign In
2. Enter valid username/password
3. Tap **Sign In once**

**Pass**: Home screen loads without retry.

**Fail**: Alert on first attempt; success only on second.

## Test 2 — Wrong password

1. Enter invalid password, tap Sign In

**Pass**: "Incorrect username or password" (or similar), no refresh-token error.

## Test 3 — Logout clears storage

1. After logout, inspect logcat: no `Authorization` on next login request.

## Sign-off

Record in `validation-results.md`.
