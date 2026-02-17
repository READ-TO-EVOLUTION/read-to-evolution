# Monetization Pre-Launch Safety Design

**Created**: 2026-02-17  
**Purpose**: Final safety design before enabling revenue features

---

## 1. Stripe Test/Live Separation Checklist

### 1.1 Test Mode Requirements

**Allowed:**
- `STRIPE_SECRET_KEY` must start with `sk_test_`
- `STRIPE_WEBHOOK_SECRET` must be test mode secret
- All checkout sessions use test mode
- Test mode webhook endpoints only

**Prohibition:**
- `sk_live_` keys are absolutely prohibited
- Live mode webhook secrets are prohibited
- Production checkout sessions in test mode are prohibited

**Verification:**
- [ ] Check environment variables: `STRIPE_SECRET_KEY` starts with `sk_test_`
- [ ] Verify webhook secret is test mode
- [ ] Confirm checkout session creation uses test mode
- [ ] Test webhook processing in test mode

**Before Production:**
- [ ] Switch to live mode keys only after full testing
- [ ] Update webhook secrets to live mode
- [ ] Verify live mode checkout sessions work
- [ ] Test live mode webhook processing

---

## 2. Triple Guard Design

### 2.1 UI Guard

**Implementation:**
- Feature flags in client components
- Redirect blocked pages to home
- Hide payment buttons when disabled
- Display maintenance messages

**Check:**
- [ ] `/affiliate/dashboard` redirects when `BETA_CLOSED=true`
- [ ] `/settings/affiliate` redirects when `BETA_CLOSED=true`
- [ ] Payment buttons are hidden when disabled
- [ ] Beta Closed banner is displayed

**Code Location:**
- `app/affiliate/dashboard/page.tsx`
- `app/settings/affiliate/page.tsx`
- `app/gifts/page.tsx`
- `app/revenue-shares/page.tsx`

### 2.2 API Guard

**Implementation:**
- Feature flag check at API route entry
- Early return with 403 Forbidden
- Unified error response format
- Logging of blocked attempts

**Check:**
- [ ] All dangerous APIs check `isBetaClosed()` first
- [ ] Return 403 with `code: "BETA_CLOSED_DISABLED"`
- [ ] Log `[BETA_CLOSED_BLOCK]` for all blocked requests
- [ ] No business logic executes when blocked

**Code Location:**
- `app/api/affiliate/opt-in/route.ts`
- `app/api/affiliate/cancel/route.ts`
- `app/api/affiliate/book-links/route.ts`
- `app/api/revenue-shares/route.ts`
- `app/api/gifts/route.ts`
- `app/api/ocr-assets/route.ts`
- `app/api/ocr-texts/route.ts`
- `app/api/stripe/webhook/route.ts`

### 2.3 Webhook Signature Verification

**Implementation:**
- Verify Stripe webhook signature
- Reject unsigned requests
- Validate event types
- Idempotency handling

**Check:**
- [ ] Webhook signature verification is implemented
- [ ] Invalid signatures return 400
- [ ] Only expected event types are processed
- [ ] Idempotency keys prevent duplicate processing

**Code Location:**
- `app/api/stripe/webhook/route.ts`
- `lib/stripe.ts` (signature verification)

---

## 3. Limit Design

### 3.1 Daily Payment Limit

**Design:**
- Maximum daily payment amount per user
- Track in database or cache
- Reset at midnight (JST)
- Alert on limit reached

**Implementation:**
- [ ] Add daily payment tracking
- [ ] Set limit (e.g., 10,000 JPY per day)
- [ ] Check limit before checkout creation
- [ ] Return error if limit exceeded

**Monitoring:**
- [ ] Log daily payment totals
- [ ] Alert on unusual patterns
- [ ] Track limit hits

### 3.2 Monthly Limit

**Design:**
- Maximum monthly payment amount per user
- Track across billing cycles
- Reset on first of month
- Higher than daily limit

**Implementation:**
- [ ] Add monthly payment tracking
- [ ] Set limit (e.g., 50,000 JPY per month)
- [ ] Check limit before checkout creation
- [ ] Return error if limit exceeded

