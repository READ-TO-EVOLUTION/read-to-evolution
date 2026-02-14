import { addDays } from 'date-fns'

/**
 * 復習エンジン：スケジュール計算ロジック
 * 仕様に基づいて次の復習日時を計算
 */

export type ReviewResult = 'correct' | 'wrong'

/**
 * Step3-6の成功時の次回復習日を計算
 */
export function calculateNextReviewDate(step: number, currentDate: Date = new Date()): Date {
  switch (step) {
    case 3:
      return addDays(currentDate, 4)
    case 4:
      return addDays(currentDate, 6)
    case 5:
      return addDays(currentDate, 10)
    case 6:
      return addDays(currentDate, 10)
    default:
      return addDays(currentDate, 1)
  }
}

/**
 * 失敗時の次回復習日（Step2に戻る）
 */
export function calculateFailureReviewDate(currentDate: Date = new Date()): Date {
  return addDays(currentDate, 1)
}

/**
 * 復習結果に基づいて次のStepを決定
 */
export function getNextStep(currentStep: number, result: ReviewResult): {
  nextStep: number
  nextReviewAt: Date
  shouldGraduate: boolean
} {
  if (result === 'wrong') {
    // 失敗時はStep2に戻る
    return {
      nextStep: 2,
      nextReviewAt: calculateFailureReviewDate(),
      shouldGraduate: false,
    }
  }

  // 成功時
  if (currentStep >= 3 && currentStep < 6) {
    const nextStep = currentStep + 1
    return {
      nextStep,
      nextReviewAt: calculateNextReviewDate(nextStep),
      shouldGraduate: false,
    }
  }

  if (currentStep === 6) {
    // Step6成功時は継続（同じStep6、+10日）
    return {
      nextStep: 6,
      nextReviewAt: calculateNextReviewDate(6),
      shouldGraduate: false,
    }
  }

  // Step1-2の場合はそのまま進行
  return {
    nextStep: currentStep + 1,
    nextReviewAt: calculateFailureReviewDate(),
    shouldGraduate: false,
  }
}

/**
 * Step6を連続成功したかチェック（卒業判定）
 * 仕様：Step6を連続成功 → MASTERED
 */
export function checkGraduation(
  currentStep: number,
  result: ReviewResult,
  consecutiveStep6Successes: number
): boolean {
  if (currentStep === 6 && result === 'correct') {
    // Step6成功が連続で2回以上なら卒業
    return consecutiveStep6Successes >= 1 // 今回を含めて2回目で卒業
  }
  return false
}

/**
 * 再確認（REFRESH）の次回復習日を計算
 * 卒業後 30日 → 90日 → 180日 → 以後180日周期
 */
export function calculateRefreshReviewDate(
  refreshCount: number,
  currentDate: Date = new Date()
): Date {
  if (refreshCount === 0) {
    return addDays(currentDate, 30)
  } else if (refreshCount === 1) {
    return addDays(currentDate, 90)
  } else if (refreshCount === 2) {
    return addDays(currentDate, 180)
  } else {
    // 3回目以降は180日周期
    return addDays(currentDate, 180)
  }
}
