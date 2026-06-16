# Feature Specification: Auth Login Reliability

**Feature Branch**: `002-auth-login-fix`

**Created**: 2026-06-16

**Status**: In progress

**Input**: First login attempt fails, second succeeds with same credentials. RCA: stale JWT attached to login via axios interceptor; logout does not clear AsyncStorage.

## User Scenarios & Testing

### User Story 1 - First login succeeds (Priority: P1)

As a user signing in after logout or reconnect, my first login attempt with correct credentials succeeds.

**Acceptance Scenarios**:

1. **Given** stale tokens in AsyncStorage for server URL, **When** user submits valid credentials, **Then** login succeeds on first attempt.
2. **Given** fresh install, **When** user logs in, **Then** login succeeds on first attempt.
3. **Given** wrong password, **When** user submits, **Then** user sees incorrect-credentials message (not refresh-token failure).

### User Story 2 - Logout clears credentials (Priority: P1)

As a user logging out or removing a server, stored JWT/refresh/apiKey for that server are cleared.

**Acceptance Scenarios**:

1. **Given** logged-in server, **When** user taps Logout, **Then** AsyncStorage keys for that URL are removed.
2. **Given** logged-in server, **When** user removes server in Settings, **Then** credentials cleared for that URL.

## Functional Requirements

- **FR-001**: `POST /api/Account/login` MUST NOT include `Authorization` header.
- **FR-002**: `login()` MUST clear stored credentials before posting credentials.
- **FR-003**: 401 interceptor MUST NOT attempt token refresh on login or other public auth routes.
- **FR-004**: `removeServer` and logout MUST clear per-server AsyncStorage credentials.
- **FR-005**: Credential load MUST be awaitable via `ensureCredentialsLoaded()`.

## Constitution Check

| Principle | Status |
|-----------|--------|
| II. Privacy | Pass — clears local credentials on logout |
| V. Multi-server | Pass — per-URL storage keys preserved |
| VII. Settings parity | Pass — logout in Settings clears creds |

## Key Files

- `src/api/kavitaClient.ts`
- `src/stores/serverStore.ts`
- `src/screens/SettingsScreen.tsx` (no change if store handles logout)
