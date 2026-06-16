# KavitaReader — Project Brief

> Authoritative sources: `README.md` (product overview), `feature_roadmap_doc.md` (planned work), and Kavita server API behavior via `src/api/kavitaClient.ts`.
> Agents MUST read these files before specifying, planning, or implementing features.

## Product Summary

KavitaReader is a **React Native / Expo** Android reader for self-hosted **Kavita** digital libraries. It provides library browsing, multi-format reading, progress sync, and theming — with no third-party data collection.

**Core philosophy:** Phone = Reading Device · Kavita Server = Library Source of Truth

## Primary Workflow

1. Connect to one or more Kavita servers (URL, login, optional API key)
2. Browse libraries → series → chapters/volumes
3. Open reader (EPUB, PDF, comic archive, or image sequence)
4. Track and sync reading progress back to Kavita
5. Customize experience in Settings (theme, fonts, sounds, grayscale)

## Feature Domains

| Domain | Key capabilities |
|--------|------------------|
| Connectivity | Multi-server, local IP, OPDS, token refresh (`KavitaClient`) |
| Library browse | Libraries, series lists, search, cover art, file-type badges |
| Readers | EPUB (`EpubReaderScreen`), PDF/images (`ReaderScreen`, `ImageReaderScreen`) |
| Progress | Resume position, Kavita progress API sync |
| Theming | Homestead (default), Pipboy; dark mode, grayscale |
| Settings | Server management, reader preferences, theme selection |
| Roadmap (v1.1+) | App update checker, library notifications, reading goals, audiobooks — see `feature_roadmap_doc.md` |

## Non-Functional Requirements

- Zero analytics / telemetry / ads
- Credentials in AsyncStorage (per-server keys); no secrets in logs
- Tolerate offline reading with deferred sync
- Material Design via React Native Paper
- EAS builds for Play Store (AAB) and sideload (APK preview)

## Project Structure

```
kavita-reader/
├── src/
│   ├── api/           # KavitaClient (axios, auth, progress)
│   ├── components/    # Shared UI (e.g. FeatureTestHelper)
│   ├── hooks/         # useAppTheme
│   ├── navigation/    # AppNavigator, RootStackParamList
│   ├── screens/       # Connect, Login, Home, Library, Series, Readers, Settings
│   ├── stores/        # serverStore, themeStore (Zustand)
│   ├── types/         # kavita.ts DTOs
│   └── utils/         # theme, debugLogger
├── assets/            # Icons, splash
├── plugins/           # Expo config plugins (cleartext traffic)
├── app.json           # Expo manifest
├── eas.json           # Build profiles
└── specs/             # Spec Kit feature artifacts
```

## Key Domain Entities

- **KavitaServer** — id, name, url, credentials metadata (see `types/kavita.ts`)
- **Library / Series / Chapter** — Kavita API DTOs consumed by screens
- **Reading progress** — local state + server sync via `KavitaClient`
- **Theme** — Homestead | Pipboy; persisted in `themeStore`

## Key Screens (React Navigation stack)

Connect → Login → Home → LibraryDetail → SeriesDetail → Reader  
Settings accessible from Home / Library headers

## Out of Scope (Non-Goals)

- Replacing Kavita server UI for library administration  
- Cloud-hosted library backend  
- Social network / book club features (roadmap low priority)  
- iOS shipping (aspirational; Android is primary)

## Repo & Remotes

- **Fork (origin):** `ChrisFab16/kavita-reader`
- **Upstream:** `cbytestech/kavita-reader`
