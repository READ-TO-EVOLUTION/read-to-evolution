'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type FirstTimeGuideProps = {
  giftsCount: number
  isAffiliateOn: boolean
  hasBooks: boolean
  onDismiss?: () => void
}

const STORAGE_KEY = 'ftg_hidden'

/**
 * 初回ユーザー向けガイド（チェックリスト形式）
 * 表示条件：成果計測OFF かつ localStorageで非表示にしていない
 */
export default function FirstTimeGuide({
  giftsCount,
  isAffiliateOn,
  hasBooks,
  onDismiss,
}: FirstTimeGuideProps) {
  const [dismissed, setDismissed] = useState(false)
  const [showHelpButton, setShowHelpButton] = useState(false)

  useEffect(() => {
    // localStorageから非表示状態を読み込み
    const hidden = localStorage.getItem(STORAGE_KEY) === 'true'
    setDismissed(hidden)
    setShowHelpButton(hidden)
  }, [])

  // 表示条件：成果計測OFF かつ 非表示にしていない
  const shouldShow = !isAffiliateOn && !dismissed

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowHelpButton(true)
    onDismiss?.()
  }

  const handleShowAgain = () => {
    setDismissed(false)
    localStorage.removeItem(STORAGE_KEY)
    setShowHelpButton(false)
  }

  // ヘルプボタン（非表示状態の時のみ表示）
  if (showHelpButton && !shouldShow) {
    return (
      <div className="mb-4 text-right">
        <button
          onClick={handleShowAgain}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          ？ はじめにやることを見る
        </button>
      </div>
    )
  }

  if (!shouldShow) return null

  // チェック状態
  const step1Done = hasBooks
  const step2Done = giftsCount > 0
  const step3Done = isAffiliateOn
  const step4Done = isAffiliateOn && giftsCount > 0

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">🎯 はじめにやること</h3>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          閉じる
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {step1Done ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={step1Done ? 'text-gray-600 line-through' : 'text-gray-900'}>
            ① 本を登録する
          </span>
          {!step1Done && (
            <Link
              href="/books"
              className="text-blue-600 hover:text-blue-800 underline ml-2"
            >
              → 書籍一覧へ
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {step2Done ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={step2Done ? 'text-gray-600 line-through' : 'text-gray-900'}>
            ② ギフトを作成する
          </span>
        </div>
        <div className="flex items-center gap-2">
          {step3Done ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={step3Done ? 'text-gray-600 line-through' : 'text-gray-900'}>
            ③ 成果計測をONにする
          </span>
        </div>
        <div className="flex items-center gap-2">
          {step4Done ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-gray-400">○</span>
          )}
          <span className={step4Done ? 'text-gray-600 line-through' : 'text-gray-900'}>
            ④ 分析を見る
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-3">
        💡 ヒント：ギフトとは、本を紹介するためのページです。作成したギフトURLを共有すると、成果（閲覧・購入）を確認できます。
      </p>
    </div>
  )
}
