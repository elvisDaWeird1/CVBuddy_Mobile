# Check

## Validation

- Command:
- Result:

## Manual Checks

- Backend reachable from a phone over LAN and configured through `EXPO_PUBLIC_API_URL`.
- Expo Go 54 login, camera permission, photo capture, preview, caption, upload, recent moment list, logout, and auth persistence.

## Remaining Risks

- Camera and real multipart upload require a physical device and backend credentials/configuration.
- Cloudinary configuration and MongoDB data are external to this mobile package.
- Local HTTP behavior in future standalone builds may require platform-specific network security configuration.

- `npm ci`: passed.
- `npx expo install --check`: passed; dependencies up to date.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npx expo-doctor`: passed, 18/18 checks.
- `npx expo export --platform web`: passed; 7 static routes bundled.
- `docker build -t cvbuddy-mobile-tools ./mobile`: passed.
- `docker run --rm cvbuddy-mobile-tools npm run validate`: passed; lint, typecheck, and Expo Doctor 18/18.
- `docker compose -f docker-compose.mobile.yml --profile mobile-tools config`: passed.

## Manual Checks

- Physical-device camera, Expo Go QR, LAN API access, real Cloudinary upload, logout persistence, and Image Picker fallback remain for user/device verification.

## Remaining Risks

- The current workspace cannot access a physical Android/iOS camera or verify a real applicant login/upload session.
- Backend MongoDB, JWT, and Cloudinary configuration must be healthy for upload.
- The local shell is Node v24.18.0; Docker is Node 22 Alpine, so local development should prefer Node 22 LTS for parity.
- Final `npm run validate` after permission fix: passed.
- Final Docker rebuild and `docker run --rm cvbuddy-mobile-tools npm run validate`: passed.
- First Docker build timed out while pulling/installing; after pulling the Node 22 base image explicitly, the final image build passed.

## Dark UI redesign validation (2026-07-19)

- `npm run validate`: passed; lint, strict TypeScript, and Expo Doctor 18/18.
- `npx expo export --platform web`: passed; 7 static routes bundled.
- Color-literal audit: passed; component and route colors are sourced from `src/theme`.
- Browser runtime console: no warnings or errors on the redesigned login screen.
- Responsive browser checks passed at 360x640, 390x844, and 768x1024 with no horizontal overflow; the 360x640 layout exposes a vertical scroll area for the full form.
- Required email/password errors render as accessible alerts and keep the submit area reachable.
- Physical-device camera, permissions, image selection, real login/upload, safe-area behavior, and native keyboard behavior remain for device verification.
- `npm install` reports 14 moderate transitive audit findings; no breaking `npm audit fix --force` was applied.

## Expo icon cache fix (2026-07-19)

- Confirmed source and public Expo config both reference `./assets/images/icon.png`; no source references `assets/icon.png`.
- Removed and regenerated the project-local `.expo` cache, then started Metro with `--clear` in offline mode.
- Clean Android manifest request: passed (`200`).
- Generated icon URL: `/assets/./assets/images/icon.png`; direct Metro asset request passed (`200 image/png`, 393493 bytes).
- Added `npm run start:clear` for explicit cache recovery.

## Mobile login timeout fix (2026-07-19)

- Reproduction against the configured stale LAN URL: no HTTP response; curl timed out.
- `GET /api/health` through localhost and the active LAN address: 200 in about 2 ms.
- Host/LAN login success: 200 with applicant token present (token not logged), 142–154 ms.
- Docker-published login success on temporary host port 5001: 200 with applicant token present, 80 ms.
- Wrong password: 401; unknown email: 401; invalid body: 400.
- Frontend CORS preflight from `http://localhost:5173`: 204 with the expected allow-origin header.
- Temporary test accounts/profiles were removed from both databases, and the temporary backend container was stopped.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- Backend `npm run build`: passed.
- Backend `npm test`: passed, 35/35 tests.
- Isolated unavailable-Mongo probe: failed fast as expected with `ECONNREFUSED` after about 5 seconds; the running backend was not interrupted.
- `npm run validate`: passed; lint, strict typecheck, and Expo Doctor 18/18.
- `npx expo install --check`: passed; dependencies are up to date.
- `npx expo export --platform web`: passed; 7 static routes exported.
- Temporary Expo LAN server on port 8082: Android manifest returned 200 with runtime `exposdk:54.0.0`.
- Android development bundle returned 200, contained the configured API URL, and did not contain the stale URL. The temporary Metro process was stopped afterward.
- The pre-existing Metro process on port 8081 still contained the stale URL. It was restarted with a cleared cache; the final Android manifest and bundle both returned 200, contained the configured URL, and no longer contained the stale URL. Metro 8081 was left running for Expo Go.
- Physical Expo Go login still requires confirmation on the user's phone; the machine-side LAN endpoint and mobile bundle configuration are verified.

## Network-independent API connectivity (2026-07-20)

- Root-cause reproduction: stale mobile LAN address differed from the active Wi-Fi subnet.
- Host health: `GET /api/health` returned 200 through localhost and the active LAN interface.
- Listener audit: port 5000 listened on `0.0.0.0` and `[::]`; Docker Compose renders host port 5000 publishing correctly.
- `npx expo install @react-native-community/netinfo`: installed SDK 54-compatible 11.4.1.
- `npm run typecheck`: passed after the network changes.
- `npm run lint`: passed after the network changes.
- Backend `npm run build`: passed with explicit `0.0.0.0` binding.
- Dev + tunnel Compose config: passed with a placeholder validation token; no real token was used or logged.
- `npx expo install --check`: passed; dependencies are compatible with SDK 54.
- `npx expo-doctor`: passed, 18/18 checks.
- Production-mode web export with an HTTPS remote URL: passed; 7 static routes exported.
- Clean temporary LAN Metro manifest: 200, `exposdk:54.0.0`, and hostUri matched the LAN host used for the request.
- Android bundle: 200; hostUri/offline logic present, old LAN address and placeholder absent.
- Backend Docker image build: passed on Node 22 Alpine.
- Temporary Docker backend on host port 5001: health 200, invalid Bearer header returned the expected 401 payload, and dev CORS preflight returned 204. The test container was removed without creating a data volume.
- Backend test suite: passed, 39/39.
- Physical Expo Go Wi-Fi/hotspot/4G, firewall, authenticated login, and upload checks remain manual.

## Expo Go LAN host runtime fix (2026-07-20)

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx expo-doctor`: passed, 18/18 checks.
- Temporary SDK 54 LAN Metro manifest through the active LAN interface: 200; `hostUri` and Expo Go `debuggerHost` both matched the requested active LAN host on port 8086.
- Android development bundle: 200, 6,343,016 bytes.
- Expo Router web route: 200; web/static bundling completed without the former eager `Expo did not provide a Metro host` failure.
- Temporary Metro ports 8085/8086 were stopped after validation. Physical Expo Go login still requires confirmation on the user's phone.
