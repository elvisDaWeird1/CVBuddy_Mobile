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

- Created the SDK 54 app from `default@sdk-54`; final Expo package is `~54.0.35`, React Native is `0.81.5`, and React is `19.1.0`.
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
