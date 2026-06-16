# Feature Specification: App Session Bootstrap

**Feature Branch**: `fix/login-credential-handling` (with 001, 002)

**Created**: 2026-06-16

**Status**: Implemented — validation pending

**Input**: User reports app always opens Connect/login wizard on restart despite saved server and JWT credentials.

## User Scenarios & Testing

### User Story 1 - Resume session on cold start (Priority: P1)

As a returning user who has already signed in, when I restart the app I land on **My Libraries** without re-entering server URL or password.

**Acceptance Scenarios**:

1. **Given** a saved server in `kavita-server-storage` and a JWT in AsyncStorage for that URL, **When** the app cold-starts, **Then** initial route is `Home`.
2. **Given** no saved servers, **When** the app cold-starts, **Then** initial route is `Connect`.
3. **Given** saved server but credentials cleared (logout), **When** the app cold-starts, **Then** initial route is `Connect`.

## Functional Requirements

- **FR-001**: Boot MUST wait for Zustand server-store hydration before choosing the initial route.
- **FR-002**: Initial route MUST be `Home` when primary (or first) server has a stored access token.
- **FR-003**: Initial route MUST be `Connect` when server list is empty or no token exists for the active server.
- **FR-004**: `AppNavigator` MUST accept a resolved `initialRouteName`; MUST NOT hardcode `Connect` when session is restorable.

## Constitution Check

| Principle | Status |
|-----------|--------|
| II. Privacy | Pass — no new data collection; reads existing local storage |
| V. Multi-server | Pass — uses primary/first server URL for credential check |
| VII. Settings parity | N/A |

## Key Files

- `App.tsx`
- `src/navigation/AppNavigator.tsx`
- `src/utils/sessionBootstrap.ts`
- `src/api/kavitaClient.ts` (`hasStoredCredentials`)
