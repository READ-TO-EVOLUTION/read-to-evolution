# Closed Beta Test Checklist

**Created**: 2026-02-17  
**Purpose**: Checklist for 3-person closed beta testing phase

---

## 1. Information for Testers (3 people)

### 1.1 Production URL

Production URL: `https://YOUR_PRODUCTION_URL`  
(Replace with actual production URL)

### 1.2 Test Account Creation

**Step 1: Register**
1. Open production URL
2. Click "新規登録" (Register)
3. Enter email address and password
4. Complete registration

**Step 2: Login**
1. Click "ログイン" (Login)
2. Enter registered email and password
3. You will be redirected to home page

**Step 3: Verify Beta Closed Banner**
- Top page should display: "現在は限定公開中です" (Currently in limited release)

### 1.3 Features Available for Testing

**Safe to Use:**
- Book search (Rakuten/Amazon API)
- Book registration to shelf
- Book list view (`/books`)
- Review creation (rating, comment, tags)
- Review list view (`/reviews`)
- Review edit/delete
- Public review feed (`/r` - unauthenticated access)
- Reading log creation (Micro)
- Study course: Today's review list (`/study/today`)
- Study record tracking
- Character settings (`/settings/character`)

**Expected Behavior:**
- All core features work normally
- No crashes or fatal errors
- UI remains stable

### 1.4 Features Blocked (Beta Closed)

**DO NOT TEST (These are intentionally disabled):**

- **Affiliate System**
  - Affiliate opt-in (`/api/affiliate/opt-in`)
  - Affiliate cancel (`/api/affiliate/cancel`)
  - Affiliate book links (`/api/affiliate/book-links`)
  - Affiliate dashboard (`/affiliate/dashboard`) - redirects to home
  - Affiliate settings (`/settings/affiliate`) - redirects to home

- **Revenue Share**
  - Revenue shares list (`/api/revenue-shares`) - returns 403
  - Revenue shares page (`/revenue-shares`) - redirects to home

- **Gift Creation**
  - Gift creation (`/api/gifts` POST) - returns 403
  - Gift page (`/gifts`) - redirects to home

- **OCR Features**
  - OCR asset upload (`/api/ocr-assets` POST) - returns 403
  - OCR text management (`/api/ocr-texts` POST) - returns 403

- **Stripe Webhook**
  - Stripe webhook (`/api/stripe/webhook`) - returns 204 (disabled)

**Expected Behavior:**
- Blocked pages redirect to home (`/`)
- Blocked APIs return 403 Forbidden (or 204 for Stripe webhook)
- No payment processing occurs
- No external sharing is created

---

## 2. Required Screen Checks (10 minutes)

### 2.1 Top Page

**Check:**
- [ ] "現在は限定公開中です" banner is displayed at the top
- [ ] Banner has yellow background
- [ ] Home page loads without errors

### 2.2 Navigation Flow

**Check each page:**
- [ ] Login page (`/login`) - loads correctly
- [ ] Register page (`/register`) - loads correctly
- [ ] Books page (`/books`) - loads and displays book list
- [ ] Reviews page (`/reviews`) - loads and displays reviews
- [ ] Study today page (`/study/today`) - loads correctly
- [ ] Settings character page (`/settings/character`) - loads correctly

### 2.3 Error Handling

**Check:**
- [ ] Pages do not crash when navigating
- [ ] Error messages are displayed clearly (if any)
- [ ] UI remains stable after errors
- [ ] No white screen or fatal errors

### 2.4 Blocked Features (Verification)

**Check that blocked features are inaccessible:**
- [ ] `/affiliate/dashboard` redirects to home
- [ ] `/settings/affiliate` redirects to home
- [ ] `/gifts` redirects to home
- [ ] `/revenue-shares` redirects to home

---

## 3. Operations Team Checks (Logs)

### 3.1 API Block Logs

**Check Vercel logs (or server logs) for:**

```
[BETA_CLOSED_BLOCK] /api/affiliate/opt-in
[BETA_CLOSED_BLOCK] /api/affiliate/cancel
[BETA_CLOSED_BLOCK] /api/affiliate/book-links
[BETA_CLOSED_BLOCK] /api/revenue-shares
[BETA_CLOSED_BLOCK] /api/gifts
[BETA_CLOSED_BLOCK] /api/ocr-assets
[BETA_CLOSED_BLOCK] /api/ocr-texts
[BETA_CLOSED_BLOCK] /api/stripe/webhook - Returning 204 to prevent Stripe retries
```

**Expected:**
- `[BETA_CLOSED_BLOCK]` logs appear when blocked APIs are accessed
- Logs include the API path
- No unexpected errors in logs

### 3.2 Status Code Verification

**Check that:**
- [ ] No 200/201 responses from dangerous APIs
- [ ] All dangerous APIs return 403 (or 204 for Stripe webhook)
- [ ] No 500 errors (internal server errors)
- [ ] No unexpected 302 redirects from dangerous APIs

### 3.3 Automated Verification

**Run verification script against production:**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File scripts/test-beta-closed-dangerous-apis.ps1 `
  -BaseUrl https://YOUR_PRODUCTION_URL
```

**Expected Result:**
- All 8 tests PASS
- Exit code: 0

---

## 4. Pass Criteria

### 4.1 Tester Criteria

- [ ] Testers can use normal features without crashes
- [ ] No fatal errors or white screens
- [ ] UI remains stable during navigation
- [ ] Beta Closed banner is visible

### 4.2 Operations Criteria

- [ ] All dangerous APIs return 403 (or 204 for Stripe webhook)
- [ ] No unexpected 200/201/302 responses from dangerous APIs
- [ ] `[BETA_CLOSED_BLOCK]` logs appear in server logs
- [ ] Automated verification script shows 8/8 PASS

### 4.3 Overall Status

**PASS if:**
- All tester criteria met
- All operations criteria met
- No critical issues found

**FAIL if:**
- Any dangerous API returns 200/201
- Fatal crashes occur
- Critical security issues found

---

## 5. Reporting Issues

### 5.1 How to Report

If you encounter any issues:
1. Note the page/feature where issue occurred
2. Note the steps to reproduce
3. Take a screenshot (if possible)
4. Report to operations team

### 5.2 Common Issues

**Expected (Not Issues):**
- Blocked pages redirect to home (this is intentional)
- Blocked APIs return 403 (this is intentional)
- Beta Closed banner is displayed (this is intentional)

**Real Issues to Report:**
- White screen or fatal errors
- Pages that don't load
- Features that should work but don't
- Unexpected error messages

---

## Related Documents

- `docs/BETA_CLOSED_SCOPE.md` - Feature scope definition
- `docs/BETA_CLOSED_SECURITY_AUDIT.md` - Security audit and verification
- `docs/CI_TROUBLESHOOTING.md` - CI/CD status
