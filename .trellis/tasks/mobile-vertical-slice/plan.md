# Plan

- [x] Audit root, child-package conventions, Ponytail guidance, Trellis, Docker, and backend API source.
- [x] Create the Expo SDK 54 project with Expo Router and npm lockfile.
- [x] Add strict mobile config, permissions, environment handling, and agent guidance.
- [x] Implement auth hydration, login, protected API client, camera/image-picker flow, preview/upload, moments list, and logout.
- [x] Add EAS profiles, Docker validation tooling, ignore rules, and mobile docs.
- [x] Run local and Docker validation, record results, remaining risks, and manual-device checks.

## Dark UI redesign (2026-07-19)

- [x] Audit the existing screens, shared UI, navigation, and frontend color reference.
- [x] Add synchronized CSS-reference and TypeScript dark theme tokens.
- [x] Refactor shared controls and redesign login, capture, preview/success, and Moments states.
- [x] Validate narrow-phone, standard-phone, and tablet layouts without changing routes or API contracts.
- [x] Run lint, strict typecheck, Expo Doctor, web export, and browser runtime checks.

## Network-independent API connectivity (2026-07-20)

- [x] Reproduce the stale LAN URL against the current adapter and verify backend/Docker binding.
- [x] Replace LAN IP configuration with Expo SDK 54 `hostUri` discovery plus HTTPS tunnel/remote mode.
- [x] Add NetInfo cancellation, typed network errors, bounded reconnect behavior, and safe POST handling.
- [x] Add named Cloudflare Tunnel Compose support without committing credentials.
- [x] Complete CLI, SDK 54 bundle, backend Docker runtime, and Compose validation.
- [ ] Complete physical-device LAN/Wi-Fi/cellular checks.
