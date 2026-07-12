# CVBuddy Mobile Agent Guide

## Read before coding

- Read this file and the relevant task under `.trellis/tasks/`.
- For backend integration, use `backend/docs/api-contract.md` plus the current backend routes, validation, controllers, and Swagger source as the contract source of truth.
- Keep mobile-specific setup and contract notes under `mobile/docs/`.

## Ponytail source of truth

Ponytail is not a separately installed package in this repository. The source of truth is the existing small-change convention in `backend/AGENTS.md` and `frontend/AGENTS.md`: choose the smallest useful implementation, preserve public contracts, avoid unnecessary abstraction/dependencies, and validate immediately. Mobile follows that same convention; do not create or install another Ponytail copy or change global Codex configuration.

## Mobile rules

- Keep Expo pinned to SDK 54 for Expo Go 54 and use Expo-compatible versions through `npx expo install`.
- Use strict TypeScript and native React Native/Expo APIs. Do not use DOM elements, browser storage, Axios interceptors, or web-only redirects.
- Store the JWT only in `expo-secure-store`. Never log or commit tokens, credentials, keystores, or real `.env` files.
- Upload Moment media to the backend with the existing `media` multipart field. Do not upload directly to Cloudinary or send `applicantId`.
- Handle loading, permission, empty, error, retry, and success states for user-triggered async work.
- Keep Expo Router as the only navigation system and keep app state limited to the auth and captured-photo contexts already needed by this slice.
- Docker is validation tooling. It is not a local iOS build environment on Windows.

## Trellis

Use `mobile/.trellis/tasks/` for this package's task notes and `mobile/.trellis/workspace/journal.md` for short history, following the package-local convention used by backend and frontend. Record decisions, changed files, validation results, manual-device gaps, and remaining work. Do not create a second root Trellis system.

## Validation

From `mobile/`:

```bash
npm ci
npm run lint
npm run typecheck
npx expo-doctor
```

Use `npm run validate` for the combined check. Run the Docker validation commands in `mobile/docs/mobile-setup.md` when container parity is needed.
