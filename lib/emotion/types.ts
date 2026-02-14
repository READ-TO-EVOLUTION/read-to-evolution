export type Emotion =
  | 'joy'
  | 'anger'
  | 'sadness'
  | 'fun'
  | 'shy'
  | 'fear'
  | 'surprise'
  | 'relief'
  | 'confused'

export type Intensity = 'weak' | 'strong'

export type EmotionState = {
  emotion: Emotion
  intensity: Intensity
}
