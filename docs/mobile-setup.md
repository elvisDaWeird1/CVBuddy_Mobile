# CVBuddy Mobile Setup

## Purpose

This package is a deliberately small applicant vertical slice:

1. Log in with an existing applicant account.
2. Open the rear camera or choose an image from the library.
3. Review the image and add an optional caption.
4. Upload one image as a private Portfolio Moment through the CVBuddy backend.
5. View recent Moments.
6. Log out.

It is not the full Portfolio editor.

## Versions and package manager

- Expo SDK: 54 (`expo ~54.0.36` after Expo CLI normalization).
- React Native: `0.81.5`.
- React: `19.1.0`.
- Package manager: npm, with committed `package-lock.json`.
- Docker validation image: Node 22 Alpine, matching the existing frontend Docker convention.
- The current shell reports Node `v24.18.0` and npm `11.14.1`. Prefer Node 22 LTS for local parity with Docker and Expo SDK 54; Node 24 was not used as the Docker baseline.

## Install and environment

```bash
cd mobile
npm ci
copy .env.example .env
```

LAN mode is the default for local development:

```env
EXPO_PUBLIC_API_MODE=lan
EXPO_PUBLIC_API_PORT=5000
EXPO_PUBLIC_API_URL=
```

In LAN mode, the app resolves the host lazily when the first API request starts. It prefers `Constants.expoConfig.hostUri`, then falls back to the SDK 54 runtime URLs (`Constants.linkingUri` and `Constants.experienceUrl`) and Expo Go's `debuggerHost`. The lazy lookup is intentional: Expo Router's web/static render can import the API module before a Metro host exists. The app extracts the runtime hostname and builds `http://<metro-host>:<port>/api`. No LAN address is stored in source or `.env`. The phone and computer must still be on the same LAN, Windows Firewall must allow the backend port, and the backend must listen on `0.0.0.0`.

Use tunnel mode when the phone and computer are on different networks, when the phone uses cellular data, or when the connection changes frequently:

```env
EXPO_PUBLIC_API_MODE=tunnel
EXPO_PUBLIC_API_PORT=5000
EXPO_PUBLIC_API_URL=https://api-dev.example.com/api
```

The tunnel URL must use HTTPS and include `/api`. Replace the example hostname with the fixed hostname configured for the named Cloudflare Tunnel. Real `.env` files and tunnel tokens are ignored by Git. The client rejects malformed URLs, credentials, query strings, fragments, insecure tunnel URLs, missing `/api`, and LAN mode in production.

Verify the selected backend before login:

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:5000/api/health"
# Tunnel mode:
Invoke-WebRequest -UseBasicParsing "https://api-dev.example.com/api/health"
```

Expo's `--tunnel` flag only tunnels Metro. This project pairs it with an independently configured backend Cloudflare Tunnel. A LAN URL cannot reach a laptop from cellular data or an unrelated Wi-Fi network.

## Run with Expo Go 54

```bash
npm run start:lan
```

Scan the QR code with Expo Go 54. The primary development path is a real Android or iOS device. If LAN discovery fails:

```bash
npm run start:tunnel
```

`start:lan` sets API mode to LAN and starts Metro with `--lan`. `start:tunnel` sets API mode to tunnel and starts Metro with `--tunnel`; it requires the fixed backend HTTPS URL in `mobile/.env`. A full Expo Go reload is required after changing public environment variables. If both devices move to a new LAN, reconnect/reload Expo Go so it receives the new Metro `hostUri`; use tunnel mode for seamless Wi-Fi-to-cellular switching.

If an older bundle reports `Expo did not provide a Metro host` together with `Web Bundled ... .expo/static-tmp/_error.js`, stop that Metro process and restart once with `npm run start:lan -- --clear`. The current implementation does not resolve the LAN URL during module import, so web/static rendering no longer fails merely because `hostUri` is unavailable there.

`npm run ios` opens the iOS simulator workflow only where macOS/Xcode is available. Windows cannot local-build iOS. Android commands require the relevant local Android tooling; Expo Go on a physical device does not require an Android native build.

## Permissions and flow

- Camera permission text: “CVBuddy needs camera access so you can capture evidence for your portfolio.”
- Photo library permission is configured for the Image Picker fallback.
- No location or microphone permission is requested.
- If camera permission is denied, the screen explains the reason, allows another permission attempt, and keeps the photo-library fallback available.
- The image is never uploaded before preview. A failed upload keeps the image and caption so the user can retry.
- JWTs are stored only with `expo-secure-store`. A 401 clears the token and returns to login; logout attempts the backend call and clears local storage even if the call fails.

The exact API fields and responses are in [mobile-backend-contract.md](./mobile-backend-contract.md).

## Validation

```bash
npm run lint
npm run typecheck
npx expo install --check
npx expo-doctor
npm run validate
```

There is no test runner in this bootstrap slice, so no automated unit/integration test pass is claimed.

## Docker validation

The mobile Dockerfile installs from `package-lock.json`, runs as a non-root user, and defaults to validation. It does not run Metro by default and cannot build an iOS app on Windows.

```bash
docker build -t cvbuddy-mobile-tools ./mobile
docker run --rm cvbuddy-mobile-tools npm run lint
docker run --rm cvbuddy-mobile-tools npm run typecheck
docker run --rm cvbuddy-mobile-tools npx expo-doctor
```

The optional root Compose file keeps mobile tooling separate from the existing backend/frontend stack:

```bash
docker compose -f docker-compose.mobile.yml --profile mobile-tools run --rm mobile npm run lint
docker compose -f docker-compose.mobile.yml --profile mobile-tools run --rm mobile npm run typecheck
docker compose -f docker-compose.mobile.yml --profile mobile-tools run --rm mobile npm run doctor
```

Docker standardizes Node/dependency validation only. It does not provide a Dockerized Android emulator, iOS simulator, camera, Expo Go device connection, or local iOS build on Windows. Metro in a container is intentionally not the default because Windows file watching and Expo Go LAN networking become less predictable.

## EAS Build preparation

`eas.json` contains `development`, `preview`, and `production` profiles. Development today remains Expo Go; the profile is ready for a later internal build and does not invent a project ID or credentials.

After signing in to an Expo account, run from `mobile/` when ready:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
```

