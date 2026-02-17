# Public Release Roadmap

**Created**: 2026-02-17  
**Purpose**: Phased approach to public release with gradual feature enablement

---

## Basic Rules (Critical)

**Important Principles:**
- Do not enable dangerous features all at once
- Each phase includes "monitoring" and "testing" together
- Use environment variables or feature flags to control each phase (current design)
- Monitor logs and metrics at each stage

---

## Phase 1: Closed Beta (3 people / ~1 week)

**Status**: Current phase  
**Beta Closed**: ON (enabled)

**Purpose:**
- UI/UX validation
- Basic navigation flow verification
- Crash detection

**Completion Criteria:**
- [ ] 3 testers use daily without crashes
- [ ] Errors are mostly expected 403/204 responses
- [ ] No database bloat (minimal Prisma usage)
- [ ] No fatal errors in logs

**Features Available:**
- Book search and registration
- Review creation and viewing
- Reading log management
- Study course (today's reviews)

**Features Blocked:**
- All affiliate features
- Revenue share
- Gift creation
- OCR uploads
- Stripe webhook

---

## Phase 2: Closed Beta (10 people / ~1 week)

**Beta Closed**: ON (enabled)

**Purpose:**
- Load testing
- Concurrent access handling
- Log volume increase tolerance

**Additional Monitoring:**
- Response latency (user experience)
- Home statistics and list pages performance
- Database query performance
- Memory usage

**Completion Criteria:**
- [ ] 10 testers can use simultaneously
- [ ] Response times remain acceptable
- [ ] No performance degradation
- [ ] Log volume is manageable

**Features Available:**
- Same as Phase 1

**Features Blocked:**
- Same as Phase 1

---

## Phase 3: Limited Public (50-200 people / ~2 weeks)

**Beta Closed**: Partial disable (gradual enablement)

**Purpose:**
- Gradual feature enablement
- Real-world usage patterns
- Security validation

**Enablement Order (Safe → Dangerous):**

### 3.1 Read-Only Features (First)

**Enable:**
- Public review feed (`/r`)
- Public snapshots (`/s/[slug]`)
- Public review viewing (unauthenticated)

**Verification:**
- [ ] No PII exposure in public content
- [ ] External redirects are validated
- [ ] Rate limiting is active

### 3.2 Write Features (Second)

**Enable:**
- Review creation/editing (enhanced)
- Reading log creation (enhanced)
- Study course features (enhanced)

**Verification:**
- [ ] Input validation is working
- [ ] No SQL injection risks
- [ ] Content sanitization is active

### 3.3 External Integration (Third)

**Enable:**
- Gift creation (with rate limiting)
- OCR uploads (with strict limits)

**Verification:**
- [ ] Rate limiting prevents abuse
- [ ] File size limits are enforced
- [ ] Upload quotas are working

### 3.4 Payment Features (Last)

**Enable:**
- Affiliate opt-in
- Revenue share calculation
- Stripe webhook processing

**Verification:**
- [ ] Payment processing is secure
- [ ] Webhook signature verification works
- [ ] Audit logs are recorded

---

## Dangerous Feature Re-enablement Order

### Priority 1: Affiliate System

**Features to Re-enable:**
- `/api/affiliate/opt-in`
- `/api/affiliate/cancel`
- `/api/affiliate/book-links`

**Before Re-enabling:**
- [ ] Audit logging implemented (who/when opt-in)
- [ ] Rate limiting implemented (prevent abuse)
- [ ] Fraud detection basics in place
- [ ] Test in staging environment first

**Re-enablement Steps:**
1. Set `BETA_CLOSED=false` in staging
2. Test opt-in flow end-to-end
3. Verify webhook processing
4. Monitor for 24 hours
5. If stable, enable in production

**Revenue Share:**
- Enable last (after affiliate system is stable)
- Requires additional validation
- Monitor calculation accuracy

### Priority 2: OCR Features (Highest Cost/Risk)

**Features to Re-enable:**
- `/api/ocr-assets` (POST)
- `/api/ocr-texts` (POST)

**Before Re-enabling:**
- [ ] Image upload limits (count/day)
- [ ] File size limits (per image)
- [ ] Rate limiting (requests/minute)
- [ ] Retry policy for failures
- [ ] Cost monitoring in place

**Re-enablement Steps:**
1. Set strict limits (e.g., 10 images/day per user)
2. Enable in staging with monitoring
3. Monitor costs and usage patterns
4. Gradually increase limits if stable
5. Enable in production with conservative limits

### Priority 3: Stripe Webhook (Payment Processing)

**Features to Re-enable:**
- `/api/stripe/webhook` (change from 204 to normal processing)

**Before Re-enabling:**
- [ ] Webhook signature verification tested
- [ ] Idempotency handling verified
- [ ] Error handling verified
- [ ] Test with Stripe test mode
- [ ] Monitor webhook delivery

**Re-enablement Steps:**
1. Test webhook in Stripe test mode
2. Verify signature verification works
3. Test in staging with real webhook events
4. Monitor for 48 hours
5. Enable in production

---

## Monitoring Requirements

### Log Monitoring

**Required Logs:**
- `[BETA_CLOSED_BLOCK]` - Blocked API access
- Payment processing events
- OCR upload events
- Affiliate state changes

**Metrics to Track:**
- API response times
- Error rates
- Block count (dangerous API attempts)
- Cost per user (OCR/uploads)

### Alert Thresholds

**Set Alerts For:**
- Unexpected 200/201 from dangerous APIs
- High error rates (>5%)
- Unusual cost spikes
- Webhook delivery failures

---

## Rollback Plan

**If Issues Detected:**

1. **Immediate Rollback:**
   - Set `BETA_CLOSED=true` in production
   - All dangerous features disabled immediately

2. **Investigation:**
   - Review logs for root cause
   - Check for security issues
   - Verify database integrity

3. **Fix and Re-test:**
   - Fix issues in staging
   - Re-run verification scripts
   - Re-enable gradually

---

## Success Criteria

**Phase 1 Complete When:**
- 3 testers use daily for 1 week
- No crashes or fatal errors
- All verification tests pass

**Phase 2 Complete When:**
- 10 testers use simultaneously
- Performance remains acceptable
- No scalability issues

**Phase 3 Complete When:**
- 50-200 users using system
- All features enabled and stable
- Security validated
- Cost monitoring in place

---

## Related Documents

- `docs/CLOSED_BETA_TEST_CHECKLIST.md` - Tester checklist
- `docs/BETA_CLOSED_SCOPE.md` - Feature scope
- `docs/BETA_CLOSED_SECURITY_AUDIT.md` - Security verification
