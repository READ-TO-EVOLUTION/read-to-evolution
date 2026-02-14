'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { EmotionState } from '@/lib/emotion'
import { resolveFaceKey } from '@/lib/emotion/emotionView'
import { resolveStrongBodyAnimKey, resolveStrongBodyLottiePath } from '@/lib/emotion/strongBodyLottieMap'

import Lottie, { LottieRefCurrentProps } from 'lottie-react'

type Props = {
  state: EmotionState
  size?: number
  className?: string
  animationEnabled?: boolean
  forceSvgOnly?: boolean
}

const STORAGE_KEY = 'kurokoAnimationEnabled'

const COLORS = {
  body: '#000000',
  face: '#FFFFFF',
  cheek: '#E53935', // 照れのみ
}

function readAnimationEnabledFromStorage(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v == null) return true
    return v === 'true'
  } catch {
    return true
  }
}

export default function KurokoLottieCharacter({
  state,
  size = 220,
  className,
  animationEnabled,
  forceSvgOnly,
}: Props) {
  const faceKey = resolveFaceKey(state)

  const [enabledByStorage, setEnabledByStorage] = useState<boolean>(true)

  useEffect(() => {
    setEnabledByStorage(readAnimationEnabledFromStorage())

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setEnabledByStorage(readAnimationEnabledFromStorage())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const isAnimationEnabled = animationEnabled ?? enabledByStorage

  const animKey = resolveStrongBodyAnimKey(state)
  const lottiePath = resolveStrongBodyLottiePath(animKey)

  const lottieRef = useRef<LottieRefCurrentProps>(null)
  const [lottieData, setLottieData] = useState<any | null>(null)
  const [lottieFailed, setLottieFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (forceSvgOnly || !isAnimationEnabled || !lottiePath) {
      setLottieData(null)
      setLottieFailed(false)
      return
    }

    ;(async () => {
      try {
        const res = await fetch(lottiePath)
        if (!res.ok) throw new Error(`Failed to fetch lottie: ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          setLottieData(json)
          setLottieFailed(false)
        }
      } catch {
        if (!cancelled) {
          setLottieData(null)
          setLottieFailed(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [lottiePath, forceSvgOnly, isAnimationEnabled])

  useEffect(() => {
    if (!lottieRef.current) return
    if (!lottieData) return
    lottieRef.current.goToAndPlay(0, true)
  }, [lottieData, animKey])

  const face = useMemo(() => getFaceParts(faceKey), [faceKey])

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      {/* Body */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {forceSvgOnly || !isAnimationEnabled || !lottieData || lottieFailed ? (
          <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="70" r="38" fill={COLORS.body} />
            <rect x="82" y="108" width="36" height="50" rx="16" fill={COLORS.body} />
            <path d="M82 122 C 65 130, 65 145, 80 148" stroke={COLORS.body} strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M118 122 C 135 130, 135 145, 120 148" stroke={COLORS.body} strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M92 158 C 90 175, 85 182, 78 186" stroke={COLORS.body} strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M108 158 C 110 175, 115 182, 122 186" stroke={COLORS.body} strokeWidth="12" strokeLinecap="round" fill="none" />
          </svg>
        ) : (
          <Lottie
            lottieRef={lottieRef}
            animationData={lottieData}
            loop={false}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      {/* Face overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <svg width={size} height={size} viewBox="0 0 200 200" aria-label="ユーザーキャラクター">
          <circle cx={face.eyeLeft.x} cy={face.eyeLeft.y} r={face.eyeR} fill={COLORS.face} />
          <circle cx={face.eyeRight.x} cy={face.eyeRight.y} r={face.eyeR} fill={COLORS.face} />

          <path d={face.mouthPath} stroke={COLORS.face} strokeWidth={face.mouthW} strokeLinecap="round" fill="none" />

          {face.cheeks && (
            <>
              <circle cx={face.cheeks.left.x} cy={face.cheeks.left.y} r={face.cheeks.r} fill={COLORS.cheek} />
              <circle cx={face.cheeks.right.x} cy={face.cheeks.right.y} r={face.cheeks.r} fill={COLORS.cheek} />
            </>
          )}
        </svg>
      </div>
    </div>
  )
}

function getFaceParts(faceKey: string): {
  eyeLeft: { x: number; y: number }
  eyeRight: { x: number; y: number }
  eyeR: number
  mouthPath: string
  mouthW: number
  cheeks?: { left: { x: number; y: number }; right: { x: number; y: number }; r: number }
} {
  const baseEyes = { left: { x: 88, y: 64 }, right: { x: 112, y: 64 }, r: 3.6 }
  const baseMouthW = 4.2

  const neutralMouth = 'M90 82 L110 82'
  const smileWeak = 'M90 80 Q100 88 110 80'
  const smileStrong = 'M88 78 Q100 92 112 78'
  const frownWeak = 'M90 86 Q100 80 110 86'
  const frownStrong = 'M88 88 Q100 76 112 88'
  const surpriseWeak = 'M97 82 Q100 86 103 82 Q100 78 97 82'
  const surpriseStrong = 'M96 82 Q100 90 104 82 Q100 74 96 82'
  const grinWeak = 'M90 82 Q100 88 110 80'
  const grinStrong = 'M88 82 Q100 92 112 78'
  const confusedWeak = 'M94 84 L106 84'
  const confusedStrong = 'M92 84 L108 84'
  const fearWeak = 'M94 86 L106 86'
  const fearStrong = 'M93 87 L107 87'
  const reliefWeak = 'M90 83 Q100 85 110 83'
  const reliefStrong = 'M88 82 Q100 86 112 82'

  let eyeLeft = { ...baseEyes.left }
  let eyeRight = { ...baseEyes.right }
  let eyeR = baseEyes.r
  let mouthPath = neutralMouth
  let mouthW = baseMouthW
  let cheeks: { left: { x: number; y: number }; right: { x: number; y: number }; r: number } | undefined

  switch (faceKey) {
    case 'joy_weak':
      mouthPath = smileWeak
      break
    case 'joy_strong':
      mouthPath = smileStrong
      mouthW = 4.8
      break

    case 'fun_weak':
      mouthPath = grinWeak
      break
    case 'fun_strong':
      mouthPath = grinStrong
      mouthW = 4.8
      break

    case 'anger_weak':
      eyeLeft.x = 92
      eyeRight.x = 108
      mouthPath = frownWeak
      break
    case 'anger_strong':
      eyeLeft.x = 94
      eyeRight.x = 106
      mouthPath = frownStrong
      mouthW = 4.8
      break

    case 'sadness_weak':
      eyeLeft.y = 68
      eyeRight.y = 68
      mouthPath = frownWeak
      break
    case 'sadness_strong':
      eyeLeft.y = 70
      eyeRight.y = 70
      mouthPath = frownStrong
      break

    case 'surprise_weak':
      eyeLeft.x = 86
      eyeRight.x = 114
      mouthPath = surpriseWeak
      break
    case 'surprise_strong':
      eyeLeft.x = 84
      eyeRight.x = 116
      mouthPath = surpriseStrong
      mouthW = 4.8
      break

    case 'relief_weak':
      mouthPath = reliefWeak
      break
    case 'relief_strong':
      mouthPath = reliefStrong
      break

    case 'confused_weak':
      mouthPath = confusedWeak
      break
    case 'confused_strong':
      mouthPath = confusedStrong
      mouthW = 4.6
      eyeLeft.x = 90
      eyeRight.x = 110
      break

    case 'fear_weak':
      mouthPath = fearWeak
      eyeLeft.x = 94
      eyeRight.x = 106
      eyeR = 3.0
      break
    case 'fear_strong':
      mouthPath = fearStrong
      eyeLeft.x = 95
      eyeRight.x = 105
      eyeR = 2.8
      mouthW = 4.8
      break

    case 'shy_weak':
      mouthPath = 'M92 82 Q100 88 108 82'
      cheeks = {
        left: { x: 80, y: 76 },
        right: { x: 120, y: 76 },
        r: 4.4,
      }
      eyeLeft.x = 86
      eyeRight.x = 110
      break
    case 'shy_strong':
      mouthPath = 'M90 80 Q100 92 110 80'
      mouthW = 4.8
      cheeks = {
        left: { x: 79, y: 76 },
        right: { x: 121, y: 76 },
        r: 5.6,
      }
      eyeLeft.x = 85
      eyeRight.x = 109
      break

    default:
      mouthPath = neutralMouth
      break
  }

  return { eyeLeft, eyeRight, eyeR, mouthPath, mouthW, cheeks }
}
