import type { EmotionState } from './types'

export type FaceKey =
  | 'neutral'
  | 'joy_weak' | 'joy_strong'
  | 'anger_weak' | 'anger_strong'
  | 'sadness_weak' | 'sadness_strong'
  | 'fun_weak' | 'fun_strong'
  | 'shy_weak' | 'shy_strong'
  | 'fear_weak' | 'fear_strong'
  | 'surprise_weak' | 'surprise_strong'
  | 'relief_weak' | 'relief_strong'
  | 'confused_weak' | 'confused_strong'

export function resolveFaceKey(state: EmotionState): FaceKey {
  return `${state.emotion}_${state.intensity}` as FaceKey
}
