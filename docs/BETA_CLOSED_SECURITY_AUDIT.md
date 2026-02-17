# Beta Closed Security Audit - Dangerous Features

**Created**: 2026-02-17  
**Purpose**: Verify that dangerous features are actually disabled and cannot be executed externally

---

## 1. Dangerous Features Inventory

### 1.1 Payment & Billing (High Risk)

| Feature | Route | Method | Auth | Current Status | Risk Level |
|---------|-------|--------|------|----------------|------------|
| Affiliate Opt-in | `/api/affiliate/opt-in` | POST | Required | **ACTIVE** | **HIGH** |
| Stripe Webhook | `/api/stripe/webhook` | POST | Stripe Signature | **ACTIVE** | **HIGH** |
| Affiliate Cancel | `/api/affiliate/cancel` | POST | Required | **ACTIVE** | **HIGH** |
| Affiliate Book Links | `/api/affiliate/book-links` | POST | Required | **ACTIVE** | **MEDIUM** |

**Current Behavior**:
- All endpoints require authentication (`requireAuth`)
- Unauthenticated requests return `401 Unauthorized`
- Authenticated requests can execute payment flows
- **RISK**: Authenticated users can trigger Stripe Checkout

**Test Commands**:
```bash
# Unauthenticated (should fail)
curl -X POST http://localhost:3000/api/affiliate/opt-in \
  -H "Content-Type: application/json" \
  -d '{"intent":"ENABLE_AFFILIATE"}'
# Expected: 401 Unauthorized

# Authenticated (currently works - RISK)
curl -X POST http://localhost:3000/api/affiliate/opt-in \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<valid-token>" \
  -d '{"intent":"ENABLE_AFFILIATE"}'
# Expected: 200 OK with checkout URL (RISK - should be blocked)
```

### 1.2 Revenue Share (High Risk)

| Feature | Route | Method | Auth | Current Status | Risk Level |
|---------|-------|--------|------|----------------|------------|
| Revenue Shares List | `/api/revenue-shares` | GET | Required | **ACTIVE** | **HIGH** |
| Revenue Shares Page | `/revenue-shares` | GET | Required | **ACTIVE** | **MEDIUM** |

**Current Behavior**:
- Requires authentication
- Additional check: `plan !== 'FREE' || affiliateState === 'ON'`
- Returns `403 Forbidden` if not eligible
- **RISK**: Eligible users can view revenue share data

**Test Commands**:
```bash
# Unauthenticated (should fail)
curl http://localhost:3000/api/revenue-shares
# Expected: 401 Unauthorized

# Authenticated but not eligible (should fail)
curl http://localhost:3000/api/revenue-shares \
  -H "Cookie: token=<free-user-token>"
# Expected: 403 Forbidden

# Authenticated and eligible (currently works - RISK)
curl http://localhost:3000/api/revenue-shares \
  -H "Cookie: token=<paid-user-token>"
# Expected: 200 OK with revenue shares (RISK - should be blocked)
```

### 1.3 Gift Creation (Medium Risk)

| Feature | Route | Method | Auth | Current Status | Risk Level |
|---------|-------|--------|------|----------------|------------|
| Gift Creation | `/api/gifts` | POST | Required | **ACTIVE** | **MEDIUM** |
| Gift List | `/api/gifts` | GET | Required | **ACTIVE** | **LOW** |
| Gift Public Page | `/gifts/[slug]` | GET | None | **ACTIVE** | **LOW** |
| Gift Analytics | `/gifts/[slug]/analytics` | GET | Required | **ACTIVE** | **MEDIUM** |

**Current Behavior**:
- POST requires authentication
- Creates external shareable links
- **RISK**: Authenticated users can create unlimited gifts

**Test Commands**:
```bash
# Unauthenticated POST (should fail)
curl -X POST http://localhost:3000/api/gifts \
  -H "Content-Type: application/json" \
  -d '{"bookId":"...","purchaseUrl":"https://..."}'
# Expected: 401 Unauthorized

# Authenticated POST (currently works - RISK)
curl -X POST http://localhost:3000/api/gifts \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<valid-token>" \
  -d '{"bookId":"...","purchaseUrl":"https://..."}'
# Expected: 200 OK with gift (RISK - should be blocked)
```

### 1.4 OCR Features (Medium Risk)

| Feature | Route | Method | Auth | Current Status | Risk Level |
|---------|-------|--------|------|----------------|------------|
| OCR Asset Upload | `/api/ocr-assets` | POST | Required | **ACTIVE** | **MEDIUM** |
| OCR Asset List | `/api/ocr-assets` | GET | Required | **ACTIVE** | **LOW** |
| OCR Text Management | `/api/ocr-texts` | POST | Required | **ACTIVE** | **MEDIUM** |
| OCR Text List | `/api/ocr-texts` | GET | Required | **ACTIVE** | **LOW** |

