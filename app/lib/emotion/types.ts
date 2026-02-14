// app/lib/emotion/types.ts

export type Emotion =
  | "joy"      // 喜
  | "anger"    // 怒
  | "sadness"  // 哀
  | "fun"      // 楽
  | "shy"      // 照れ（頬赤点OK）
  | "fear"     // 恐
  | "surprise" // 驚
  | "relief"   // 安心
  | "confused" // 迷い

export type Intensity = "weak" | "strong"

export type EmotionState = {
  emotion: Emotion
  intensity: Intensity
}

/**
 * イベント種別（必要になったら増やす）
 */
export type AppEventType =
  // --- general ---
  | "app_open"
  | "first_time_screen"
  | "loading"
  | "success_after_retry"
  | "insight"             // 気づき/発見
  | "praise"              // 褒め/バッジ等
  | "error"               // 汎用エラー

  // --- study ---
  | "study_start"
  | "recall_success"
  | "recall_fail"
  | "explain_understood"
  | "streak_updated"
  | "mistake_fixed"
  | "repeat_mistake"
  | "long_pause"

  // --- nonStudy ---
  | "first_post"
  | "post_published"
  | "reaction_received"
  | "criticism_received"
  | "purchase_considering"
  | "payment_success"
  | "important_notice"

export type EventSeverity = "low" | "medium" | "high" | "critical"

export type AppEvent = {
  type: AppEventType
  context?: {
    isStudyCourse?: boolean
    severity?: EventSeverity
  }
  meta?: {
    difficulty?: "easy" | "normal" | "hard"
    count?: number
    isFirstTime?: boolean
  }
}

/**
 * UIに出す「感情の一時表示」を管理するための内部表現
 * - state: いま出すEmotionState
 * - untilMs: この時刻（epoch ms）まではこの表示を維持
 */
export type TimedEmotion = {
  state: EmotionState
  untilMs: number
}