**Monitoring:**
- [ ] Log monthly payment totals
- [ ] Alert on approaching limits
- [ ] Track monthly limit hits

### 3.3 OCR Upload Limit

**Design:**
- Maximum OCR uploads per day
- Maximum file size per upload
- Maximum total storage per user
- Cost monitoring

**Implementation:**
- [ ] Add daily upload count tracking
- [ ] Set limit (e.g., 10 images per day)
- [ ] Check file size (e.g., 5MB per image)
- [ ] Check total storage (e.g., 100MB per user)
- [ ] Return error if limit exceeded

**Monitoring:**
- [ ] Log OCR upload counts
- [ ] Track storage usage
- [ ] Monitor costs per user

---

## 4. Required Monitoring Logs

### 4.1 Payment Success Rate

**Metrics:**
- Successful checkout sessions
- Completed payments
- Success rate percentage

**Logging:**
- [ ] Log successful checkout creation
- [ ] Log completed payment events
- [ ] Calculate success rate daily
- [ ] Alert if success rate < 80%

**Location:**
- Stripe webhook: `checkout.session.completed`
- Database: Payment records

### 4.2 Failure Rate

**Metrics:**
- Failed checkout attempts
- Payment failures
- Failure rate percentage

**Logging:**
- [ ] Log failed checkout creation
- [ ] Log payment failure events
- [ ] Calculate failure rate daily
- [ ] Alert if failure rate > 20%

**Location:**
- Stripe webhook: `payment_intent.payment_failed`
- API error logs

### 4.3 Webhook Failure Monitoring

**Metrics:**
- Webhook delivery failures
- Signature verification failures
- Processing errors

**Logging:**
- [ ] Log webhook delivery failures
- [ ] Log signature verification failures
- [ ] Log processing errors
- [ ] Alert on consecutive failures

**Location:**
- `app/api/stripe/webhook/route.ts`
- Stripe dashboard webhook logs

### 4.4 Status Code Monitoring

**Metrics:**
- 403 Forbidden (blocked requests)
- 500 Internal Server Error
- 200/201 (unexpected success)

**Logging:**
- [ ] Log all 403 responses with `[BETA_CLOSED_BLOCK]`
- [ ] Log all 500 errors with stack traces
- [ ] Alert on unexpected 200/201 from dangerous APIs
- [ ] Track status code distribution

**Location:**
- Server logs (Vercel/etc)
- Application error logs

---

## 5. Gradual Enablement Order

### 5.1 Display Only (Phase 1)

**Enable:**
- Show affiliate dashboard UI
- Display revenue share pages
- Show payment buttons

**Keep Disabled:**
- Actual payment processing
- Webhook processing
- Database updates

**Verification:**
- [ ] UI displays correctly
- [ ] No payment processing occurs
- [ ] No database writes

### 5.2 Dashboard Access (Phase 2)

**Enable:**
- Affiliate dashboard access
- Revenue share viewing
- Statistics display

**Keep Disabled:**
- Payment processing
- Opt-in functionality
- Webhook processing

**Verification:**
- [ ] Dashboard loads correctly
- [ ] Statistics display correctly
- [ ] No payment buttons functional

### 5.3 Single User Payment (Phase 3)

**Enable:**
- Payment for 1 designated test user
- Full payment flow
- Webhook processing for test user only

**Keep Disabled:**
- Payment for other users
- Public opt-in

**Verification:**
- [ ] Test user can complete payment
- [ ] Webhook processes correctly
- [ ] Other users still blocked
- [ ] Database updates correctly

### 5.4 10 User Limit (Phase 4)

**Enable:**
- Payment for up to 10 designated users
- Full payment flow
- Webhook processing

**Keep Disabled:**
- Public opt-in
- Unlimited payments

**Verification:**
- [ ] 10 users can complete payment
- [ ] 11th user is blocked
- [ ] Webhook processes correctly
- [ ] Limits are enforced

### 5.5 Full Enablement (Phase 5)

**Enable:**
- Public opt-in
- Unlimited payments (within daily/monthly limits)
- Full webhook processing

**Verification:**
- [ ] All users can opt-in
- [ ] Payment limits are enforced
- [ ] Webhook processes all events
- [ ] Monitoring is active

