'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BookSearchInput, { BookSearchResult } from '@/components/BookSearchInput'
import ReviewSummaryCard from '@/components/ReviewSummaryCard'
import PublicReviewsList from '@/components/PublicReviewsList'
import ReviewForm from '@/components/ReviewForm'

type Book = {
  id: string
  title: string
  author?: string | null
  publisher?: string | null
  materials: { id: string }[]
}

type UserBook = {
  id: string
  bookId: string
  status: string
  updatedAt: string
  book: Book
}

type TabType = 'ALL' | 'TSUNDOKU'
type StatusFilter = 'ALL' | 'TSUNDOKU' | 'READING' | 'FINISHED' | 'PAUSED'
type SortKey = 'UPDATED_DESC' | 'TITLE_ASC' | 'STATUS_ASC'

export default function BooksPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [useSearch, setUseSearch] = useState(false) // 検索モード切り替え
  const [activeTab, setActiveTab] = useState<TabType>('ALL')
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({}) // 各bookIdの更新中状態
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null) // 削除中のbookId
  const [searchQuery, setSearchQuery] = useState('') // 検索クエリ
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL') // ステータスフィルタ
  const [sortKey, setSortKey] = useState<SortKey>('UPDATED_DESC') // 並び替えキー
  const [showReviewForm, setShowReviewForm] = useState(false) // レビュー作成フォーム表示
  const [reviewFormBookId, setReviewFormBookId] = useState<string | null>(null) // レビュー作成対象のbookId

  useEffect(() => {
    fetchBooks()
    fetchUserBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books')
      if (res.ok) {
        const data = await res.json()
        setBooks(data.books || [])
      } else {
        if (res.status === 401) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserBooks = async () => {
    try {
      const res = await fetch('/api/user-books')
      if (res.ok) {
        const data = await res.json()
        setUserBooks(data.userBooks || [])
      }
    } catch (error) {
      console.error('Failed to fetch user books:', error)
    }
  }

  const handleSetStatus = async (bookId: string, status: string) => {
    // 空文字列の場合は何もしない
    if (!status) return

    // 連打防止：既に更新中の場合は無視
    if (updatingStatus[bookId]) return

    setUpdatingStatus((prev) => ({ ...prev, [bookId]: true }))

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()

      if (res.ok) {
        // 成功時：ローカルstateを更新（再フェッチではなく）
        const updatedUserBook = data.userBook
        setUserBooks((prev) => {
          const existingIndex = prev.findIndex((ub) => ub.bookId === bookId)
          if (existingIndex >= 0) {
            // 既存のUserBookを更新
            const updated = [...prev]
            updated[existingIndex] = updatedUserBook
            return updated
          } else {
            // 新規の場合は追加（通常は発生しないが念のため）
            return [...prev, updatedUserBook]
          }
        })
      } else {
        // エラー時：エラーメッセージを表示
        const errorMessage = data.error || '読書状態の更新に失敗しました'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Failed to set status:', error)
      alert('読書状態の更新に失敗しました')
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [bookId]: false }))
    }
  }

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    // 確認ダイアログ
    const confirmed = window.confirm(
      `本棚から「${bookTitle}」を削除します。関連するログ・レビュー・進捗も削除されます。よろしいですか？`
    )

    if (!confirmed) return

    // 連打防止
    if (deletingBookId === bookId) return

    setDeletingBookId(bookId)

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok) {
        // 成功時：stateから該当userBookを除去
        setUserBooks((prev) => prev.filter((ub) => ub.bookId !== bookId))
        alert('本棚から削除しました')
      } else {
        // エラー時：エラーメッセージを表示
        const errorMessage = data.error || '本棚からの削除に失敗しました'
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Failed to delete book:', error)
      alert('本棚からの削除に失敗しました')
    } finally {
      setDeletingBookId(null)
    }
  }

  // フィルタリング処理（検索・ステータスフィルタ適用）
  const filteredUserBooks = useMemo(() => {
    let filtered: UserBook[] = []

    // タブによる絞り込み（既存ロジック）
    if (activeTab === 'TSUNDOKU') {
      filtered = userBooks.filter((ub) => ub.status === 'TSUNDOKU')
    } else {
      // ALLタブの場合は、userBooksをそのまま使用
      filtered = userBooks
    }

    // ステータスフィルタ適用
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((ub) => ub.status === statusFilter)
    }

    // 検索クエリ適用（タイトル・著者・出版社で部分一致）
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((ub) => {
        const title = (ub.book.title || '').toLowerCase()
        const author = (ub.book.author || '').toLowerCase()
        const publisher = (ub.book.publisher || '').toLowerCase()
        return title.includes(query) || author.includes(query) || publisher.includes(query)
      })
    }

    return filtered
  }, [userBooks, activeTab, statusFilter, searchQuery])

  // ソート処理
  const sortedUserBooks = useMemo(() => {
    const arr = [...filteredUserBooks]
    switch (sortKey) {
      case 'UPDATED_DESC':
        arr.sort((a, b) => {
          const timeA = new Date(a.updatedAt).getTime()
          const timeB = new Date(b.updatedAt).getTime()
          return timeB - timeA // 新しい順
        })
        break
      case 'TITLE_ASC':
        arr.sort((a, b) => {
          const titleA = a.book?.title ?? ''
          const titleB = b.book?.title ?? ''
          return titleA.localeCompare(titleB, 'ja')
        })
        break
      case 'STATUS_ASC':
        const statusOrder: Record<string, number> = {
          TSUNDOKU: 0,
          READING: 1,
          PAUSED: 2,
          FINISHED: 3,
        }
        arr.sort((a, b) => {
          const orderA = statusOrder[a.status] ?? 99
          const orderB = statusOrder[b.status] ?? 99
          return orderA - orderB
        })
        break
    }
    return arr
  }, [filteredUserBooks, sortKey])

  // 表示用の形式に変換
  const displayBooks = useMemo(() => {
    return sortedUserBooks.map((ub) => ({
      ...ub.book,
      userBookStatus: ub.status,
    }))
  }, [sortedUserBooks])

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newBookTitle }),
      })

      const data = await res.json()

      if (res.ok) {
        setNewBookTitle('')
        setShowCreateForm(false)
        setUseSearch(false)
        fetchBooks()
        fetchUserBooks() // 本棚一覧も更新
      } else {
        const errorMsg = data.error || '書籍の登録に失敗しました'
        const details = data.details ? `\n詳細: ${data.details}` : ''
        alert(`${errorMsg}${details}`)
        console.error('Book creation error:', data)
      }
    } catch (error) {
      console.error('Book creation error:', error)
      alert('書籍の登録に失敗しました。ネットワークエラーの可能性があります。')
    } finally {
      setCreating(false)
    }
  }

  // 検索結果から書籍を選択したときの処理
  const handleSelectBook = async (book: BookSearchResult) => {
    setCreating(true)

    try {
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

      const data = await res.json()

      if (res.ok) {
        setUseSearch(false)
        setShowCreateForm(false)
        fetchBooks()
        fetchUserBooks() // 本棚一覧も更新
        alert(`「${book.title}」を登録しました`)
      } else {
        const errorMsg = data.error || '書籍の登録に失敗しました'
        const details = data.details ? `\n詳細: ${data.details}` : ''
        alert(`${errorMsg}${details}`)
        console.error('Book creation error:', data)
      }
    } catch (error) {
      console.error('Book creation error:', error)
      alert('書籍の登録に失敗しました。ネットワークエラーの可能性があります。')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">本棚</h1>
          <div className="space-x-2">
            <Link
              href="/study/today"
              className="text-blue-600 hover:underline"
            >
              今日の復習
            </Link>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showCreateForm ? 'キャンセル' : '+ 書籍を登録'}
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'ALL'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            全て
          </button>
          <button
            onClick={() => setActiveTab('TSUNDOKU')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'TSUNDOKU'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            積読
          </button>
        </div>

        {/* 検索とフィルタ */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 検索ボックス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトル・著者で検索"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ステータスフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                読書状態で絞り込み
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">全て</option>
                <option value="TSUNDOKU">積読</option>
                <option value="READING">読書中</option>
                <option value="FINISHED">読了</option>
                <option value="PAUSED">中断</option>
              </select>
            </div>

            {/* 並び替え */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                並び替え
              </label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UPDATED_DESC">更新が新しい順</option>
                <option value="TITLE_ASC">タイトル順</option>
                <option value="STATUS_ASC">ステータス順</option>
              </select>
            </div>
          </div>

          {/* 件数表示 */}
          <div className="mt-3 text-sm text-gray-600">
            表示: {displayBooks.length}件 / 全: {userBooks.length}件
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">新しい書籍を登録</h2>

            {/* 検索モード切り替え */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setUseSearch(!useSearch)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  useSearch
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {useSearch ? '✓ 検索モード' : '検索モード'}
              </button>
              <button
                type="button"
                onClick={() => setUseSearch(false)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  !useSearch
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {!useSearch ? '✓ 手動入力' : '手動入力'}
              </button>
            </div>

            {useSearch ? (
              /* 検索モード */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    書籍を検索（楽天・Amazon）
                  </label>
                  <BookSearchInput
                    onSelect={handleSelectBook}
                    placeholder="書籍名を入力して検索..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    ※ 楽天・Amazonの両方から検索します。環境変数が設定されていない場合は該当プロバイダーはスキップされます。
                  </p>
                </div>
                {creating && (
                  <div className="text-center text-gray-600">登録中...</div>
                )}
              </div>
            ) : (
              /* 手動入力モード */
              <form onSubmit={handleCreateBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    書籍名
                  </label>
                  <input
                    type="text"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 基本情報技術者試験 過去問集"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {creating ? '登録中...' : '登録'}
                </button>
              </form>
            )}
          </div>
        )}

        {displayBooks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              {searchQuery || statusFilter !== 'ALL'
                ? '条件に一致する書籍がありません'
                : activeTab === 'TSUNDOKU'
                ? '積読の書籍がありません'
                : '登録されている書籍がありません'}
            </p>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'ALL'
                ? '検索条件やフィルタを変更してください'
                : activeTab === 'TSUNDOKU'
                ? '書籍を積読として登録しましょう'
                : '書籍を登録して、学習記録を作成しましょう'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayBooks.map((book: any) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {book.title}
                      </h2>
                      {book.userBookStatus === 'TSUNDOKU' && (
                        <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded">
                          積読
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      教材数: {book.materials?.length || 0}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-600 mb-1">読書状態</label>
                    <select
                      value={book.userBookStatus || ''}
                      onChange={(e) => handleSetStatus(book.id, e.target.value)}
                      disabled={updatingStatus[book.id]}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">状態を選択</option>
                      <option value="TSUNDOKU">積読</option>
                      <option value="READING">読書中</option>
                      <option value="FINISHED">読了</option>
                      <option value="PAUSED">中断</option>
                    </select>
                    {updatingStatus[book.id] && (
                      <span className="text-xs text-gray-500">更新中...</span>
                    )}
                  </div>
                </div>

                {/* 積読タブの場合のみレビューサマリーを表示 */}
                {activeTab === 'TSUNDOKU' && (
                  <ReviewSummaryCard bookId={book.id} />
                )}

                {/* みんなのレビュー（公開レビュー）一覧 */}
                <PublicReviewsList bookId={book.id} limit={5} />

                {/* レビュー作成フォーム（表示時） */}
                {showReviewForm && reviewFormBookId === book.id && (
                  <div className="mt-4">
                    <ReviewForm
                      bookId={book.id}
                      bookTitle={book.title}
                      onSuccess={() => {
                        setShowReviewForm(false)
                        setReviewFormBookId(null)
                        fetchUserBooks() // レビュー一覧を更新
                      }}
                      onCancel={() => {
                        setShowReviewForm(false)
                        setReviewFormBookId(null)
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="flex space-x-2">
                    <Link
                      href={`/books/${book.id}/materials`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      教材を登録
                    </Link>
                    <button
                      onClick={() => {
                        setReviewFormBookId(book.id)
                        setShowReviewForm(true)
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      レビュー投稿
                    </button>
                    <Link
                      href={`/books/${book.id}/progress`}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
                    >
                      進捗入力
                    </Link>
                    <Link
                      href={`/books/${book.id}/reading-logs`}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                      読書ログ
                    </Link>
                    <Link
                      href={`/books/${book.id}/mesos`}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                      Meso
                    </Link>
                    <Link
                      href={`/books/${book.id}/macros`}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Macro
                    </Link>
                    <Link
                      href={`/books/${book.id}/snapshots`}
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
                    >
                      Snapshot
                    </Link>
                    <Link
                      href={`/books/${book.id}/ocr`}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                      OCR管理
                    </Link>
                    <button
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      disabled={deletingBookId === book.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingBookId === book.id ? '削除中...' : '削除'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