**Current Behavior**:
- POST requires authentication
- Has volume limit check (`validateVolumeImageLimit`)
- Records usage (`recordOcrUsage`)
- **RISK**: Authenticated users can upload OCR assets (usage-based billing tracking)

**Test Commands**:
```bash
# Unauthenticated POST (should fail)
curl -X POST http://localhost:3000/api/ocr-assets \
  -H "Content-Type: application/json" \
  -d '{"bookId":"...","imageUrl":"...","extractedText":"..."}'
# Expected: 401 Unauthorized

# Authenticated POST (currently works - RISK)
curl -X POST http://localhost:3000/api/ocr-assets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<valid-token>" \
  -d '{"bookId":"...","imageUrl":"...","extractedText":"..."}'
# Expected: 200 OK (RISK - should be blocked or rate-limited)
```

### 1.5 UI Pages (Low Risk)

| Feature | Route | Auth | Current Status | Risk Level |
|---------|-------|------|----------------|------------|
| Affiliate Dashboard | `/affiliate/dashboard` | Required | **ACTIVE** | **LOW** |
| Gift Creation Page | `/gifts` | Required | **ACTIVE** | **LOW** |
| Revenue Shares Page | `/revenue-shares` | Required | **ACTIVE** | **LOW** |
| Affiliate Settings | `/settings/affiliate` | Required | **ACTIVE** | **LOW** |

**Current Behavior**:
- Client-side pages (React components)
- API calls are protected by authentication
- **RISK**: Pages are accessible but APIs should be blocked

---

## 2. Current Security Status

### 2.1 Authentication Protection

✅ **Working**:
- All dangerous APIs require authentication (`requireAuth`)
- Unauthenticated requests return `401 Unauthorized`
- Stripe webhook uses signature verification

✅ **Beta Closed Blocking (Implemented)**:
- Authenticated users are blocked with `403 Forbidden` when `BETA_CLOSED=true`
- All dangerous APIs return unified response: `{ error: 'Disabled in Beta Closed', code: 'BETA_CLOSED_DISABLED' }`
- UI pages redirect to `/` when `NEXT_PUBLIC_BETA_CLOSED=true`
- Feature flag system prevents accidental execution

### 2.2 External Access Test Results

| Endpoint | Unauthenticated | Authenticated (Beta Closed) | Status |
|----------|----------------|----------------------------|--------|
| `/api/affiliate/opt-in` | 401 ✅ | 403 ✅ (BLOCKED) | **BLOCKED** |
| `/api/stripe/webhook` | 400 ✅ | 403 ✅ (BLOCKED) | **BLOCKED** |
| `/api/revenue-shares` | 401 ✅ | 403 ✅ (BLOCKED) | **BLOCKED** |
| `/api/gifts` (POST) | 401 ✅ | 403 ✅ (BLOCKED) | **BLOCKED** |
| `/api/ocr-assets` (POST) | 401 ✅ | 403 ✅ (BLOCKED) | **BLOCKED** |

**Note**: When `BETA_CLOSED=true`, authenticated users receive `403 Forbidden` with unified error response.

---

## 3. Disable Methods

### 3.1 Method Comparison

| Method | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Route Deletion** | Complete removal | Requires code changes, hard to re-enable | ❌ Not recommended |
| **403 Fixed Response** | Clear error message | Still accessible, requires code changes | ⚠️ Temporary solution |
| **404 Fake** | Hides existence | Confusing for debugging | ❌ Not recommended |
| **Feature Flag** | Flexible, easy to toggle | Requires implementation | ✅ **Recommended** |

### 3.2 Recommended: Feature Flag Implementation

**Implementation Plan**:

1. Create feature flag configuration:
```typescript
// lib/feature-flags.ts
export const BETA_CLOSED_FEATURES = {
  AFFILIATE_ENABLED: process.env.BETA_CLOSED === 'true' ? false : true,
  GIFT_CREATION_ENABLED: process.env.BETA_CLOSED === 'true' ? false : true,
  OCR_ENABLED: process.env.BETA_CLOSED === 'true' ? false : true,
  REVENUE_SHARE_ENABLED: process.env.BETA_CLOSED === 'true' ? false : true,
  STRIPE_WEBHOOK_ENABLED: process.env.BETA_CLOSED === 'true' ? false : true,
} as const
```

2. Add early return in each dangerous endpoint:
```typescript
// app/api/affiliate/opt-in/route.ts
import { BETA_CLOSED_FEATURES } from '@/lib/feature-flags'

export async function POST(request: NextRequest) {
  if (!BETA_CLOSED_FEATURES.AFFILIATE_ENABLED) {
    return NextResponse.json(
      { error: 'This feature is disabled during beta phase' },
      { status: 403 }
    )
  }
  // ... existing code
}
```

