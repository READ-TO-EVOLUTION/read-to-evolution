/**
 * CI Safety Check: Prevent live Stripe key in Beta Closed mode
 * 
 * This script runs before build to ensure:
 * - If BETA_CLOSED=true, STRIPE_SECRET_KEY must not start with sk_live_
 * 
 * Exit codes:
 * - 0: Safety check passed
 * - 1: Safety check failed (live key detected in beta closed mode)
 */

const isBetaClosed = process.env.BETA_CLOSED === 'true'
const stripeKey = process.env.STRIPE_SECRET_KEY

if (isBetaClosed && stripeKey && stripeKey.startsWith('sk_live_')) {
  console.error('')
  console.error('========================================')
  console.error('ERROR: Live Stripe key detected in Beta Closed mode')
  console.error('========================================')
  console.error('')
  console.error('BETA_CLOSED=true is set, but STRIPE_SECRET_KEY starts with sk_live_')
  console.error('')
  console.error('This is not allowed for safety reasons.')
  console.error('')
  console.error('Solutions:')
  console.error('  1. Set BETA_CLOSED=false (if you want to use live key)')
  console.error('  2. Use test key (sk_test_...) instead of live key')
  console.error('')
  console.error('========================================')
  console.error('')
  process.exit(1)
}

// Safety check passed
console.log('[CI Safety Check] Stripe key check passed')
process.exit(0)
