# Validation Results: Auth Login Fix

**Date:** 2026-06-16  
**Build:** `fix/login-credential-handling` (PR #4)  
**Server:** `https://comics.skadaha.dk` (reverse proxy, HTTPS, port disabled)  
**Method:** Manual quickstart on Android emulator

| Test | Result | Notes |
|------|--------|-------|
| First login after logout | **Pass** | User sign-off: first Sign In succeeds without retry |
| Wrong password | **Pass** | User sign-off: wrong password shows login failure (not refresh-token error) |
| Logout clears storage | **Pass** | `adb` RKStorage: no `kavita_token_*` / `kavita_refresh_*` / `kavita_apikey_*` after Settings → Logout all servers |

## Logout / credential cleanup (detail)

After **Settings → Logout** (all servers removed), `databases/RKStorage` contained only:

- `kavita-server-storage` → `{"state":{"servers":[],"primaryServerId":null},"version":0}`

Per-server credential keys for `https://comics.skadaha.dk` were **absent** (not merely empty).

## Wrong password (detail)

- Entered invalid password on Sign In screen.
- App showed login failure alert with incorrect-credentials messaging.
- No misleading refresh-token / “log in again” path observed.
