import { prisma } from './prisma'

export type User = {
  affiliateState: string
  affiliatePlanType: string
}

/**
 * アフィリエイトがONかどうかを判定
 */
export function isAffiliateOn(user: User): boolean {
  return user.affiliateState === 'ON'
}

/**
 * STUDYサブスクライバーかどうかを判定
 */
export function isStudySubscriber(user: User): boolean {
  return user.affiliatePlanType === 'STUDY_SUB'
}

/**
 * AFFILIATEサブスクライバーかどうかを判定
 */
export function isAffiliateSubscriber(user: User): boolean {
  return user.affiliatePlanType === 'AFFILIATE_SUB'
}

/**
 * 報酬ONのために課金が必要かどうかを判定
 * STUDY_SUBは自動でアフィリエイトON扱い（課金モーダルを出さない）
 */
export function requiresAffiliatePaywall(user: User): boolean {
  return user.affiliateState !== 'ON' && user.affiliatePlanType !== 'STUDY_SUB'
}

/**
 * ユーザーIDからユーザー情報を取得（アフィリエイト判定用）
 */
export async function getUserForAffiliate(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      affiliateState: true,
      affiliatePlanType: true,
      affiliateEnabledAt: true,
      affiliateSuspendedAt: true,
      affiliateSuspendedReason: true,
    },
  })
  return user
}

/**
 * AffiliateStateLogを記録
 * 引数をオブジェクト形式にして順序バグを防止
 */
export async function logAffiliateStateChange(params: {
  userId: string
  fromState: 'OFF' | 'ON' | 'SUSPENDED'
  toState: 'OFF' | 'ON' | 'SUSPENDED'
  reason:
    | 'USER_OPT_IN'
    | 'PAYMENT_FAILED'
    | 'ADMIN_SUSPEND'
    | 'USER_CANCEL'
    | 'STUDY_SUBSCRIBED'
    | 'CHECKOUT_COMPLETED'
    | 'SUB_DELETED'
  actorType: 'USER' | 'SYSTEM' | 'ADMIN' | 'STRIPE'
  metadata?: Record<string, string> // 追加のmetadata（sourceなど分析用）
}) {
  return prisma.affiliateStateLog.create({
    data: {
      userId: params.userId,
      fromState: params.fromState,
      toState: params.toState,
      reason: params.reason,
      actorType: params.actorType,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  })
}
