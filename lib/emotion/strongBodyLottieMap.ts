import type { EmotionState } from './types'

export type StrongBodyAnimKey =
  | 'none'
  | 'joy'
  | 'anger'
  | 'sadness'
  | 'fun'
  | 'shy'
  | 'fear'
  | 'surprise'
  | 'relief'
  | 'confused'

export function resolveStrongBodyAnimKey(state: EmotionState): StrongBodyAnimKey {
  if (state.intensity !== 'strong') return 'none'
  return state.emotion
}

export function resolveStrongBodyLottiePath(key: StrongBodyAnimKey): string | null {
  if (key === 'none') return null
  return `/lottie/kuroko/body_strong_${key}.json`
}
