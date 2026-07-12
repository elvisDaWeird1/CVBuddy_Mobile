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
