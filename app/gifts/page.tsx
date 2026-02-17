'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PaywallModal from '@/components/PaywallModal'
import BookSearchInput, { BookSearchResult } from '@/components/BookSearchInput'
import FirstTimeGuide from '@/components/gifts/FirstTimeGuide'
import { isBetaClosedClient } from '@/lib/feature-flags-client'

type Book = {
  id: string
  title: string
}

type Gift = {
  id: string
  bookId: string
  purchaseUrl: string
  message: string | null
  giftToken: string
  status: string
  expiresAt: string | null
  createdAt: string
  book: Book
  events: Array<{
    id: string
    type: string
    createdAt: string
  }>
}

export default function GiftsPage() {
  const router = useRouter()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [formData, setFormData] = useState({
    bookId: '',
    purchaseUrl: '',
    message: '',
    expiresAt: '',
  })

  const [affiliateState, setAffiliateState] = useState<{
    affiliateState: string
    affiliatePlanType: string
    requiresPaywall: boolean
  } | null>(null)

  const [showPaywall, setShowPaywall] = useState(false)

  // Beta Closed: Redirect to home (replace to prevent back button)
  useEffect(() => {
    if (isBetaClosedClient()) {
      router.replace('/')
    }
  }, [router])

  useEffect(() => {
    fetchGifts()
    fetchBooks()
    fetchAffiliateState()
  }, [])

  // Checkout完了後の戻りURL処理（任意改善：ポーリング方式）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (!sessionId) return

    // Checkout完了後の戻り
    // 状態更新はWebhook完了とタイミングがズレるので、ポーリングで待つ
    let pollCount = 0
    const maxPolls = 5
    const pollInterval = 500 // 0.5秒

    const pollAffiliateState = async () => {
      if (pollCount >= maxPolls) {
        // 最大5回試行してもONにならなかった場合は再読み込みを促す
        return
      }

      await fetchAffiliateState()
      pollCount++

      // 最新の状態を取得してチェック
      const res = await fetch('/api/affiliate/me')
      if (res.ok) {
        const data = await res.json()
        if (data.affiliateState === 'ON') {
          // ONになったら停止してURLをクリーンアップ
          window.history.replaceState({}, '', '/gifts')
          setAffiliateState(data)
        } else if (pollCount < maxPolls) {
          // まだONでない場合は続ける
          setTimeout(pollAffiliateState, pollInterval)
        }
      } else if (pollCount < maxPolls) {
        // エラーでも続ける
        setTimeout(pollAffiliateState, pollInterval)
      }
    }

    // 初回は即実行、その後はポーリング
    setTimeout(pollAffiliateState, pollInterval)
  }, [])

  const fetchAffiliateState = async () => {
    try {
      const res = await fetch('/api/affiliate/me')
      if (res.ok) {
        const data = await res.json()
        setAffiliateState(data)
      }
    } catch (error) {
      console.error('Failed to fetch affiliate state:', error)
    }
  }

  const handleOptIn = async () => {
    try {
      const res = await fetch('/api/affiliate/opt-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'ENABLE_AFFILIATE',
          source: 'GIFT',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.requiresCheckout) {
          if (data.checkoutUrl) {
            // Stripe Checkoutに遷移
            window.location.href = data.checkoutUrl
          } else {
            alert('決済URLの取得に失敗しました。実装ミスの可能性があります。')
          }
        } else {
          // STUDY_SUBの場合は即ON
          await fetchAffiliateState()
          setShowPaywall(false)
        }
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '有効化に失敗しました')
      }
    } catch (error) {
      console.error('Failed to opt-in:', error)
      alert('有効化に失敗しました')
    }
  }

  const fetchGifts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/gifts')
      if (res.ok) {
        const data = await res.json()
        setGifts(data.gifts || [])
      }
    } catch (error) {
      console.error('Failed to fetch gifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books')
      if (res.ok) {
        const data = await res.json()
        setBooks(data.books || [])
      }
    } catch (error) {
      console.error('Failed to fetch books:', error)
    }
  }

  // ギフト作成時の書籍選択処理（新規書籍を登録してから選択）
  const handleSelectBookForGift = async (book: BookSearchResult) => {
    try {
      // 新規書籍を登録
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          isbn13: book.isbn13,
          publisher: book.publisher,
          publishedDate: book.publishedDate ? new Date(book.publishedDate).toISOString() : undefined,
          coverImageUrl: book.coverImageUrl,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // 登録した書籍を選択状態にする
        setFormData({ ...formData, bookId: data.book.id })
        // 書籍一覧を更新
        await fetchBooks()
        alert(`「${book.title}」を登録して選択しました`)
      } else {
        const errorData = await res.json().catch(() => ({}))
        alert(errorData.error || '書籍の登録に失敗しました')
      }
    } catch (error) {
      console.error('Failed to register book:', error)
      alert('書籍の登録に失敗しました')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.purchaseUrl.trim()) {
      alert('購入URLを入力してください')
      return
    }

    if (
      !formData.purchaseUrl.startsWith('http://') &&
      !formData.purchaseUrl.startsWith('https://')
    ) {
      alert('有効なURLを入力してください')
      return
    }

    // バリデーション：bookId必須
    if (!formData.bookId || formData.bookId.trim() === '') {
      alert('書籍を選択してください')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: formData.bookId,
          purchaseUrl: formData.purchaseUrl,
          message: formData.message || undefined,
          expiresAt: formData.expiresAt || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setShowForm(false)
        setFormData({
          bookId: '',
          purchaseUrl: '',
          message: '',
          expiresAt: '',
        })
        fetchGifts()

        const giftUrl = `${window.location.origin}/gifts/${data.gift.slug}`
        alert(
          `ギフトを作成しました！\n\nギフトURL:\n${giftUrl}\n\nこのURLをコピーして共有してください。`
        )
      } else {
        const data = await res.json()
        alert(data.error || '作成に失敗しました')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('エラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const copyGiftUrl = (slug: string) => {
    const giftUrl = `${window.location.origin}/gifts/${slug}`
    navigator.clipboard.writeText(giftUrl)
    alert('ギフトURLをコピーしました')
  }

  const isAffiliateOn = affiliateState?.affiliateState === 'ON'
  const requiresPaywall = affiliateState?.requiresPaywall === true

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/books"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← 書籍一覧に戻る
          </Link>
          <div className="mb-3">
            <h1 className="text-2xl font-bold text-gray-900">🎁 ギフト一覧</h1>
            <p className="text-gray-700 mt-2 leading-relaxed">
              あなたが紹介した「本」を登録・管理する画面です。
              <br />
              ここで作成したギフトごとに、成果（購入・反応）を確認できます。
            </p>
            <p className="text-xs text-gray-500 mt-2">
              💡 <strong>ギフト</strong>：本を紹介するためのページです。作成したギフトURLを共有すると、誰が閲覧・購入したかを確認できます。
            </p>
          </div>

          {/* ✅ ONのときはダッシュボード導線を出す */}
          {isAffiliateOn && (
            <div className="mt-3">
              <Link
                href="/affiliate/dashboard"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                成果ダッシュボードへ
              </Link>
            </div>
          )}
        </div>

        {/* 初回ユーザー向けガイド */}
        <FirstTimeGuide
          giftsCount={gifts.length}
          isAffiliateOn={isAffiliateOn}
          hasBooks={books.length > 0}
        />

        {/* 新規作成ボタン */}
        {!showForm && (
          <div className="mb-4 space-y-2">
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-medium"
            >
              + ギフトを作成
            </button>

            {/* ✅ OFFのときだけ「成果計測をONにする」 */}
            {requiresPaywall && (
              <button
                onClick={() => setShowPaywall(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                成果計測をONにする
              </button>
            )}
          </div>
        )}

        {/* フォーム */}
        {showForm && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">ギフトを作成</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 書籍選択（任意） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  書籍（任意）
                </label>
                <BookSearchInput
                  mode="select"
                  includeExisting={true}
                  placeholder="書籍を検索して選択..."
                  onSelect={(book) => {
                    if (book.isExisting && book.existingBookId) {
                      // 既存書籍を選択
                      setFormData({ ...formData, bookId: book.existingBookId })
                    } else {
                      // 新規書籍を選択した場合は、まず登録してから選択
                      handleSelectBookForGift(book)
                    }
                  }}
                />
                {formData.bookId && (
                  <div className="mt-2 text-sm text-gray-600">
                    選択中: {books.find((b) => b.id === formData.bookId)?.title || '読み込み中...'}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, bookId: '' })}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      クリア
                    </button>
                  </div>
                )}
              </div>

              {/* 購入URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  購入URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.purchaseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, purchaseUrl: e.target.value })
                  }
                  placeholder="https://..."
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* メッセージ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ（任意）
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={3}
                  placeholder="贈り主からのメッセージ..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* 有効期限 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  有効期限（任意）
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* ボタン */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {submitting ? '作成中...' : 'ギフトを作成'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({
                      bookId: '',
                      purchaseUrl: '',
                      message: '',
                      expiresAt: '',
                    })
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ギフト一覧 */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : gifts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>まだギフトがありません</p>
            <p className="text-sm mt-2">「ギフトを作成」ボタンから作成を始めましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gifts.map((gift) => {
              const openedCount = gift.events.filter(
                (e) => e.type === 'GIFT_OPENED'
              ).length
              const clickedCount = gift.events.filter(
                (e) => e.type === 'OUTBOUND_CLICKED'
              ).length

              return (
                <div
                  key={gift.id}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded">
                          {gift.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          {gift.book.title}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-2 break-all">
                        {gift.purchaseUrl}
                      </p>

                      {gift.message && (
                        <p className="text-sm text-gray-700 mb-2">{gift.message}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>開封: {openedCount}回</span>
                        <span>クリック: {clickedCount}回</span>
                        {gift.expiresAt && (
                          <span>
                            期限: {new Date(gift.expiresAt).toLocaleString('ja-JP')}
                          </span>
                        )}
                      </div>

                      {/* ✅ OFFなら説明を出す（v4：押した瞬間だけPaywall） */}
                      {!isAffiliateOn && (
                        <div className="mt-3 text-xs text-gray-500">
                          📊 分析を見るには「成果計測をON」にしてください
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => copyGiftUrl(gift.giftToken)}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded hover:bg-pink-200 text-sm"
                      >
                        URLコピー
                      </button>

                      <a
                        href={`/gifts/${gift.giftToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm text-center block"
                      >
                        プレビュー
                      </a>

                      {/* ✅ ONなら分析へ、OFFなら成果計測ON導線 */}
                      {isAffiliateOn ? (
                        <Link
                          href={`/gifts/${gift.id}/analytics`}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm text-center block"
                        >
                          分析を見る
                        </Link>
                      ) : (
                        <button
                          onClick={() => setShowPaywall(true)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm text-center"
                        >
                          成果計測をONにする
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onConfirm={handleOptIn}
        isStudySubscriber={affiliateState?.affiliatePlanType === 'STUDY_SUB'}
      />
    </div>
  )
}
