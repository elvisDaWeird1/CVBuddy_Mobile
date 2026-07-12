# Workspace Journal

## 2026-07-11

- Started the mobile vertical-slice task after auditing the package-local backend/frontend conventions.
- Confirmed the mobile package will use Expo SDK 54, Expo Go during development, EAS for later native builds, backend-owned uploads, and SecureStore JWT persistence.

- Implemented the SDK 54 Expo Router vertical slice with backend-owned Moment uploads, SecureStore auth, camera permission fallback, and recent Moments list.
- Added mobile docs, EAS profiles, Docker validation image/Compose tooling, and root docs index/ignore rules.
- Validation passed locally and in Docker; physical-device verification remains follow-up work.
- Audited generated native permissions and explicitly disabled microphone/audio permission for the photo-only MVP; final Expo config exposes camera only.
