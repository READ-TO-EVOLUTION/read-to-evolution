# Beta Closed Scope - Limited Release Feature List

**Created**: 2026-02-17  
**Updated**: 2026-02-17  
**Purpose**: Define minimum feature set for limited public release

**Note**: Beta Closed phase includes UI blocking and API 403 blocking for dangerous features.  
When `BETA_CLOSED=true` (server) or `NEXT_PUBLIC_BETA_CLOSED=true` (client) is set, all dangerous features are automatically disabled.

---

## 1. Current Feature Inventory

### 1.1 Core Features (All Implemented)

#### Authentication
- User registration (`/register`)
- User login (`/login`)
- User logout (`/api/auth/logout`)
- Auth status check (`/api/auth/me`)

#### Book Management
- Book search (Rakuten/Amazon API)
- Book registration to shelf
- Book list view (`/books`)
- Book deletion

#### Review System
- Review creation (rating, comment, tags)
- Review list view (`/reviews`)
- Review edit/delete
- Public review feed (`/r` - unauthenticated access)

#### Reading Management
- ReadingLog (Micro) creation
- Meso creation (grouping ReadingLogs)
- Macro creation (book-level summary)
- PublishedSnapshot (public content)

#### Study Course
- Study item creation
- Review schedule management
- Today's review list (`/study/today`)
- Study record tracking

### 1.2 Advanced Features (Require Control)

#### Affiliate System
- Affiliate opt-in (`/api/affiliate/opt-in`)
- Stripe Checkout integration
- Affiliate dashboard (`/affiliate/dashboard`)
- Revenue share tracking
- Gift creation and sharing

#### OCR Features
- OCR asset upload (`/api/ocr-assets`)
- OCR text extraction
- Usage-based billing tracking

#### Gift System
- Gift creation (`/gifts`)
- Gift public page (`/gifts/[slug]`)
- Gift analytics (`/gifts/[slug]/analytics`)
- Gift event tracking

#### Revenue Share
- Revenue share calculation
- Revenue share display (`/revenue-shares`)
- Gate log tracking

### 1.3 Utility Features

#### Notifications
- Notification list (`/notifications`)
- Notification creation

#### Settings
- Affiliate settings (`/settings/affiliate`)
- Character settings (`/settings/character`)

#### Koyori (Memo System)
- Koyori item management (`/koyori`)

---

## 2. Beta Closed Scope (Allowed Features)

### 2.1 Public Access (No Auth Required)

- `/` - Home page (public reviews preview)
- `/r` - Public review feed
- `/s/[slug]` - Public snapshot page
- `/gifts/[slug]` - Public gift page (read-only)
- `/login` - Login page
- `/register` - Registration page

### 2.2 Authenticated User Features

#### Core Reading Experience
- `/books` - Book shelf management
- `/reviews` - Personal review management
- `/study/today` - Today's study tasks
- Book search and registration
- Review creation and editing
- ReadingLog/Meso/Macro creation
- PublishedSnapshot creation

#### Basic Settings
- `/settings/character` - Character customization

---

## 3. Dangerous Features (Not Ready for Public Release)

### 3.1 Payment & Billing (Incomplete Controls)

**Risk**: Uncontrolled billing, payment processing errors

- `/api/affiliate/opt-in` - Stripe Checkout (requires proper error handling)
- `/api/stripe/webhook` - Webhook processing (requires validation)
- OCR usage billing (tracking only, no actual billing)
- Study course tier billing (environment variables not fully configured)

**Action**: Disable or restrict access

### 3.2 Revenue Share (Incomplete Implementation)

**Risk**: Incorrect revenue calculation, data inconsistency

- `/api/revenue-shares` - Revenue share display
- Revenue share calculation logic
- Gate log tracking (logging only, no actual payout)

**Action**: Disable or comment out

### 3.3 Gift System (External Sharing)

**Risk**: Uncontrolled external link sharing, abuse potential

- `/gifts` - Gift creation
- `/gifts/[slug]/analytics` - Analytics (may expose user data)
- Gift event tracking

**Action**: Restrict to internal use or disable

### 3.4 OCR Features (Usage-Based Billing)

**Risk**: Uncontrolled usage, billing errors

- `/api/ocr-assets` - OCR upload
- `/api/ocr-texts` - OCR text management
- Usage tracking (no actual billing yet)

**Action**: Disable or add strict rate limiting

---

## 4. Features to Comment Out / Disable

### 4.1 Routes to Disable

#### Affiliate Routes
- `/affiliate/dashboard` - Comment out or redirect to maintenance
- `/settings/affiliate` - Comment out or redirect
- `/api/affiliate/*` - All affiliate APIs (except read-only status check)

#### Gift Routes
- `/gifts` - Comment out gift creation page
- `/gifts/[slug]/analytics` - Comment out analytics page
- `/api/gifts` (POST) - Disable gift creation API

#### Revenue Share Routes
- `/revenue-shares` - Comment out revenue share page
- `/api/revenue-shares` - Disable or restrict API

#### OCR Routes
- `/api/ocr-assets` (POST) - Disable or add strict rate limiting
- `/api/ocr-texts` (POST) - Disable or add strict rate limiting

### 4.2 API Endpoints to Restrict

```typescript
// Recommended: Add feature flags
const BETA_CLOSED_FEATURES = {
  AFFILIATE_ENABLED: false,
  GIFT_CREATION_ENABLED: false,
  OCR_ENABLED: false,
  REVENUE_SHARE_ENABLED: false,
};
```

---

## 5. Implementation Plan

### Phase 1: Core Features Only
1. Enable: Authentication, Book Management, Reviews, Reading Management
2. Disable: Affiliate, Gift Creation, OCR, Revenue Share
3. Test: Core user flow (register → add book → create review → study)

### Phase 2: Gradual Feature Enablement
1. Enable OCR with strict rate limiting
2. Enable Gift viewing (read-only)
3. Monitor usage and errors

### Phase 3: Full Feature Release
1. Enable Affiliate (after proper testing)
2. Enable Revenue Share (after calculation validation)
3. Enable Gift Creation (after abuse prevention)

---

## 6. Security Considerations

### 6.1 Rate Limiting
- Implement rate limiting for all public APIs
- Strict limits for OCR and external API calls
- IP-based rate limiting for gift creation

### 6.2 Data Exposure
- Ensure PII (email, personal data) is never exposed in public APIs
- Validate all external redirects (Amazon/Rakuten links)
- Sanitize user-generated content

### 6.3 Payment Security
- Never expose Stripe keys in client-side code
- Validate all webhook signatures
- Implement proper error handling for payment failures

---

## 7. Monitoring Checklist

- [ ] All core features working (auth, books, reviews)
- [ ] Public review feed accessible without auth
- [ ] No payment/billing errors in logs
- [ ] No PII exposure in public APIs
- [ ] Rate limiting active
- [ ] External redirects validated
- [ ] Error handling for disabled features

---

## Related Documents

- `docs/ROUTE_MAP_AND_FEATURES.md` - Complete feature inventory
- `docs/CI_TROUBLESHOOTING.md` - CI/CD status
- `docs/ENV_REQUIRED.md` - Environment variable requirements
