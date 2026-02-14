// app/lib/emotion/engine.ts
import type { AppEvent, EmotionState, TimedEmotion, EventSeverity } from "./types"
import { getEmotionStateFromEvent } from "./rules"

/**
 * どのイベントが「今の表示」を奪うべきか（優先度）
 * 数字が大きいほど優先。
 */
export function getEventPriority(event: AppEvent): number {
  const severity = event.context?.severity ?? "low"

  const sevBoost =
    severity === "critical" ? 30 :
    severity === "high" ? 20 :
    severity === "medium" ? 10 : 0

  let base = 0

  switch (event.type) {
    case "error":
      base = 100
      break
    case "important_notice":
      base = 90
      break
    case "payment_success":
      base = 85
      break

    case "praise":
    case "reaction_received":
    case "streak_updated":
      base = 70
      break

    case "mistake_fixed":
    case "recall_success":
    case "explain_understood":
    case "insight":
      base = 60
      break

    case "criticism_received":
    case "repeat_mistake":
    case "recall_fail":
    case "long_pause":
      base = 55
      break

    case "study_start":
    case "post_published":
    case "success_after_retry":
    case "first_post":
    case "purchase_considering":
    case "first_time_screen":
      base = 45
      break

    case "loading":
      base = 10
      break

    case "app_open":
    default:
      base = 5
      break
  }

  return base + sevBoost
}

/**
 * 同時イベントの勝者を選ぶ
 */
export function pickDominantEvent(events: AppEvent[]): AppEvent | null {
  if (events.length === 0) return null

  let best = events[0]
  let bestScore = getEventPriority(best)

  for (let i = 1; i < events.length; i++) {
    const score = getEventPriority(events[i])
    if (score > bestScore || (score === bestScore && i > 0)) {
      best = events[i]
      bestScore = score
    }
  }
  return best
}

/**
 * 感情表示の時間設計（ms）
 */
export type EmotionTimingConfig = {
  strongMs: number
  weakMs: number
  negativeStrongMs: number
  negativeWeakMs: number
  cooldownMs: number
}

export const DEFAULT_TIMING: EmotionTimingConfig = {
  strongMs: 1100,
  weakMs: 1400,
  negativeStrongMs: 800,
  negativeWeakMs: 1000,
  cooldownMs: 700,
}

function isNegative(emotion: EmotionState["emotion"]): boolean {
  return emotion === "fear" || emotion === "anger" || emotion === "sadness"
}

export function toTimedEmotion(
  state: EmotionState,
  nowMs: number,
  cfg: EmotionTimingConfig = DEFAULT_TIMING
): TimedEmotion {
  const negative = isNegative(state.emotion)
  const ms =
    state.intensity === "strong"
      ? (negative ? cfg.negativeStrongMs : cfg.strongMs)
      : (negative ? cfg.negativeWeakMs : cfg.weakMs)

  return { state, untilMs: nowMs + ms }
}

/**
 * strong→weak→relief_weak への自然減衰
 */
export function decayEmotion(current: EmotionState, nowMs: number, timed: TimedEmotion | null): EmotionState {
  if (!timed) return current
  if (nowMs <= timed.untilMs) return current

  if (current.intensity === "strong") {
    return { emotion: current.emotion, intensity: "weak" }
  }

  return { emotion: "relief", intensity: "weak" }
}

function isInCooldown(
  lastAppliedAtMs: number | null,
  nowMs: number,
  cfg: EmotionTimingConfig
): boolean {
  if (lastAppliedAtMs == null) return false
  return nowMs - lastAppliedAtMs < cfg.cooldownMs
}

/**
 * メイン：複数イベント→次の感情（優先度合成＋クールダウン＋減衰）
 */
export function computeNextEmotionFromEvents(args: {
  events: AppEvent[]
  current: EmotionState
  nowMs: number
  timed: TimedEmotion | null
  lastAppliedAtMs: number | null
  cfg?: EmotionTimingConfig
}): { nextState: EmotionState; nextTimed: TimedEmotion | null; appliedAtMs: number | null } {
  const cfg = args.cfg ?? DEFAULT_TIMING

  const decayed = decayEmotion(args.current, args.nowMs, args.timed)

  if (args.events.length === 0) {
    return { nextState: decayed, nextTimed: null, appliedAtMs: args.lastAppliedAtMs }
  }

  const dominant = pickDominantEvent(args.events)
  if (!dominant) return { nextState: decayed, nextTimed: null, appliedAtMs: args.lastAppliedAtMs }

  const severity: EventSeverity = dominant.context?.severity ?? "low"
  const bypassCooldown = dominant.type === "error" || severity === "critical"

  if (!bypassCooldown && isInCooldown(args.lastAppliedAtMs, args.nowMs, cfg)) {
    return { nextState: decayed, nextTimed: null, appliedAtMs: args.lastAppliedAtMs }
  }

  const newState = getEmotionStateFromEvent(dominant)

  let nextState: EmotionState = newState
  if (decayed.emotion === newState.emotion) {
    if (decayed.intensity === "weak" && newState.intensity === "strong") {
      nextState = newState
    } else {
      return { nextState: decayed, nextTimed: null, appliedAtMs: args.lastAppliedAtMs }
    }
  }

  const nextTimed = toTimedEmotion(nextState, args.nowMs, cfg)
  return { nextState, nextTimed, appliedAtMs: args.nowMs }
}
