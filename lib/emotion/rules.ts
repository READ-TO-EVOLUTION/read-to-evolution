import type { EmotionState } from './types'

export function normalizeEmotionForStudyCourse(
  state: EmotionState,
  opts: { isStudyCourse: boolean; severity?: 'low'|'medium'|'high'|'critical' }
): EmotionState {
  if (!opts.isStudyCourse) return state
  if (state.emotion !== 'fear') return state
  if (opts.severity === 'critical') return state
  return { emotion: 'confused', intensity: state.intensity }
}
