'use client'

import { useEffect, useRef } from 'react'
import { getEmotionTag } from '@/lib/emotion-tags'

type StickFigureProps = {
  emotionTag: string
  size?: number
}

/**
 * 棒人間UIコンポーネント
 * 感情タグに応じてアニメーションを変更
 * 簡易版：SVGアニメーションを使用
 */
export default function StickFigure({ emotionTag, size = 200 }: StickFigureProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const emotion = getEmotionTag(emotionTag)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // 感情タグに応じたアニメーション
    const animations: Record<string, { duration: number; keyframes: any }> = {
      happy: {
        duration: 1000,
        keyframes: [
          { transform: 'translateY(0px) rotate(0deg)', offset: 0 },
          { transform: 'translateY(-10px) rotate(5deg)', offset: 0.5 },
          { transform: 'translateY(0px) rotate(0deg)', offset: 1 },
        ],
      },
      excited: {
        duration: 800,
        keyframes: [
          { transform: 'translateY(0px) scale(1)', offset: 0 },
          { transform: 'translateY(-15px) scale(1.1)', offset: 0.5 },
          { transform: 'translateY(0px) scale(1)', offset: 1 },
        ],
      },
      peaceful: {
        duration: 2000,
        keyframes: [
          { transform: 'translateY(0px)', offset: 0 },
          { transform: 'translateY(-5px)', offset: 0.5 },
          { transform: 'translateY(0px)', offset: 1 },
        ],
      },
      thoughtful: {
        duration: 1500,
        keyframes: [
          { transform: 'rotate(0deg)', offset: 0 },
          { transform: 'rotate(-5deg)', offset: 0.5 },
          { transform: 'rotate(0deg)', offset: 1 },
        ],
      },
      inspired: {
        duration: 1200,
        keyframes: [
          { transform: 'translateY(0px) rotate(0deg)', offset: 0 },
          { transform: 'translateY(-8px) rotate(3deg)', offset: 0.5 },
          { transform: 'translateY(0px) rotate(0deg)', offset: 1 },
        ],
      },
      moved: {
        duration: 1000,
        keyframes: [
          { transform: 'scale(1)', offset: 0 },
          { transform: 'scale(1.05)', offset: 0.5 },
          { transform: 'scale(1)', offset: 1 },
        ],
      },
      curious: {
        duration: 900,
        keyframes: [
          { transform: 'translateX(0px)', offset: 0 },
          { transform: 'translateX(5px)', offset: 0.5 },
          { transform: 'translateX(0px)', offset: 1 },
        ],
      },
      challenged: {
        duration: 700,
        keyframes: [
          { transform: 'translateY(0px) rotate(0deg)', offset: 0 },
          { transform: 'translateY(-12px) rotate(-3deg)', offset: 0.5 },
          { transform: 'translateY(0px) rotate(0deg)', offset: 1 },
        ],
      },
    }

    const config = animations[emotion.value] || animations.happy
    const body = svg.querySelector('.stick-body')

    if (body) {
      const animation = (body as HTMLElement).animate(config.keyframes, {
        duration: config.duration,
        iterations: Infinity,
        easing: 'ease-in-out',
      })

      return () => animation.cancel()
    }
  }, [emotion.value])

  const colorMap: Record<string, string> = {
    yellow: 'text-yellow-500',
    orange: 'text-orange-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
    cyan: 'text-cyan-500',
    red: 'text-red-500',
  }

  const colorClass = colorMap[emotion.color] || 'text-gray-500'

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className={`stick-figure ${colorClass}`}
      >
        {/* 頭 */}
        <circle
          cx="100"
          cy="40"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="stick-head"
        />
        {/* 体 */}
        <line
          x1="100"
          y1="60"
          x2="100"
          y2="120"
          stroke="currentColor"
          strokeWidth="3"
          className="stick-body"
        />
        {/* 左腕 */}
        <line
          x1="100"
          y1="80"
          x2="70"
          y2="100"
          stroke="currentColor"
          strokeWidth="3"
          className="stick-arm-left"
        />
        {/* 右腕 */}
        <line
          x1="100"
          y1="80"
          x2="130"
          y2="100"
          stroke="currentColor"
          strokeWidth="3"
          className="stick-arm-right"
        />
        {/* 左脚 */}
        <line
          x1="100"
          y1="120"
          x2="80"
          y2="160"
          stroke="currentColor"
          strokeWidth="3"
          className="stick-leg-left"
        />
        {/* 右脚 */}
        <line
          x1="100"
          y1="120"
          x2="120"
          y2="160"
          stroke="currentColor"
          strokeWidth="3"
          className="stick-leg-right"
        />
      </svg>
      <p className="text-sm text-gray-600 mt-2">{emotion.label}</p>
    </div>
  )
}
