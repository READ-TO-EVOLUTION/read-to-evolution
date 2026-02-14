/**
 * 勉強コース：冊数 × データ量制御
 * 仕様書: docs/INTEGRATED_SPEC.md
 */

import { prisma } from './prisma'

export type ImageType = 'PROBLEM' | 'EXPLANATION' | 'REFERENCE'

export const VOLUME_LIMITS = {
  // 通常ライン（警告なし）
  NORMAL: {
    PROBLEM: 300,
    EXPLANATION: 400,
    REFERENCE: 500,
    TOTAL: 1200,
  },
  // 拡張ライン（警告あり、絶対上限）
  MAX: {
    PROBLEM: 500,
    EXPLANATION: 500,
    REFERENCE: 500,
    TOTAL: 1500,
  },
} as const

/**
 * 1冊（bookId）あたりの画像枚数を取得
 */
export async function getVolumeImageCounts(
  userId: string,
  bookId: string
): Promise<{
  problem: number
  explanation: number
  reference: number
  total: number
}> {
  // OCRAssetのtagsフィールドから種別を判定
  // tagsはJSON文字列で { type: 'PROBLEM' | 'EXPLANATION' | 'REFERENCE' } の形式を想定
  const ocrAssets = await prisma.oCRAsset.findMany({
    where: {
      userId,
      bookId,
    },
    select: {
      tags: true,
    },
  })

  let problem = 0
  let explanation = 0
  let reference = 0

  for (const asset of ocrAssets) {
    if (!asset.tags) {
      // tagsが未設定の場合はREFERENCEとしてカウント（後方互換性）
      reference++
      continue
    }

    try {
      const tags = JSON.parse(asset.tags) as { type?: string }
      const type = tags.type as ImageType | undefined

      switch (type) {
        case 'PROBLEM':
          problem++
          break
        case 'EXPLANATION':
          explanation++
          break
        case 'REFERENCE':
        default:
          reference++
          break
      }
    } catch {
      // JSON解析失敗時はREFERENCEとしてカウント
      reference++
    }
  }

  return {
    problem,
    explanation,
    reference,
    total: problem + explanation + reference,
  }
}

/**
 * 画像追加が可能かチェック
 * @returns { allowed: boolean; reason?: string; warning?: boolean }
 */
export async function validateVolumeImageLimit(
  userId: string,
  bookId: string,
  imageType: ImageType
): Promise<{
  allowed: boolean
  reason?: string
  warning?: boolean
}> {
  const counts = await getVolumeImageCounts(userId, bookId)

  // 種別別の現在の枚数
  const currentCount =
    imageType === 'PROBLEM'
      ? counts.problem
      : imageType === 'EXPLANATION'
        ? counts.explanation
        : counts.reference

  // 種別別の上限
  const maxForType = VOLUME_LIMITS.MAX[imageType]
  const normalForType =
    imageType === 'PROBLEM'
      ? VOLUME_LIMITS.NORMAL.PROBLEM
      : imageType === 'EXPLANATION'
        ? VOLUME_LIMITS.NORMAL.EXPLANATION
        : VOLUME_LIMITS.NORMAL.REFERENCE

  // 合計枚数
  const totalAfterAdd = counts.total + 1

  // 種別別上限チェック
  if (currentCount >= maxForType) {
    return {
      allowed: false,
      reason: `${imageType === 'PROBLEM' ? '問題' : imageType === 'EXPLANATION' ? '解説' : '基本書'}画像は1冊あたり最大${maxForType}枚までです。別冊として登録してください。`,
    }
  }

  // 合計上限チェック（絶対上限）
  if (totalAfterAdd > VOLUME_LIMITS.MAX.TOTAL) {
    return {
      allowed: false,
      reason: `1冊あたりの画像枚数上限（${VOLUME_LIMITS.MAX.TOTAL}枚）に達しています。別冊として登録してください。`,
    }
  }

  // 警告ライン（1,200枚超）
  if (totalAfterAdd > VOLUME_LIMITS.NORMAL.TOTAL) {
    return {
      allowed: true,
      warning: true,
      reason: `1冊あたりの画像枚数が${VOLUME_LIMITS.NORMAL.TOTAL}枚を超えています。整理を推奨します。`,
    }
  }

  return {
    allowed: true,
  }
}

/**
 * 画像枚数の進捗情報を取得（UI表示用）
 */
export async function getVolumeImageProgress(
  userId: string,
  bookId: string
): Promise<{
  problem: { current: number; normal: number; max: number }
  explanation: { current: number; normal: number; max: number }
  reference: { current: number; normal: number; max: number }
  total: { current: number; normal: number; max: number }
  warning: boolean
}> {
  const counts = await getVolumeImageCounts(userId, bookId)

  return {
    problem: {
      current: counts.problem,
      normal: VOLUME_LIMITS.NORMAL.PROBLEM,
      max: VOLUME_LIMITS.MAX.PROBLEM,
    },
    explanation: {
      current: counts.explanation,
      normal: VOLUME_LIMITS.NORMAL.EXPLANATION,
      max: VOLUME_LIMITS.MAX.EXPLANATION,
    },
    reference: {
      current: counts.reference,
      normal: VOLUME_LIMITS.NORMAL.REFERENCE,
      max: VOLUME_LIMITS.MAX.REFERENCE,
    },
    total: {
      current: counts.total,
      normal: VOLUME_LIMITS.NORMAL.TOTAL,
      max: VOLUME_LIMITS.MAX.TOTAL,
    },
    warning: counts.total > VOLUME_LIMITS.NORMAL.TOTAL,
  }
}
