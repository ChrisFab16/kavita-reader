# Plan: App Session Bootstrap

**Spec**: [spec.md](./spec.md)

## Root cause

`AppNavigator` hardcoded `initialRouteName="Connect"`. Saved credentials and server list were persisted but never read at boot. `App.tsx` used a fixed 100ms delay instead of waiting for Zustand `persist` rehydration.

## Target flow

```
App mount
  └─ waitForServerStoreHydration()
  └─ resolveInitialRoute()
       ├─ servers.length === 0 → Connect
       ├─ no token for active server URL → Connect
       └─ token present → Home
  └─ render AppNavigator(initialRouteName)
```

## Implementation

| File | Change |
|------|--------|
| `sessionBootstrap.ts` | `waitForServerStoreHydration`, `resolveInitialRoute` |
| `kavitaClient.ts` | `static hasStoredCredentials(baseUrl)` |
| `App.tsx` | Async boot splash; pass resolved route |
| `AppNavigator.tsx` | `initialRouteName` prop (default `Connect`) |

## Risks

- **Expired token**: User may reach Home then see API errors — acceptable; refresh interceptor or re-login from Settings handles this (future: optional silent refresh on boot).
- **Hydration race**: Must use `persist.onFinishHydration` / `hasHydrated()` — fixed 100ms timer removed.

## Validation

See [quickstart.md](./quickstart.md).
