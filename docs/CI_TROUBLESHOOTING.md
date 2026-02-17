# CI Troubleshooting Guide

This document helps diagnose CI failures in `.github/workflows/ci.yml`.

**Target runner**: `windows-latest`  
**Shell**: Windows PowerShell 5.1 (`shell: powershell`)

## Overview

This guide covers common CI failures and their solutions. All steps must pass for CI to succeed.

## Expected CI Steps (All Must Pass)

1. **Checkout**
   - Uses `actions/checkout@v4` with `fetch-depth: 0`
   - Checks out repository code

2. **Verify repository context**
   - Checks `.git` directory exists
   - Verifies Git repository context with `git rev-parse --is-inside-work-tree`

3. **Setup Node.js 20**
   - Sets up Node.js 20.x
   - Enables npm cache

4. **Show Node/npm versions**
   - Displays `node -v` and `npm -v` for debugging

5. **Install deps**
   - Runs `npm ci`
   - Installs dependencies from `package-lock.json`

6. **Prisma generate**
   - Runs `npx prisma generate`
   - Generates Prisma Client

7. **Verify .env is not tracked**
   - Checks if `.env` file is tracked by Git
   - Fails if `.env` is tracked (security issue)

8. **Scan risky TOP-LEVEL env usage**
   - Runs `.\scripts\scan-top-level-env.ps1`
   - Must exit with code 0
   - Detects risky top-level environment variable access

9. **Remove .next before build**
   - Removes `.next` directory to avoid readlink issues

10. **Build without .env**
    - Runs `.\scripts\test-build-without-env.ps1`
    - Must exit with code 0
    - Verifies build succeeds without `.env` file

11. **Remove .next after build**
    - Removes `.next` directory after build

12. **Normal build**
    - Runs `npm run build`
    - Must exit with code 0
    - Standard build verification

## Failure Triage

### 1. Verify repository context fails

**Symptom**:
- Error: `.git directory not found. checkout may have failed.`
- Error: `fatal: not a git repository`

**Cause**:
- `actions/checkout@v4` failed silently
- Wrong working directory
- Git repository corruption

**Fix**:
- Check if `actions/checkout@v4` step completed successfully
- Verify `fetch-depth: 0` is set in checkout step
- Check GitHub Actions logs for checkout errors
- Verify working directory is correct

### 2. Install deps fails

**Symptom**:
- Error: `npm ci` fails
- Error: `package-lock.json` not found or outdated

**Cause**:
- `package-lock.json` is missing or outdated
- Node.js version mismatch
- npm cache issues

**Fix**:
- Ensure `package-lock.json` is committed to repository
- Run `npm install` locally and commit updated `package-lock.json`
- Verify Node.js version is 20.x (set in workflow)
- Clear npm cache if needed

### 3. Verify .env is not tracked fails

**Symptom**:
- Error: `.env is tracked by git. Remove it from tracking immediately.`

**Cause**:
- `.env` file was accidentally committed to Git
- `.gitignore` does not include `.env`

**Fix**:
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```
- Verify `.env` is in `.gitignore`
- Check Git history for `.env` commits
- Never commit `.env` files

### 4. Scan risky TOP-LEVEL env usage fails

**Symptom**:
- Error: `[RESULT] WARN: potential risky TOP-LEVEL code found.`
- Exit code: 1

**Cause**:
- Top-level `process.env.*` access with `throw new Error`
- Top-level `new Stripe()` call
- Top-level `export const stripe = ...`

**Fix**:
- Run `.\scripts\scan-top-level-env.ps1` locally to identify issues
- Move environment variable access into functions (lazy initialization)
- Check `lib/stripe.ts` and `lib/auth.ts` for top-level access
- Ensure all `process.env.*` reads are inside functions
- Use `getStripe()` and `getJwtSecret()` pattern (lazy initialization)
- Never use `new Stripe()` or `throw new Error()` at top level

### 5. Build without .env fails

**Symptom**:
- Error: `[FAIL] Build failed (without .env)`
- Exit code: 1
- Build errors related to missing environment variables

**Cause**:
- Top-level environment variable access (should have been caught by scan)
- Import-time environment variable checks
- `new Stripe()` or `new JWT()` at module level

**Fix**:
- Review build error logs for specific failures
- Check for top-level `process.env.*` access
- Ensure lazy initialization pattern is used
- Verify `lib/stripe.ts` and `lib/auth.ts` use lazy initialization
- Run `.\scripts\scan-top-level-env.ps1` locally to catch issues before CI
- Refactor any top-level env reads to lazy getters

### 6. Normal build fails

**Symptom**:
- Error: `npm run build` fails
- Build errors unrelated to environment variables

**Cause**:
- TypeScript compilation errors
- Next.js build errors
- Missing dependencies
- OneDrive EINVAL errors (if running locally, not in CI)

**Fix**:
- Check build error logs for specific failures
- Run `npm run build` locally to reproduce
- Verify all dependencies are installed
- Check for TypeScript errors
- Note: This is standard build failure, not related to env gating
- Ensure ".env-less build" passes (step 10) before investigating this

## Local Reproduction Commands (PowerShell)

Run these commands in order to reproduce CI steps locally:

```powershell
# 1. Verify repository context
git rev-parse --is-inside-work-tree

# 2. Install deps
npm ci

# 3. Prisma generate
npx prisma generate

# 4. Verify .env is not tracked
git ls-files --error-unmatch .env

# 5. Scan risky TOP-LEVEL env usage
.\scripts\scan-top-level-env.ps1

# 6. Build without .env
.\scripts\test-build-without-env.ps1

# 7. Normal build
npm run build
```

## Notes

- **Next.js "Dynamic server usage" warnings**: These are non-fatal unless configured otherwise. They appear in logs but do not cause build failures.

- **OneDrive EINVAL readlink errors**: 
  - **Workaround**: Remove `.next` directory before build (automated in scripts)
  - **Root fix**: Move project outside OneDrive sync folder (e.g., `C:\dev\read-to-evolution\`)
  - This issue does not occur in CI (OneDrive not used)

- **PowerShell 5.1 compatibility**: All scripts are ASCII only to prevent encoding issues. Never use emojis or non-ASCII characters in PowerShell scripts.

- **Prevention**: 
  - Always run `.\scripts\scan-top-level-env.ps1` before committing
  - Test `.\scripts\test-build-without-env.ps1` locally before pushing
  - Ensure `.env` is in `.gitignore` and never committed
  - Use lazy initialization for environment variables

## Last Known Green Run

- **Run URL**: https://github.com/wada0325/read-to-evolution/actions/runs/22083930474
- **Date**: 2026-02-14 (JST)
- **Commit**: 779d0ca
- **Status**: All steps passed (green)

## Related Files

- `.github/workflows/ci.yml`: CI workflow definition
- `scripts/scan-top-level-env.ps1`: Top-level env scanner
- `scripts/test-build-without-env.ps1`: Build test script
- `docs/ENV_REQUIRED.md`: Environment variable requirements
- `docs/DEV_TROUBLESHOOTING.md`: Development troubleshooting
