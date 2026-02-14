'use client'

import Link from 'next/link'

type QuickStartButtonsProps = {
  todayReviewCount: number
  hasTasks: boolean
}

/**
 * クイック開始ボタン（3つ固定）
 * 優先順位：今日の復習 > 続きから > 新規ログ
 */
export default function QuickStartButtons({
  todayReviewCount,
  hasTasks,
}: QuickStartButtonsProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      {/* 今日の復習（最優先） */}
      <Link
        href="/study/today"
        className={`w-full px-6 py-4 rounded-lg font-semibold text-center transition-all ${
          hasTasks
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg transform hover:scale-105'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        📚 今日の復習 {todayReviewCount > 0 && `(${todayReviewCount}件)`}
      </Link>

      {/* 続きから（将来対応可） */}
      <button
        disabled
        className="w-full px-6 py-4 rounded-lg font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
      >
        📖 続きから
      </button>

      {/* 新規ログを書く */}
      <Link
        href="/books"
        className="w-full px-6 py-4 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 shadow-lg transform hover:scale-105 transition-all text-center"
      >
        ✍️ 新規ログを書く
      </Link>
    </div>
  )
}
