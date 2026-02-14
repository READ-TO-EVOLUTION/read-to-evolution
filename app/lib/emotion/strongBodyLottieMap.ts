// app/lib/emotion/strongBodyLottieMap.ts
import type { EmotionState } from "./types"

export type StrongBodyAnimKey =
  | "none"
  | "joy"
  | "anger"
  | "sadness"
  | "fun"
  | "shy"
  | "fear"
  | "surprise"
  | "relief"
  | "confused"

export function resolveStrongBodyAnimKey(state: EmotionState): StrongBodyAnimKey {
  if (state.intensity !== "strong") return "none"

  switch (state.emotion) {
    case "joy":
      return "joy"
    case "anger":
      return "anger"
    case "sadness":
      return "sadness"
    case "fun":
      return "fun"
    case "shy":
      return "shy"
    case "fear":
      return "fear"
    case "surprise":
      return "surprise"
    case "relief":
      return "relief"
    case "confused":
      return "confused"
    default:
      return "none"
  }
}

export function resolveStrongBodyLottiePath(key: StrongBodyAnimKey): string | null {
  if (key === "none") return null
  return `/lottie/kuroko/body_strong_${key}.json`
}
