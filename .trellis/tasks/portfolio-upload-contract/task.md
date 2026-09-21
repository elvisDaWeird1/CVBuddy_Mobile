# Portfolio upload contract documentation

## Goal

Align the mobile Moment upload documentation with the backend 5 MB contract.

## Scope

Documentation only: mobile continues to upload one image under `media` and does not gain new features.

## Decision

Mobile should preflight its selected image against the documented 5 MB per-file backend limit when that work is scheduled; this task does not alter mobile source.

## Validation

Documentation-only change; backend 55/55 and frontend 32/32 shared-contract tests passed. No mobile source was changed.
