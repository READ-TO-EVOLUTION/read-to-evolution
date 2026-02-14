/**
 * 感情タグの定義
 * 棒人間UIのアニメーションに使用
 */
export const EMOTION_TAGS = [
  { value: 'happy', label: '嬉しい', color: 'yellow' },
  { value: 'excited', label: 'ワクワク', color: 'orange' },
  { value: 'peaceful', label: '穏やか', color: 'green' },
  { value: 'thoughtful', label: '考え深い', color: 'blue' },
  { value: 'inspired', label: 'インスパイアされた', color: 'purple' },
  { value: 'moved', label: '感動した', color: 'pink' },
  { value: 'curious', label: '興味深い', color: 'cyan' },
  { value: 'challenged', label: '挑戦的', color: 'red' },
] as const

export type EmotionTag = typeof EMOTION_TAGS[number]['value']

export function getEmotionTag(tag: string) {
  return EMOTION_TAGS.find((e) => e.value === tag) || EMOTION_TAGS[0]
}
