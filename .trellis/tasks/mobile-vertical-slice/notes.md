# Notes

## Discoveries

- Root is an orchestration repository. `backend/` and `frontend/` each have their own Git repository, `.agents`, and `.trellis`; root has no `.trellis`.
- Ponytail is a project convention documented in `backend/AGENTS.md` and `frontend/AGENTS.md`; there is no separate installed Ponytail package or skill to copy.
- The backend source mounts applicant-only domain routes under `/api/portfolio`.
- Auth login is `POST /api/auth/login` with `{ email, password }`; success data contains `token` and `account`.
- `POST /api/portfolio/moments` uses `multer.array("media", ...)`; `capturedAt` is required, and `caption`/`visibility` are optional.
- `GET /api/portfolio/moments` returns `{ success, message, data: Moment[], pagination }`; media URLs are in `mediaAssets[].secureUrl`.
- Backend's configured portfolio upload limit defaults to 10 MB and accepts JPG/JPEG, PNG, WEBP, MP4, PDF, DOC, DOCX. The mobile MVP only sends images.
- Root Compose currently has backend/frontend services but no mobile tooling service and references a backend Dockerfile that is absent in the current checkout.

## Decisions

- Use the official `default@sdk-54` create-expo-app template so SDK 54 is selected at creation time, with Expo Router retained.
- Use native `fetch`, not Axios or a new data/state library.
- Use `expo-camera`, `expo-image-picker`, and `expo-secure-store` installed through `npx expo install`.
- Use `visibility=private`, omit applicantId/status/Cloudinary fields, and set `capturedAt` to the capture/selection timestamp.
- Keep mobile Trellis under `mobile/.trellis` to match package-local Trellis convention and avoid creating a duplicate root system.
- Add a separate `docker-compose.mobile.yml` instead of modifying existing Compose services; the service is validation-only and optional.

## Implementation and validation

- Created the SDK 54 app from `default@sdk-54`; current Expo package is `~54.0.36`, React Native is `0.81.5`, and React is `19.1.0`.
- Expo CLI installed `expo-camera`, `expo-image-picker`, `expo-secure-store`, plus required `expo-constants` and `react-native-worklets` peer dependencies.
- Kept native fetch, SecureStore, Expo Router, and two small contexts; no Axios, data-fetching library, UI framework, or state library was added.
- Local lint, strict typecheck, Expo install check, Expo Doctor 18/18, and Expo web export passed.
- Docker Node 22 image build and combined container validation passed.
- No backend files or API contract were changed.

- Expo config audit initially showed default RECORD_AUDIO from camera/image-picker plugins; set `recordAudioAndroid=false` and `microphonePermission=false`, then verified public config contains only `android.permission.CAMERA`.

## Issues handled

- Initial scaffold dependency installation timed out after files were created; dependencies were then installed from the pinned package manifest.
- A first npm dependency tree contained an incomplete hosted-git-info entry; node_modules and package-lock were regenerated, then npm install and Expo install --fix succeeded.
- Template `expo lint` referenced removed boilerplate paths; the package now uses `eslint .`, which passes.
- Expo Doctor initially reported missing expo-constants/react-native-worklets; Expo CLI installed the SDK 54-compatible peer dependencies and Doctor passed.
- Expo config initially inherited RECORD_AUDIO from camera/image-picker defaults; both audio permissions were explicitly disabled and config was revalidated.

## Dark UI redesign (2026-07-19)

- Retained the frontend reference palette's navy and cyan/teal identity, then tuned it into a lower-glare dark system with layered navy surfaces, softened text, semantic feedback colors, and explicit control states.
- Added `index.css` as the requested cross-platform token reference and mirrored every color/elevation token in `src/theme`; Expo components consume the TypeScript theme because native React Native cannot import global CSS.
- Consolidated screen, header, text, button, input, card, status, brand, loading, empty, and error patterns in `src/components/ui.tsx` without adding a UI dependency.
- Preserved all route names, auth/camera contexts, API functions, multipart field names, upload payloads, and navigation outcomes.
- Added presentation-level error recovery for the Moments list and guarded image-library failures while retaining the existing backend behavior.
- Forced the app and splash surfaces to the dark palette and changed the status bar to light content.
- Updated the existing Expo dependency from `~54.0.35` to the Expo Doctor-required `~54.0.36`; no new runtime package was added.
- Visual QA found and corrected small-screen form positioning, then confirmed a scrollable 360x640 layout, a 390x844 phone layout, and a centered 768x1024 tablet layout.

## Expo icon cache fix (2026-07-19)

- The reported missing `assets/icon.png` path was not present in source, Git history, or the generated public Expo config; the current project has always used `assets/images/icon.png`.
- A clean Metro manifest generated the correct icon URL and served the existing PNG successfully, confirming a stale Expo/Metro client manifest rather than a missing repository asset.
- Cleared only the generated `.expo` project cache and added a `start:clear` script; no duplicate icon file or asset-path workaround was introduced.

## Mobile login timeout investigation (2026-07-19)

- Mobile was configured with a stale address from a previous LAN, while the computer had a different active Wi-Fi IPv4 address.
- The stale address produced no HTTP response and timed out at the network layer; localhost and the active LAN address returned health 200 in about 2 ms.
- Direct login checks through host and active LAN returned success in 142–154 ms. Invalid body returned 400, wrong password and unknown email returned 401.
- A temporary Docker backend published on host port 5001 returned health 200 and login success in 80 ms using its own temporary applicant, confirming Compose networking and Mongo readiness were not the cause.
- Updated the ignored local `.env` to the active LAN address. Added strict startup validation for `EXPO_PUBLIC_API_URL`, safe development request diagnostics, reliable abort classification, invalid-JSON classification, credential-safe 401 messaging, and a synchronous duplicate-submit guard.
- No backend, frontend, Docker Compose, API contract, token format, or timeout duration was changed.

## Network-independent API connectivity (2026-07-20)

- Reconfirmed the ignored mobile `.env` held the previous network address while the active Wi-Fi subnet had changed; localhost and the active LAN host both returned health 200.
- Confirmed port 5000 listened on all IPv4/IPv6 interfaces and Compose published it on the host, so backend binding and Docker were not the root cause.
- SDK 54 docs and installed `expo-constants ~18.0.13` types confirm development `expoConfig.hostUri`; Expo Go `debuggerHost` is retained only as fallback.
- LAN mode now derives the backend host from Metro. Tunnel/remote mode requires a fixed HTTPS URL; a named Cloudflare Tunnel runs beside the Docker backend with its token only in ignored root `.env`.
- Added Expo-compatible NetInfo 11.4.1, request cancellation on network changes, separate offline/network/timeout/HTTP errors, one reconnect retry for session/GET, and no automatic POST retry.
- A recoverable session check no longer deletes a valid stored token. Unknown upload outcomes warn about duplicate risk before manual retry.
- Request timeout remains 20 seconds; no evidence justified increasing it.

## Expo Go LAN host runtime fix (2026-07-20)

- A physical Expo Go attempt exposed an eager initialization gap: `API_CONFIG.url` resolved during module import, while Expo Router's web/static error-render bundle had no `expoConfig.hostUri`, so Metro failed before any API request.
- LAN URL resolution is now deferred until a request. SDK 54 host discovery prefers `expoConfig.hostUri` and falls back to `linkingUri`, `experienceUrl`, then Expo Go `debuggerHost`.
- A missing runtime host is returned as a recoverable configuration error instead of crashing module evaluation or invalidating the stored JWT.
- Backend binding, timeout, and authentication contracts were unchanged because they were not involved in this failure.
