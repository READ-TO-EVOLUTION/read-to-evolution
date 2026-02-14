import { prisma } from './prisma'

/**
 * 収益還元率（運営収益の10%）
 */
const REVENUE_SHARE_RATE = 0.1

export type RevenueShareGateSource = 'REVIEW_CREATED' | 'REVIEW_UPDATED' | 'PURCHASE_EVENT' | 'OUTBOUND_CLICK' | 'SNAPSHOT_CLICK'

type RevenueEligibility = {
  eligible: boolean
  reason:
    | 'ELIGIBLE'
    | 'FREE_AND_AFFILIATE_OFF'
    | 'USER_NOT_FOUND'
    | 'SHARE_AMOUNT_ZERO'
    | 'PURCHASE_NOT_DETECTED'
    | 'CLICK_RECORDED'
  plan?: string
  affiliateState?: string
}

export async function evaluateRevenueEligibility(userId: string): Promise<RevenueEligibility> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, affiliateState: true },
  })

  if (!user) {
    return { eligible: false, reason: 'USER_NOT_FOUND' }
  }

  const eligible = user.plan !== 'FREE' || user.affiliateState === 'ON'
  return {
    eligible,
    reason: eligible ? 'ELIGIBLE' : 'FREE_AND_AFFILIATE_OFF',
    plan: user.plan,
    affiliateState: user.affiliateState,
  }
}

export async function logRevenueShareGateDecision(params: {
  userId: string
  reviewId?: string | null
  snapshotId?: string | null
  source: RevenueShareGateSource
  eligible: boolean
  reason: RevenueEligibility['reason']
  metadata?: unknown
}): Promise<void> {
  await prisma.revenueShareGateLog.create({
    data: {
      userId: params.userId,
      reviewId: params.reviewId ?? null,
      snapshotId: params.snapshotId ?? null,
      source: params.source,
      eligible: params.eligible,
      reason: params.reason,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  })
}

/**
 * レビュー経由の購入があった場合、レビュアーに収益還元を記録
 * 有料会員のみ対象
 * 
 * @param userId レビュアーのユーザーID
 * @param reviewId レビューID（任意）
 * @param revenueAmount 運営収益額（円）
 * @param description 還元理由
 */
export async function createRevenueShare(
  userId: string,
  reviewId: string | null,
  revenueAmount: number,
  description?: string
): Promise<void> {
  const eligibility = await evaluateRevenueEligibility(userId)
  // 判定ログ（購入イベント起点）
  await logRevenueShareGateDecision({
    userId,
    reviewId,
    source: 'PURCHASE_EVENT',
    eligible: eligibility.eligible,
    reason: eligibility.reason,
    metadata: {
      revenueAmount,
      description: description || 'レビュー経由の購入による還元',
      plan: eligibility.plan,
      affiliateState: eligibility.affiliateState,
    },
  }).catch(() => {
    // ログ失敗は致命ではない
  })

  if (!eligibility.eligible) return

  // 還元額を計算（運営収益の10%）
  const shareAmount = Math.floor(revenueAmount * REVENUE_SHARE_RATE)

  if (shareAmount <= 0) {
    // 還元額が0以下の場合は記録しない（証跡だけ残す）
    await logRevenueShareGateDecision({
      userId,
      reviewId,
      source: 'PURCHASE_EVENT',
      eligible: true,
      reason: 'SHARE_AMOUNT_ZERO',
      metadata: { revenueAmount, shareAmount },
    }).catch(() => {})
    return
  }

  // 収益還元記録を作成
  await prisma.revenueShare.create({
    data: {
      userId,
      reviewId,
      amount: shareAmount,
      revenueAmount,
      status: 'pending',
      description: description || 'レビュー経由の購入による還元',
    },
  })
}

/**
 * 収益還元の支払い処理（運営側の機能）
 * 
 * @param revenueShareId 収益還元ID
 */
export async function payRevenueShare(revenueShareId: string): Promise<void> {
  await prisma.revenueShare.update({
    where: { id: revenueShareId },
    data: {
      status: 'paid',
      paidAt: new Date(),
    },
  })
}
