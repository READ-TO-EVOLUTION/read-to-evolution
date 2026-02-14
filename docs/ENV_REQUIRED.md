# Environment Variables Required at Runtime

This document lists environment variables that are NOT required at build time but ARE required at runtime.

## Overview

- **Build time**: `npm run build` succeeds even without `.env` file
- **Runtime**: APIs return 500 error if required environment variables are not set

## Required Environment Variables

### Stripe (Payment / Webhook)

| Variable Name | Purpose | Error Code | Affected APIs |
|--------------|---------|-----------|---------------|
| `STRIPE_SECRET_KEY` | Stripe API authentication | `STRIPE_NOT_CONFIGURED` | `/api/affiliate/opt-in`, `/api/stripe/webhook` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | `STRIPE_NOT_CONFIGURED` | `/api/stripe/webhook` |
| `STRIPE_AFFILIATE_PRICE_ID` | Affiliate Price ID | `STRIPE_NOT_CONFIGURED` | `/api/affiliate/opt-in` |

**Optional (STUDY_SUB tiers)**:
- `STRIPE_STUDY_PRICE_ID_3` (3 books or less)
- `STRIPE_STUDY_PRICE_ID_5` (5 books or less)
- `STRIPE_STUDY_PRICE_ID_10` (10 books or less)
- `STRIPE_STUDY_PRICE_ID_20` (20 books or less)
- `STRIPE_STUDY_PRICE_ID_30` (30 books or less)
- `STRIPE_STUDY_PRICE_ID_50` (50 books or less)

### JWT Authentication

| Variable Name | Purpose | Error Code | Affected APIs |
|--------------|---------|-----------|---------------|
| `JWT_SECRET` | JWT signing secret | `JWT_NOT_CONFIGURED` | `/api/auth/login`, `/api/auth/register` |

## Error Response Format

### Stripe Errors

```json
{
  "error": "STRIPE_NOT_CONFIGURED",
  "message": "Stripe configuration is incomplete"
}
```

**Status Code**: `500`

### JWT Errors

```json
{
  "error": "JWT_NOT_CONFIGURED",
  "message": "JWT_SECRET environment variable is required"
}
```

**Status Code**: `500`

## Verification

### Build Verification

```powershell
# Build without .env
.\scripts\test-build-without-env.ps1
```

### Runtime Verification

```bash
# Call /api/affiliate/opt-in without STRIPE_SECRET_KEY
curl -X POST http://localhost:3000/api/affiliate/opt-in \
  -H "Content-Type: application/json" \
  -d '{"intent":"ENABLE_AFFILIATE"}'

# -> 500 { "error": "STRIPE_NOT_CONFIGURED", ... }
```

## CI / Local Build Sequence

Standard execution order (CI/local common):

1. **Scan for top-level env access**:
   ```powershell
   .\scripts\scan-top-level-env.ps1
   ```
   - **Pass condition**: Exit code 0
   - **Purpose**: Detect risky top-level env access that can break Next.js build
   - **Usage**: PR/CI gate to prevent build-time failures

2. **Remove .next directory** (required for OneDrive environments):
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```
   - **Note**: OneDrive sync folders cause EINVAL readlink errors. Always delete `.next` before build in OneDrive environments.

3. **Build without .env**:
   ```powershell
   .\scripts\test-build-without-env.ps1
   ```
   - **Pass condition**: Exit code 0
   - **Purpose**: Verify build succeeds without environment variables

4. **Normal build** (with .env restored):
   ```powershell
   npm run build
   ```
   - **Pass condition**: Exit code 0

## Notes

- **Webhook without env**: Stripe retries webhooks, so returning 500 repeatedly may flood logs
- **Production**: Always set all required environment variables
- **Development**: Create `.env` file based on `.env.example`

## Related Files

- `lib/stripe.ts`: Stripe environment variable checks
- `lib/auth.ts`: JWT environment variable checks
- `scripts/test-build-without-env.ps1`: Build test script
- `scripts/scan-top-level-env.ps1`: Top-level env access scanner