---

## 6. Terms of Service and Tax Compliance

### 6.1 Terms of Service

**Required:**
- [ ] Terms of Service document created
- [ ] User agreement on registration
- [ ] Payment terms clearly stated
- [ ] Refund policy defined
- [ ] Privacy policy updated

**Check:**
- [ ] Terms cover payment processing
- [ ] Terms cover affiliate program
- [ ] Terms cover data usage
- [ ] Terms are legally reviewed

### 6.2 Tax Compliance

**Required:**
- [ ] Tax calculation logic implemented
- [ ] Invoice generation capability
- [ ] Tax reporting structure
- [ ] Compliance with local tax laws

**Check:**
- [ ] Japan consumption tax (10%) handled
- [ ] Invoice data structure defined
- [ ] Tax reporting format determined
- [ ] Legal consultation completed

### 6.3 Payment Provider Compliance

**Required:**
- [ ] Stripe terms of service compliance
- [ ] PCI DSS compliance (via Stripe)
- [ ] Data protection compliance
- [ ] Fraud prevention measures

**Check:**
- [ ] Stripe account is verified
- [ ] Webhook security is implemented
- [ ] Customer data is protected
- [ ] Fraud detection is active

---

## 7. Pre-Launch Final Checklist

### 7.1 Environment Variables

- [ ] `BETA_CLOSED=false` (or feature flag disabled)
- [ ] `STRIPE_SECRET_KEY` is live mode key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` is live mode secret
- [ ] All required environment variables are set

### 7.2 Code Verification

- [ ] All UI guards are removed or disabled
- [ ] All API guards are removed or disabled
- [ ] Webhook signature verification is active
- [ ] Payment limits are implemented
- [ ] Error handling is comprehensive

### 7.3 Testing

- [ ] Test payment flow end-to-end
- [ ] Test webhook processing
- [ ] Test payment limits
- [ ] Test error scenarios
- [ ] Verify monitoring logs

### 7.4 Monitoring Setup

- [ ] Payment success rate monitoring active
- [ ] Failure rate monitoring active
- [ ] Webhook failure monitoring active
- [ ] Status code monitoring active
- [ ] Alert thresholds configured

### 7.5 Documentation

- [ ] Terms of Service published
- [ ] Privacy policy updated
- [ ] Payment terms documented
- [ ] Refund policy documented
- [ ] Tax compliance verified

### 7.6 Legal Compliance

- [ ] Tax calculation verified
- [ ] Invoice generation tested
- [ ] Legal review completed
- [ ] Compliance with local laws verified

### 7.7 Security

- [ ] Webhook signature verification tested
- [ ] Payment data encryption verified
- [ ] Fraud prevention active
- [ ] Rate limiting implemented

### 7.8 Gradual Rollout Plan

- [ ] Phase 1 (display only) tested
- [ ] Phase 2 (dashboard) tested
- [ ] Phase 3 (1 user) tested
- [ ] Phase 4 (10 users) tested
- [ ] Phase 5 (full) rollout plan ready

### 7.9 Rollback Plan

- [ ] Rollback procedure documented
- [ ] Environment variable rollback tested
- [ ] Feature flag rollback tested
- [ ] Database rollback tested (if needed)

### 7.10 Team Readiness

- [ ] Operations team trained on monitoring
- [ ] Support team ready for user inquiries
- [ ] Development team ready for hotfixes
- [ ] Escalation procedure defined

---

## Summary

**Critical Requirements:**
1. Stripe test/live separation must be verified
2. Triple guard (UI/API/Webhook) must be active
3. Payment and OCR limits must be implemented
4. Comprehensive monitoring must be active
5. Gradual enablement must be followed
6. Legal compliance must be verified

**Pre-Launch Checklist:**
- All 10 checklist items must be completed
- No exceptions for critical items
- Test thoroughly before production
- Monitor closely after launch

---

## Related Documents

- `docs/CLOSED_BETA_GUARDRAILS.md` - Beta phase restrictions
- `docs/PUBLIC_RELEASE_ROADMAP.md` - Release phases
- `docs/BETA_CLOSED_SECURITY_AUDIT.md` - Security verification
