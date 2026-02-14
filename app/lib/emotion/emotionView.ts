// app/lib/emotion/emotionView.ts
import type { Emotion, EmotionState, Intensity } from "./types"

export type FaceKey =
  | "neutral"
  | "joy_weak" | "joy_strong"
  | "anger_weak" | "anger_strong"
  | "sadness_weak" | "sadness_strong"
  | "fun_weak" | "fun_strong"
  | "shy_weak" | "shy_strong"
  | "fear_weak" | "fear_strong"
  | "surprise_weak" | "surprise_strong"
  | "relief_weak" | "relief_strong"
  | "confused_weak" | "confused_strong"

export type PoseKey =
  | "base"
  | "joy_strong"
  | "anger_strong"
  | "sadness_strong"
  | "fun_strong"
  | "shy_strong"
  | "fear_strong"
  | "surprise_strong"
  | "relief_strong"
  | "confused_strong"

export function resolveFaceKey(state: EmotionState): FaceKey {
  return `${state.emotion}_${state.intensity}` as FaceKey
}

export function resolvePoseKey(state: EmotionState): PoseKey {
  if (state.intensity === "weak") return "base"
  return `${state.emotion}_strong` as PoseKey
}

export function shouldShowCheeks(emotion: Emotion): boolean {
  return emotion === "shy"
}

export function isStrong(intensity: Intensity): boolean {
  return intensity === "strong"
}
