'use client'

import { useEffect, useState } from 'react'

type PaywallModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  isStudySubscriber?: boolean
}

export default function PaywallModal({
  isOpen,
  onClose,
  onConfirm,
  isStudySubscriber = false,
}: PaywallModalProps) {
  const [agreed1, setAgreed1] = useState(false)
  const [agreed2, setAgreed2] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ✅ 開くたびにチェックをリセット（押し間違い防止）
  useEffect(() => {
    if (isOpen) {
      setAgreed1(false)
      setAgreed2(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const canConfirm = isStudySubscriber || (agreed1 && agreed2)

  const handleConfirm = async () => {
    if (!canConfirm) return
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          📘 アフィリエイト機能を有効にしますか？
        </h2>

        <div className="text-sm text-gray-600 space-y-2">
          <p>
            この機能を有効にすると、紹介した購入成果を正確に計測・管理できます。
          </p>
          <p>不正防止と報酬管理のため、月額の利用料が発生します。</p>
        </div>

        <div className="bg-gray-50 rounded p-4 space-y-2">
          <p className="font-medium text-sm text-gray-900">含まれるもの</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>成果イベントの記録（開封/クリック/登録/購読など）</li>
            <li>多重カウント防止</li>
            <li>報酬管理・履歴保持</li>
          </ul>
        </div>

        {!isStudySubscriber && (
          <>
            <div className="border-t pt-4">
              <p className="font-medium text-gray-900 mb-2">料金</p>
              <p className="text-2xl font-bold text-blue-600">月額 300円（税込）</p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed1}
                  onChange={(e) => setAgreed1(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  利用料（月額300円）が発生することを理解しました
                </span>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed2}
                  onChange={(e) => setAgreed2(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  成果計測のためイベント情報が記録されることに同意します
                </span>
              </label>
            </div>
          </>
        )}

        {isStudySubscriber && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              勉強コース加入中は、アフィリエイト機能が自動的に有効になります（追加料金なし）
            </p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? '処理中...'
              : isStudySubscriber
              ? '有効にする'
              : '有効にする（決済へ）'}
          </button>
        </div>
      </div>
    </div>
  )
}
