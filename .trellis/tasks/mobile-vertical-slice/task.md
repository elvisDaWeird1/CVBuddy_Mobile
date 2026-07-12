# Task

## Goal

Bootstrap a small Expo React Native app for the applicant portfolio-moment vertical slice: login, capture or select one photo, preview with optional caption, upload to the existing backend, view recent moments, and logout.

## Scope

- In scope: Expo SDK 54 app, strict TypeScript, Expo Router screens, SecureStore JWT persistence, camera and image-picker fallback, backend multipart upload, recent moment list, EAS profiles, Docker validation tooling, and mobile documentation.
- Out of scope: registration, password recovery, full portfolio editing, experiences/evidence CRUD, public portfolio, video, multi-image moments, offline/background upload, analytics, push notifications, store submission, and backend contract changes.

## Constraints

- Use the existing backend contract; do not upload directly to Cloudinary.
- Keep the implementation small and dependency-light in the Ponytail style.
- Pin Expo SDK 54 for Expo Go 54 and use npm/package-lock.
- Use SecureStore for the JWT and never log or persist it as plain text.
- A real device must use a reachable LAN/HTTPS API URL, not localhost.
- Docker is for deterministic validation/tooling only; it is not an iOS native build environment on Windows.
