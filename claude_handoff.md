# BrideSide — Recent Changes Summary (Handoff for Claude)

This document summarizes the recent architectural and feature additions made to the **BrideSide** MVP codebase. 

## Context
BrideSide is an AI-guided wedding ceremony generator for lesbian couples. The MVP runs completely in-memory (no database, no user auth) utilizing a reducer pattern for state management (`lib/state.ts`). The questionnaire flow is defined entirely in `lib/questionnaire.ts`.

---

## Feature 1: Google Photos Picker Integration
We replaced the manual "paste image link" behavior with a native Google Photos Picker integration so couples can select photos directly from their Google Photos account.

### Key Changes:
* **`app/layout.tsx`**: Injected the Google Identity Services (`accounts.google.com/gsi/client`) and Google API (`apis.google.com/js/api.js`) scripts.
* **`app/api/gphotos/session/route.ts`**: Initiates a Picker session and returns a session ID.
* **`app/api/gphotos/status/route.ts`**: Polls the status of the Picker session.
* **`app/api/gphotos/items/route.ts`**: Fetches the selected media items and converts them to base64 strings so the app can persist them in-memory without dealing with Google Photos expiring URLs.
* **`lib/gphotosClient.ts`**: Contains the client-side orchestration logic to open the Picker window and handle OAuth token retrieval.
* **`app/page.tsx`**: Integrated the `GoogleSignInButton` and Picker logic on the landing page.

---

## Feature 2: Spotify Search & Embed Integration
We enhanced the questionnaire to allow couples to search for their "Entrance Song" (and relationship songs) directly via Spotify, and then embedded a playable widget in the final generated booklet.

### Key Changes:
* **`app/api/spotify/search/route.ts`**: A secure backend endpoint that handles the Spotify "Client Credentials" OAuth flow. It caches the token in-memory for 1 hour and proxies search queries (`/v1/search`) to Spotify to protect the Client Secret.
* **`components/ui/SpotifySearch.tsx`**: A smart autocomplete component with a 400ms debounce. 
  * It searches the Spotify API and displays a dropdown of tracks with album art.
  * **Fallback behavior:** It acts as a standard text input if the couple ignores the dropdown, preserving their ability to write free text or poems.
  * When a song is selected, it saves the answer in the format `spotify:track:ID|Song Name - Artist`.
* **`lib/questionnaire.ts`**: 
  * Added a new `"spotify"` field kind to `QFieldKind`.
  * Updated the `entranceSong` and `songs` field definitions to use the new Spotify features.
* **`components/notebook/ScrapbookPage.tsx`**: Updated the rendering engine to render the `<SpotifySearch />` component for both `spotify` and `songs` field kinds.
* **`components/book/CeremonyBooklet.tsx`**: Modified the `TitlePage` component to extract the `entranceSong` from the session state. If the answer contains a Spotify track ID, it renders an embedded `<iframe src="https://open.spotify.com/embed/track/..." />` so the couple can play the song while reading their booklet.

---

## Environment Variables
The following keys were added to `.env.local` to support these features:
* `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
* `SPOTIFY_CLIENT_ID`
* `SPOTIFY_CLIENT_SECRET`
