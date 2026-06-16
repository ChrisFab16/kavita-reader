# Plan: Auth Login Reliability

## Root cause (summary)

Global axios interceptor attaches stale `Bearer` token to `POST /api/Account/login` → 401 → refresh fails → `clearTokens()` → second attempt works.

## Implementation

### `kavitaClient.ts`

1. `isPublicRoute(url)` — `/api/Health`, `/api/Account/login`, `/api/Account/refresh-token`, `/api/Account/register`
2. Request interceptor — skip `Authorization` on public routes
3. Response interceptor — skip refresh retry on public routes; reject with original login error
4. `login()` — `await clearTokens()` before POST
5. `credentialsLoadPromise` — constructor awaits load via `ensureCredentialsLoaded`
6. `static clearStoredCredentials(baseUrl)` — for logout without cached client instance

### `serverStore.ts`

- `removeServer` — call `client.logout()` or `KavitaClient.clearStoredCredentials(url)` before cache delete

## Validation

See [quickstart.md](./quickstart.md).
