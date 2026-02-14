import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware'

/**
 * Book search runtime config (safe to expose)
 * - Returns which external providers are enabled based on server env vars.
 */
export async function GET() {
  const userId = await getCurrentUser()
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const rakutenEnabled = Boolean(process.env.RAKUTEN_APPLICATION_ID)
  const amazonEnabled = Boolean(
    process.env.AMAZON_PAAPI_ACCESS_KEY &&
      process.env.AMAZON_PAAPI_SECRET_KEY &&
      process.env.AMAZON_PAAPI_PARTNER_TAG
  )

  const enabledProviders = [
    ...(rakutenEnabled ? (['RAKUTEN'] as const) : []),
    ...(amazonEnabled ? (['AMAZON'] as const) : []),
  ]

  return NextResponse.json({
    enabledProviders,
    externalSearchEnabled: enabledProviders.length > 0,
    rakutenEnabled,
    amazonEnabled,
  })
}