Android builds require the appropriate Expo/Google Play setup later. iOS builds require an Apple Developer account and EAS-managed credentials. Do not commit Expo tokens, Apple credentials, certificates, provisioning profiles, Android keystores, service-account JSON, or real environment files. Do not run production builds or store submissions as part of this task.

Move from Expo Go to a development build when a required native library is not included in Expo Go, when full app icon/name/splash behavior needs checking, when native behavior must match production more closely, and before store release testing. If that happens, evaluate `expo-dev-client` and the EAS development profile at that time.

## Manual device checklist

The following must be checked on a device because this workspace cannot verify a physical camera:

1. Start MongoDB/backend with working credentials and Cloudinary config; verify `/api/health` through the selected LAN or tunnel mode.
2. Create `mobile/.env` from `.env.example`.
3. Start Expo SDK 54 and open it in Expo Go 54.
4. Log in with an applicant account.
5. Allow camera permission, capture an image, and verify preview.
6. Enter a caption and upload.
7. Verify success ID/response and that the image appears in Recent Moments.
8. Verify the same Moment through the web frontend or backend API.
9. Log out, reopen the app, and verify that protected screens require login.
10. Repeat with camera permission denied and use the Image Picker fallback.

## Troubleshooting

### Expo Go does not open the project

- Confirm Expo Go is version 54 and the project reports Expo SDK 54.
- Confirm phone and computer share a network and that Windows Firewall allows Metro.
- Try `npm run start:tunnel` for Metro connectivity.
- Restart Expo with a cleared cache if the QR/session is stale.

### The app opens but API calls fail

- In LAN mode, start with `npm run start:lan`; do not set a LAN address in `EXPO_PUBLIC_API_URL`.
- If the phone and laptop are not on the same network, switch to the named backend tunnel and run `npm run start:tunnel`.
- Fully reload Expo Go after changing `EXPO_PUBLIC_` values. LAN mode also needs a reconnect/reload after both devices move to a different LAN so Expo can issue a new `hostUri`.
- Confirm tunnel/remote URLs use HTTPS, include `/api`, and return `200` from `/api/health`.
- Confirm backend is running and listening on `0.0.0.0`; Docker must publish `5000:5000`.
- Confirm Windows Firewall allows port 5000.
- In development, inspect the safe `[CVBuddy API]` console entries for method, URL, response status, duration, and error kind. Request bodies, passwords, and tokens are never logged.
- `offline` means NetInfo reports no connection; `network` means the device is online but the backend/tunnel/DNS is unreachable; `timeout` means the backend did not answer before the request deadline.

### Camera does not work

- Check Expo Go camera permission in device settings and retry.
- Confirm the device has a camera and another app is not holding it.
- Use the photo-library fallback.

### Upload fails

- The JWT may be expired; log in again.
- The upload field must be `media`, not `file` or a Cloudinary field.
- The file must be JPG/JPEG, PNG, or WEBP and within the backend file-size limit.
- Keep `Content-Type` unset for FormData so the runtime creates the multipart boundary.
- Confirm backend/Cloudinary configuration and MongoDB are healthy.
