# Contract: Public auth routes (no Bearer header)

These endpoints MUST be called **without** `Authorization: Bearer …`:

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/Health` | Connection test |
| POST | `/api/Account/login` | Username/password sign-in |
| POST | `/api/Account/refresh-token` | Body carries token + refreshToken |
| POST | `/api/Account/register` | First-admin registration |

## Client behavior

- Request interceptor skips `Authorization` on paths above.
- Response interceptor does **not** attempt JWT refresh when a public route returns 401.
- `login()` calls `clearTokens()` before POST to discard stale per-URL storage.

## Storage keys (per server URL)

`kavita_token_{urlKey}`, `kavita_refresh_{urlKey}`, `kavita_apikey_{urlKey}`

Cleared on: `logout()`, `login()` (pre-clear), `removeServer`, `KavitaClient.clearStoredCredentials(url)`.
