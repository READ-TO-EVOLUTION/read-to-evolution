# Development Environment Troubleshooting

This document covers common issues in development environments and their solutions.

## EINVAL readlink Error in OneDrive Folders

### Symptoms

Build or dev server startup fails with:

```
Error: EINVAL: invalid argument, readlink 'C:\Users\...\OneDrive\...\.next\...'
    at async Object.readlink (node:internal/fs/promises:976:10)
    at async C:\...\node_modules\next\dist\lib\recursive-delete.js:58:30
```

### Root Cause

OneDrive sync folder file attributes/link handling conflicts with Next.js `recursive-delete`. OneDrive handles filesystem-level symlinks/hardlinks specially, causing errors when Next.js build process deletes/recreates `.next` directory.

### Root Cause Fix (Recommended)

**Move project outside OneDrive**

Example:
```
C:\Users\wadak\OneDrive\Desktop\READ TO EVOLUTION\
↓
C:\dev\read-to-evolution\
```

**Steps**:
1. Move entire project folder to location outside OneDrive (e.g., `C:\dev\`)
2. Continue development at new path
3. If using Git, verify remote URL is unchanged

### Workaround (Short-term)

Delete `.next` directory before rebuild:

```powershell
# PowerShell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

Or use build test script:

```powershell
.\scripts\test-build-without-env.ps1
```

This script automatically deletes `.next` before building.

### Notes

- If continuing development under OneDrive, `.next` deletion may be needed before each build/startup
- This issue does not occur in production or CI/CD (OneDrive not used)
- Moving project outside OneDrive is the most reliable solution

## CI / Local Build Sequence

Standard execution order (CI/local common):

1. **Scan for top-level env access**:
   ```powershell
   .\scripts\scan-top-level-env.ps1
   ```
   - **Pass condition**: Exit code 0, "[RESULT] OK" message
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

## Related Files

- `scripts/test-build-without-env.ps1`: Build test script (auto-deletes `.next`)
- `scripts/scan-top-level-env.ps1`: Top-level env access scanner
