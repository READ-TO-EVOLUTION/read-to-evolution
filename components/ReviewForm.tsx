'use client'

import { useState } from 'react'
import { EMOTION_TAGS } from '@/lib/emotion-tags'

type ReviewFormProps = {
  bookId: string
  bookTitle: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ReviewForm({ bookId, bookTitle, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [emotionTag, setEmotionTag] = useState('')
  const [comment, setComment] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')
  const [favoritePhrase, setFavoritePhrase] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [hasSpoiler, setHasSpoiler] = useState(false)
  // 構造化フィールド
  const [buyReason, setBuyReason] = useState('')
  const [goodPoints, setGoodPoints] = useState('')
  const [missingPoints, setMissingPoints] = useState('')
  const [badPoints, setBadPoints] = useState('')
  const [readDate, setReadDate] = useState('')
  const [pagesRead, setPagesRead] = useState('')
  const [ocrQuote, setOcrQuote] = useState('')
  // 紐づけ（任意）
  const [readingProgressId, setReadingProgressId] = useState<string | null>(null)
  const [ocrAssetId, setOcrAssetId] = useState<string | null>(null)
  const [ocrAssets, setOcrAssets] = useState<Array<{ id: string; pageNo: number | null; extractedText: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const appendTemplate = (current: string, text: string) => {
    if (!current) return text
    if (current.endsWith('\n')) return `${current}${text}`
    return `${current}\n${text}`
  }

  // 紐づけ候補を取得（進捗・OCR）
  // 注意: bookIdは親から渡されるため、再レンダでuseEffectを使わずに最小実装（必要時にのみ取得）
  const ensureLinkCandidatesLoaded = async () => {
    // ReadingProgress（存在すれば自動紐づけ）
    if (!readingProgressId) {
      try {
        const res = await fetch(`/api/reading-progress?bookId=${bookId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data?.progress?.id) setReadingProgressId(data.progress.id)
        }
      } catch {
        // ignore
      }
    }

    // OCRAsset（選択式）
    if (ocrAssets.length === 0) {
      try {
        const res = await fetch(`/api/ocr-assets?bookId=${bookId}`, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const assets = (data?.ocrAssets || []).map((a: any) => ({
            id: a.id,
            pageNo: a.pageNo ?? null,
            extractedText: a.extractedText || '',
          }))
          setOcrAssets(assets)
        }
      } catch {
        // ignore
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // 送信直前に候補をロード（存在すれば紐づけ）
      await ensureLinkCandidatesLoaded()

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookId,
          rating,
          emotionTag,
          comment: comment || undefined,
          searchKeywords: searchKeywords || undefined,
          favoritePhrase: favoritePhrase || undefined,
          isPublic,
          hasSpoiler,
          // 構造化フィールド
          buyReason: buyReason || undefined,
          goodPoints, // 必須
          missingPoints: missingPoints || undefined,
          badPoints: badPoints || undefined,
          readDate: readDate || undefined,
          pagesRead: pagesRead ? parseInt(pagesRead, 10) : undefined,
          ocrQuote: ocrQuote || undefined,
          // 紐づけ（任意）
          readingProgressId: readingProgressId || undefined,
          ocrAssetId: ocrAssetId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'レビューの投稿に失敗しました')
        return
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
      setError('レビューの投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">レビュー投稿: {bookTitle}</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 必須項目 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              評価 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-3xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              感情タグ <span className="text-red-500">*</span>
            </label>
            <select
              value={emotionTag}
              onChange={(e) => setEmotionTag(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {EMOTION_TAGS.map((tag) => (
                <option key={tag.value} value={tag.value}>
                  {tag.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 構造化フィールド（優先表示） */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">構造化情報</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              買う理由
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['SNSで評判', '仕事・学業で必要', '著者買い', '推薦された', '以前から気になっていた'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBuyReason((cur) => appendTemplate(cur, `- ${t}`))}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              value={buyReason}
              onChange={(e) => setBuyReason(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="この本を買った理由を入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              良かった点 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['具体例が多い', '体系的', '実践的', '読みやすい', '初心者に優しい', '深掘りできる'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setGoodPoints((cur) => appendTemplate(cur, `- ${t}`))}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              value={goodPoints}
              onChange={(e) => setGoodPoints(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="この本の良かった点を入力..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              足りない点
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['前提知識が必要', '図や例が少ない', '最新情報が薄い', '章立てが分かりにくい'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMissingPoints((cur) => appendTemplate(cur, `- ${t}`))}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              value={missingPoints}
              onChange={(e) => setMissingPoints(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="この本に足りない点を入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              悪かった点
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['冗長', '誤記がある（要確認）', '構成が散漫', '説明が飛ぶ'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBadPoints((cur) => appendTemplate(cur, `- ${t}`))}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              value={badPoints}
              onChange={(e) => setBadPoints(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="この本の悪かった点を入力..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                読んだ日
              </label>
              <input
                type="date"
                value={readDate}
                onChange={(e) => setReadDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ページ数
              </label>
              <input
                type="number"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              引用（OCR一文）
            </label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={async () => {
                  await ensureLinkCandidatesLoaded()
                }}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                OCR候補を読み込む
              </button>
              {ocrAssets.length > 0 && (
                <select
                  value={ocrAssetId || ''}
                  onChange={(e) => {
                    const nextId = e.target.value || null
                    setOcrAssetId(nextId)
                    const picked = ocrAssets.find((a) => a.id === nextId)
                    if (picked && !ocrQuote.trim()) {
                      const text = (picked.extractedText || '').trim().slice(0, 500)
                      if (text) setOcrQuote(text)
                    }
                  }}
                  className="text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="">（任意）OCRから選ぶ</option>
                  {ocrAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.pageNo !== null ? `p.${a.pageNo}` : 'ページ不明'}: {(a.extractedText || '').slice(0, 20)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <textarea
              value={ocrQuote}
              onChange={(e) => setOcrQuote(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="印象に残った一文を入力..."
            />
          </div>
        </div>

        {/* 自由記述（補助） */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">自由記述（補助）</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              コメント
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={200}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="自由にコメントを入力..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              検索ワード
            </label>
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 技術書, プログラミング, 初心者向け"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お気に入りの言葉
            </label>
            <input
              type="text"
              value={favoritePhrase}
              onChange={(e) => setFavoritePhrase(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="印象に残った言葉を入力..."
            />
          </div>
        </div>

        {/* 公開設定 */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              公開する（他のユーザーにも表示されます）
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasSpoiler"
              checked={hasSpoiler}
              onChange={(e) => setHasSpoiler(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasSpoiler" className="ml-2 text-sm text-gray-700">
              ネタバレを含む
            </label>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting || !emotionTag || !goodPoints.trim()}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '投稿中...' : 'レビューを投稿'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