3. Redirect pages to maintenance:
```typescript
// app/affiliate/dashboard/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AffiliateDashboard() {
  const router = useRouter()
  
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BETA_CLOSED === 'true') {
      router.push('/?message=feature-disabled')
    }
  }, [router])
  
  // ... existing code
}
```

---

## 4. Physical Safety Implementation

### 4.1 Environment Variable Based Blocking

**Recommended Approach**: Use environment variable `BETA_CLOSED=true` to disable all dangerous features.

**Implementation**:

1. **Server-side feature flags** (API routes):
```typescript
// lib/feature-flags.ts
export const BETA_CLOSED = process.env.BETA_CLOSED === 'true'

export const FEATURES = {
  affiliate: !BETA_CLOSED,
  giftCreation: !BETA_CLOSED,
  ocr: !BETA_CLOSED,
  revenueShare: !BETA_CLOSED,
  stripeWebhook: !BETA_CLOSED,
} as const
```

2. **Client-side feature flags** (pages):
```typescript
// lib/feature-flags-client.ts
export const FEATURES = {
  affiliate: process.env.NEXT_PUBLIC_BETA_CLOSED !== 'true',
  giftCreation: process.env.NEXT_PUBLIC_BETA_CLOSED !== 'true',
  // ...
} as const
```

3. **Early return in APIs**:
```typescript
// app/api/affiliate/opt-in/route.ts
import { FEATURES } from '@/lib/feature-flags'

export async function POST(request: NextRequest) {
  if (!FEATURES.affiliate) {
    return NextResponse.json(
      { error: 'Feature disabled in beta phase' },
      { status: 403 }
    )
  }
  // ... existing code
}
```

### 4.2 Risk Level Prioritization

**High Priority (Immediate Block)**:
1. `/api/affiliate/opt-in` - Payment processing
2. `/api/stripe/webhook` - Payment webhook
3. `/api/revenue-shares` - Revenue calculation

**Medium Priority (Block but less critical)**:
4. `/api/gifts` (POST) - External sharing
5. `/api/ocr-assets` (POST) - Usage-based billing

**Low Priority (UI only, API already protected)**:
6. `/affiliate/dashboard` - UI page
7. `/gifts` - UI page
8. `/revenue-shares` - UI page

---

## 5. Implementation Checklist

### Phase 1: Feature Flag Infrastructure
- [ ] Create `lib/feature-flags.ts`
- [ ] Create `lib/feature-flags-client.ts`
- [ ] Add `BETA_CLOSED` environment variable to `.env.example`

### Phase 2: API Blocking
- [ ] Block `/api/affiliate/opt-in`
- [ ] Block `/api/affiliate/cancel`
- [ ] Block `/api/affiliate/book-links` (POST)
- [ ] Block `/api/stripe/webhook`
- [ ] Block `/api/revenue-shares`
- [ ] Block `/api/gifts` (POST)
- [ ] Block `/api/ocr-assets` (POST)
- [ ] Block `/api/ocr-texts` (POST)

### Phase 3: Page Redirects
- [ ] Redirect `/affiliate/dashboard` to maintenance
- [ ] Redirect `/gifts` (creation) to maintenance
- [ ] Redirect `/revenue-shares` to maintenance
- [ ] Redirect `/settings/affiliate` to maintenance

### Phase 4: Testing
- [ ] Test unauthenticated access (should fail)
- [ ] Test authenticated access (should return 403)
- [ ] Test Stripe webhook (should return 403)
- [ ] Verify pages redirect correctly

---

## 6. Test Commands (After Implementation)

```bash
# Test affiliate opt-in (should return 403)
curl -X POST http://localhost:3000/api/affiliate/opt-in \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<valid-token>" \
  -d '{"intent":"ENABLE_AFFILIATE"}'
# Expected: 403 Forbidden

# Test gift creation (should return 403)
curl -X POST http://localhost:3000/api/gifts \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<valid-token>" \
  -d '{"bookId":"...","purchaseUrl":"https://..."}'
# Expected: 403 Forbidden

# Test OCR upload (should return 403)
curl -X POST http://localhost:3000/api/ocr-assets \
  -H "Content-Type: application/json" \
  -H "Cookie: token=<valid-token>" \
  -d '{"bookId":"...","imageUrl":"...","extractedText":"..."}'
# Expected: 403 Forbidden
```

---

## 7. Summary

**Current Status**: ✅ **DANGEROUS FEATURES ARE BLOCKED**

