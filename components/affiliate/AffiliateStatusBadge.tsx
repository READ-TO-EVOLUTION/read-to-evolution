'use client'

type AffiliateStatusBadgeProps = {
  affiliateState: string
  affiliatePlanType?: string
}

export default function AffiliateStatusBadge({
  affiliateState,
  affiliatePlanType,
}: AffiliateStatusBadgeProps) {
  if (affiliateState === 'ON') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Affiliate ON
        {affiliatePlanType === 'STUDY_SUB' && (
          <span className="ml-1 text-green-600">（勉強コース）</span>
        )}
      </span>
    )
  }

  if (affiliateState === 'SUSPENDED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Affiliate Suspended
      </span>
    )
  }

  // OFFの場合は何も表示しない（または薄い表示）
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      Affiliate OFF
    </span>
  )
}
