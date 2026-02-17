/**
 * Client-side feature flags for Beta Closed phase
 * This file is for client components only (use 'use client')
 * 
 * Safety: If NEXT_PUBLIC_BETA_CLOSED is undefined, treat as true (fail-safe)
 */

/**
 * Check if Beta Closed is enabled (client-side)
 * Reads NEXT_PUBLIC_BETA_CLOSED environment variable
 * Safety: If undefined, defaults to true (fail-safe)
 */
export function isBetaClosedClient(): boolean {
  return process.env.NEXT_PUBLIC_BETA_CLOSED !== 'false'
}
