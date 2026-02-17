/**
 * Safety checks for production environment
 * These checks run at application startup
 */

/**
 * Check if live Stripe key is used when Beta Closed is enabled
 * This prevents accidental use of live keys during beta phase
 */
export function checkStripeKeySafety(): void {
  const isBetaClosed = process.env.BETA_CLOSED === 'true'
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (isBetaClosed && stripeKey && stripeKey.startsWith('sk_live_')) {
    throw new Error(
      'Live Stripe key not allowed in Beta Closed. ' +
      'Set BETA_CLOSED=false or use test key (sk_test_)'
    )
  }
}

/**
 * Run all safety checks at startup
 */
export function runSafetyChecks(): void {
  checkStripeKeySafety()
}
