/**
 * 料金プラン設定（勉強コース）
 * 仕様書: docs/INTEGRATED_SPEC.md
 */
export const PLAN_CONFIG = {
  free: { maxMaterials: 0, name: '無料プラン' },
  plan_3: { maxMaterials: 3, name: '3冊プラン', price: 450 },
  plan_5: { maxMaterials: 5, name: '5冊プラン', price: 700 },
  plan_10: { maxMaterials: 10, name: '10冊プラン', price: 1400 },
  plan_20: { maxMaterials: 20, name: '20冊プラン', price: 2600 },
} as const

export type PlanType = keyof typeof PLAN_CONFIG

export function getMaxMaterials(planType: string): number {
  return PLAN_CONFIG[planType as PlanType]?.maxMaterials ?? 0
}

export function canAddMaterial(planType: string, currentMaterialCount: number): boolean {
  const max = getMaxMaterials(planType)
  if (max === 0) return false // 無料プランは勉強コース利用不可
  return currentMaterialCount < max
}
