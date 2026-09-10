# Workspace Journal

## 2026-07-11

- Started the mobile vertical-slice task after auditing the package-local backend/frontend conventions.
- Confirmed the mobile package will use Expo SDK 54, Expo Go during development, EAS for later native builds, backend-owned uploads, and SecureStore JWT persistence.

- Implemented the SDK 54 Expo Router vertical slice with backend-owned Moment uploads, SecureStore auth, camera permission fallback, and recent Moments list.
- Added mobile docs, EAS profiles, Docker validation image/Compose tooling, and root docs index/ignore rules.
- Validation passed locally and in Docker; physical-device verification remains follow-up work.
- Audited generated native permissions and explicitly disabled microphone/audio permission for the photo-only MVP; final Expo config exposes camera only.

## 2026-07-13

- Fixed browser auth hydration by using localStorage on web while preserving SecureStore for native Expo Go platforms.
- Fixed web Moment uploads by converting the selected image URI to a Blob before appending the multipart `media` field; native uploads keep the React Native URI shape.
- Validation passed: `npm run lint`, `npm run typecheck`, and `npx expo export --platform web`.

## 2026-07-19

- Reworked the complete mobile vertical-slice UI into a navy dark theme while preserving auth, camera, upload, API, and route contracts.
- Added synchronized `index.css` and TypeScript design tokens plus shared screen, header, text, button, input, card, feedback, and state components.
- Redesigned login, permission/camera capture, preview/upload-success, and recent Moments layouts including pressed, focused, disabled, loading, empty, error, retry, and success states.
- Updated Expo within SDK 54 from `~54.0.35` to `~54.0.36` so Expo Doctor passes 18/18; no new feature dependency was added.
- Validation passed: lint, strict typecheck, Expo Doctor 18/18, 7-route web export, color-literal audit, and responsive browser QA at 360x640, 390x844, and 768x1024.
- Native camera, keyboard, safe-area, permission, real login/upload, and backend-connected flows still require physical-device verification.
- Fixed a stale Expo/Metro icon manifest error by clearing the generated `.expo` cache and adding `npm run start:clear`; a clean manifest and direct icon request both returned HTTP 200.
- Investigated the Expo Go login timeout end to end. The ignored mobile `.env` still pointed to a previous LAN address instead of the active Wi-Fi address, so login never reached Express and was aborted after 20 seconds.
- Verified host, active-LAN, and temporary Docker-published API paths; backend login, MongoDB, bind address, CORS, and Compose networking responded normally.
- Corrected the local URL and hardened API URL validation, safe request diagnostics, error classification, and duplicate-login protection without changing backend/frontend contracts.
- Detected that the already-running Metro 8081 bundle still held the stale inlined URL, restarted it with a cleared cache, and verified the final Android bundle contains only the corrected API URL.

## 2026-07-20

- Reproduced the same failure after another network change: the mobile env retained the old LAN address while the laptop was on a different subnet; backend health remained reachable through localhost and the active LAN interface.
- Replaced source-configured LAN addressing with Expo SDK 54 Metro host discovery and added an explicit fixed-HTTPS tunnel/remote mode.
- Added NetInfo-aware cancellation, offline/backend/timeout/HTTP classification, recoverable auth hydration, bounded GET retry on reconnect, and non-retrying upload/login behavior.
- Added named Cloudflare Tunnel Docker Compose support with an environment-only token and documented LAN, tunnel, health checks, test matrix, and production limits.
- Fixed Expo Go LAN startup after the web/static render path imported API configuration without a Metro `hostUri`: host discovery is now request-time and uses documented SDK 54 runtime URL fallbacks. TypeScript, lint, and temporary Metro web/Android bundling were revalidated.
