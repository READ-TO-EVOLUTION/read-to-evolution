/**
 * Feature flags for Beta Closed phase
 * When BETA_CLOSED=true (server) or NEXT_PUBLIC_BETA_CLOSED=true (client),
 * dangerous features are disabled
 * 
 * Safety: If BETA_CLOSED is undefined, treat as true (fail-safe)
 */

/**
 * Server-side: Check if Beta Closed is enabled
 * Use this in API routes and server components
 * Safety: If undefined, defaults to true (fail-safe)
 */
export function isBetaClosedServer(): boolean {
  return process.env.BETA_CLOSED !== 'false'
}

/**
 * Client-side: Check if Beta Closed is enabled
 * Use this in client components
 * Note: This reads NEXT_PUBLIC_BETA_CLOSED, not BETA_CLOSED
 * Safety: If undefined, defaults to true (fail-safe)
 */
export function isBetaClosedClient(): boolean {
  return process.env.NEXT_PUBLIC_BETA_CLOSED !== 'false'
}

/**
 * Server-side: Unified check (for backward compatibility)
 * Prefers BETA_CLOSED, falls back to NEXT_PUBLIC_BETA_CLOSED if available
 * Safety: If both undefined, defaults to true (fail-safe)
 */
export function isBetaClosed(): boolean {
  const serverFlag = process.env.BETA_CLOSED
  const clientFlag = process.env.NEXT_PUBLIC_BETA_CLOSED
  
  // If explicitly set to 'false', disable beta closed
  if (serverFlag === 'false' || clientFlag === 'false') {
    return false
  }
  
  // If explicitly set to 'true', enable beta closed
  if (serverFlag === 'true' || clientFlag === 'true') {
    return true
  }
  
  // If undefined, default to true (fail-safe)
  return true
}
