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

- Expo SDK: 54 (`expo ~54.0.35` after Expo CLI normalization).
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

Set the phone-reachable backend URL in `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
```

The app removes trailing slashes and fails clearly in development when the variable is absent. Real `.env` files are ignored.

The phone cannot use `localhost` to reach a backend running on the development computer. On Windows, find the LAN IPv4 address with:

```powershell
ipconfig
```

Use the active adapter's IPv4 address. The phone and computer must be on the same LAN, Windows Firewall must allow the backend port (normally 5000), and the backend must be running on a reachable interface. The current Node server uses `app.listen(PORT)` and Docker publishes port 5000. If the backend is bound only to `127.0.0.1`, change the local server binding/configuration outside this mobile task or use a backend tunnel/deployment with HTTPS.

Android Emulator may use `10.0.2.2` for a host-machine API; other emulator setups can differ. iOS Simulator can usually use the host's localhost, while a physical iPhone needs the computer's LAN IP. Expo tunnel only tunnels Metro/project loading; it does not make the backend API public. If LAN access is unavailable, use a separate backend tunnel or deploy the backend to an HTTPS environment. This task does not create a paid tunnel service.

## Run with Expo Go 54

```bash
npm run start:lan
```

Scan the QR code with Expo Go 54. The primary development path is a real Android or iOS device. If LAN discovery fails:

```bash
npm run start:tunnel
```

Tunnel mode helps the device load Metro; the API URL still needs to point to a reachable backend.

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

1. Start MongoDB/backend with working credentials and Cloudinary config; verify the backend is reachable using the LAN IP.
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

- Replace `localhost` with the computer's LAN IP in `EXPO_PUBLIC_API_URL`.
- Confirm the URL includes `/api` and has no accidental extra path.
- Confirm backend is running, reachable from the phone browser, and not bound only to `127.0.0.1`.
- Confirm Windows Firewall allows port 5000.
- For HTTP standalone builds, platform security policy may require HTTPS or explicit configuration; Expo Go behavior is not a guarantee for future standalone builds.

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
