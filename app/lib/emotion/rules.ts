// app/lib/emotion/rules.ts
import type { AppEvent, EmotionState, Intensity } from "./types"

const DEFAULT_STATE: EmotionState = { emotion: "relief", intensity: "weak" }

/**
 * 勉強コースでは恐(fear)を原則使わない補正
 * - criticalのみfearを許可
 */
function normalizeForStudyCourse(state: EmotionState, event: AppEvent): EmotionState {
  const isStudy = event.context?.isStudyCourse === true
  if (!isStudy) return state

  if (state.emotion !== "fear") return state

  const severity = event.context?.severity ?? "low"
  if (severity === "critical") return state

  // 学習で脅さない：fearはconfusedへ丸める
  return { emotion: "confused", intensity: state.intensity }
}

/**
 * 単発イベント -> EmotionState（仕様のSingle Source of Truth）
 */
export function getEmotionStateFromEvent(event: AppEvent): EmotionState {
  const severity = event.context?.severity ?? "low"
  const strongBySeverity: Intensity =
    severity === "high" || severity === "critical" ? "strong" : "weak"

  let state: EmotionState = DEFAULT_STATE

  switch (event.type) {
    // ===== general =====
    case "app_open":
      state = { emotion: "relief", intensity: "weak" }
      break

    case "first_time_screen":
      state = { emotion: "confused", intensity: "weak" }
      if (severity === "high" || severity === "critical") {
        state = { emotion: "fear", intensity: "weak" }
      }
      break

    case "loading":
      state = { emotion: "relief", intensity: "weak" }
      break

    case "error":
      state = { emotion: "fear", intensity: strongBySeverity }
      break

    case "success_after_retry":
      state = severity === "low"
        ? { emotion: "relief", intensity: "weak" }
        : { emotion: "joy", intensity: "weak" }
      break

    case "insight":
      state = { emotion: "surprise", intensity: strongBySeverity }
      break

    case "praise":
      state = { emotion: "shy", intensity: event.meta?.isFirstTime ? "strong" : "weak" }
      if ((event.meta?.count ?? 0) >= 10) state = { emotion: "shy", intensity: "strong" }
      break

    // ===== study =====
    case "study_start":
      state = { emotion: "relief", intensity: "weak" }
      break

    case "recall_success":
      state = { emotion: "joy", intensity: event.meta?.difficulty === "hard" ? "strong" : "weak" }
      break

    case "recall_fail":
      state = { emotion: "confused", intensity: "weak" }
      break

    case "explain_understood":
      state = { emotion: "relief", intensity: "strong" }
      break

    case "streak_updated":
      state = { emotion: "shy", intensity: "strong" }
      break

    case "mistake_fixed":
      state = { emotion: "joy", intensity: "strong" }
      break

    case "repeat_mistake":
      state = { emotion: "sadness", intensity: "weak" }
      if (severity === "high") state = { emotion: "anger", intensity: "weak" }
      break

    case "long_pause":
      state = { emotion: "confused", intensity: "weak" }
      break

    // ===== nonStudy =====
    case "first_post":
      state = { emotion: "confused", intensity: "weak" }
      if (severity === "high") state = { emotion: "fear", intensity: "weak" }
      break

    case "post_published":
      state = { emotion: "relief", intensity: "weak" }
      break

    case "reaction_received":
      state = { emotion: "shy", intensity: "weak" }
      if (event.meta?.isFirstTime) state = { emotion: "shy", intensity: "strong" }
      if ((event.meta?.count ?? 0) >= 20) state = { emotion: "shy", intensity: "strong" }
      break

    case "criticism_received":
      state = { emotion: "sadness", intensity: "weak" }
      if (severity === "high") state = { emotion: "anger", intensity: "weak" }
      break

    case "purchase_considering":
      state = { emotion: "confused", intensity: "weak" }
      if (severity === "high") state = { emotion: "fear", intensity: "weak" }
      break

    case "payment_success":
      state = { emotion: "relief", intensity: "strong" }
      break

    case "important_notice":
      state = { emotion: "fear", intensity: "weak" }
      break

    default:
      state = DEFAULT_STATE
  }

  return normalizeForStudyCourse(state, event)
}