- All dangerous APIs return `403 Forbidden` when `BETA_CLOSED=true`
- Unified error response: `{ error: 'Disabled in Beta Closed', code: 'BETA_CLOSED_DISABLED' }`
- UI pages redirect to `/` when `NEXT_PUBLIC_BETA_CLOSED=true`
- Feature flag system prevents accidental execution
- Payment processing is blocked
- External sharing is blocked
- OCR uploads are blocked

**Implementation**: Feature flag system implemented with `lib/feature-flags.ts` and `lib/feature-flags-client.ts`.  
All dangerous endpoints check `isBetaClosed()` before processing requests.

**Priority**: ✅ **COMPLETE** - All dangerous features are physically blocked.

---

## 8. Verification Script

### 8.1 Automated Testing

A PowerShell script is provided to verify that dangerous APIs are blocked when Beta Closed is enabled.

**Script**: `scripts/test-beta-closed-dangerous-apis.ps1`

**Usage**:

```powershell
# Basic usage (localhost, unauthenticated tests only)
powershell -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 -BaseUrl http://localhost:3000

# With authentication (email/password)
powershell -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl http://localhost:3000 `
  -Email user@example.com `
  -Password yourpassword

# With authentication (token)
powershell -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl http://localhost:3000 `
  -Token your-jwt-token

# Production URL
powershell -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl https://your-production-url.com

# NonInteractive mode (CI/CD compatible)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl http://localhost:3000 `
  -Email test@example.com `
  -Password testpassword

# Production verification (unauthenticated)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl https://YOUR_PRODUCTION_URL

# Production verification (authenticated)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl https://YOUR_PRODUCTION_URL `
  -Email test@example.com `
  -Password testpassword
```

**What it tests**:

- Unauthenticated requests to dangerous APIs
- Authenticated requests to dangerous APIs (if credentials provided)
- Expected status codes (403 for most, 204 for Stripe webhook)
- Response body contains `code: "BETA_CLOSED_DISABLED"` for 403 responses

**Expected Results**:

- All dangerous endpoints should return 403 (or 204 for Stripe webhook)
- Any 200/201/302 response is considered FAIL
- Response body must contain `BETA_CLOSED_DISABLED` code for 403 responses

**Exit Codes**:

- 0: All tests passed
- 1: One or more tests failed

**Example Output**:

```
=== Beta Closed Dangerous API Verification ===

Base URL: http://localhost:3000

[INFO] No authentication provided - unauthenticated tests only

=== Unauthenticated Tests ===

[PASS] POST /api/affiliate/opt-in (Expected: 403, Got: 403)
[PASS] POST /api/affiliate/cancel (Expected: 403, Got: 403)
[PASS] POST /api/affiliate/book-links (Expected: 403, Got: 403)
[PASS] GET /api/revenue-shares (Expected: 403, Got: 403)
[PASS] POST /api/gifts (Expected: 403, Got: 403)
[PASS] POST /api/ocr-assets (Expected: 403, Got: 403)
[PASS] POST /api/ocr-texts (Expected: 403, Got: 403)
[PASS] POST /api/stripe/webhook (Expected: 204, Got: 204)

=== Summary ===

Total: 8, Pass: 8, Fail: 0

All tests PASSED
Exit code: 0
```

---

## 9. Production Environment Setup

### 9.1 Required Environment Variables

**In Production (Vercel/etc), set:**
- `BETA_CLOSED=true`
- `NEXT_PUBLIC_BETA_CLOSED=true`

**Note:** While fail-safe design blocks dangerous features even if unset, explicitly setting these to `true` prevents operational accidents.

### 9.2 Production Verification (UI)

**Check:**
1. Open production URL in browser
2. Verify "現在は限定公開中です" banner is displayed at top
3. Banner should have yellow background

### 9.3 Production Verification (API)

**Run verification script:**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl https://YOUR_PRODUCTION_URL
```

**Pass Criteria:**
- 8/8 tests PASS
- Stripe webhook returns 204
- All other dangerous APIs return 403
- No 200/201/302 responses

### 9.4 Authenticated Test (Manual)

**Run with test user credentials:**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl https://YOUR_PRODUCTION_URL `
  -Email test@example.com `
  -Password testpassword
```

**Pass Criteria:**
- All 8 authenticated tests PASS (403/204 only)
- No 200/201 responses

---

## Related Documents

- `docs/CLOSED_BETA_TEST_CHECKLIST.md` - Tester checklist for closed beta
- `docs/PUBLIC_RELEASE_ROADMAP.md` - Phased release plan
- `docs/BETA_CLOSED_SCOPE.md` - Feature scope definition
- `docs/CI_TROUBLESHOOTING.md` - CI/CD status
- `docs/ENV_REQUIRED.md` - Environment variable requirements
