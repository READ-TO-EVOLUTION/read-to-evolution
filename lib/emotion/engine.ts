import type { EmotionState } from './types'

export function decayEmotion(state: EmotionState, nowMs: number, untilMs: number | null): EmotionState {
  if (untilMs == null) return state
  if (nowMs <= untilMs) return state

  if (state.intensity === 'strong') {
    return { emotion: state.emotion, intensity: 'weak' }
  }
  return { emotion: 'relief', intensity: 'weak' }
}
