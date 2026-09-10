# Mobile Backend Contract

Synchronized from the current backend route/controller/validation/Swagger source on 2026-07-11. The backend domain routes are the source of truth; this file only records what this mobile vertical slice uses.

The base URL is resolved centrally and lazily in `src/config/env.ts`. LAN mode derives the host from Expo SDK 54's Metro/experience runtime URLs and appends the configured backend port plus `/api`. Deferring resolution until a request prevents Expo Router web/static imports from requiring a native Metro manifest. Tunnel/remote mode requires `EXPO_PUBLIC_API_URL` to be a complete HTTPS URL ending in `/api`.

## Login

`POST /api/auth/login`

Request JSON:

```json
{ "email": "applicant@example.com", "password": "Applicant@123" }
```

Success data:

```json
{
  "token": "jwt-token",
  "account": { "id": "...", "email": "...", "role": "APPLICANT", "status": "ACTIVE" }
}
```

Mobile only accepts an account with role `APPLICANT`.

## Current user

`GET /api/auth/me` with `Authorization: Bearer <token>`.

The app uses `data.account` to restore the session. `data.profile` is available but is not needed to upload a Moment.

## Logout

`POST /api/auth/logout` with `Authorization: Bearer <token>` and no body. The current backend acknowledges logout without a server-side token revocation list. Mobile always clears SecureStore even if this request fails.

## Create a Moment

`POST /api/portfolio/moments` with `Authorization: Bearer <token>` and `multipart/form-data`.

Fields sent by mobile:

- `media`: exactly one image file for this MVP. Backend multer accepts 1–5 files under this field.
- `capturedAt`: ISO date-time string; required.
- `caption`: optional string, trimmed, maximum 500 characters.
- `visibility`: `private`.

Mobile does not send `applicantId`, Cloudinary fields, `status`, or `experienceId`. Backend defaults the status to `draft` and derives ownership from the JWT. The backend currently accepts JPG/JPEG, PNG, WEBP, MP4, PDF, DOC, and DOCX and defaults the portfolio file limit to 10 MB; mobile sends images only. The runtime must create the multipart boundary, so mobile does not set `Content-Type` manually.

Success data is `{ "moment": { ... } }`. A Moment contains `id`, `caption`, `capturedAt`, `status`, `visibility`, and `mediaAssets`; each asset has a displayable `secureUrl`.

## List recent Moments

`GET /api/portfolio/moments?page=1&limit=20` with `Authorization: Bearer <token>`.

Success response uses `data` as the Moment array and a top-level `pagination` object. Mobile renders the first asset's `mediaAssets[0].secureUrl`, caption, captured time, status, visibility, and an experience title only if a future response includes `experience.title`.

## Shared response and errors

Success responses use `{ success: true, message, data?, pagination? }`. Errors use `{ success: false, message, errors }`. Mobile converts network, timeout, API, and validation failures into readable UI messages and never displays raw stack traces. A `401` clears the local token and returns the user to login.
