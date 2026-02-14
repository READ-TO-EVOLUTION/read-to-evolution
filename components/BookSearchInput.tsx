'use client'

import { useState, useEffect, useRef } from 'react'

export type BookSearchResult = {
  title: string
  author?: string
  isbn13?: string
  coverImageUrl?: string
  publisher?: string
  publishedDate?: string
  provider: 'RAKUTEN' | 'AMAZON'
  externalId: string
  purchaseUrl: string
  isExisting?: boolean // 既存書籍かどうか
  existingBookId?: string // 既存書籍のID（isExisting=trueの場合）
}

type BookSearchInputProps = {
  onSelect: (book: BookSearchResult) => void
  placeholder?: string
  mode?: 'create' | 'select' // 'create': 新規登録も可能, 'select': 既存書籍のみ選択
  includeExisting?: boolean // 既存書籍を検索結果に含めるか（デフォルト: true）
}

/**
 * 書籍検索入力コンポーネント
 * debounce付き、候補表示、選択確定
 */
export default function BookSearchInput({
  onSelect,
  placeholder = '書籍名を入力...',
  mode = 'create',
  includeExisting = true,
}: BookSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [enabledProviders, setEnabledProviders] = useState<Array<'RAKUTEN' | 'AMAZON'>>([])
  const [providersLoaded, setProvidersLoaded] = useState(false)
  const [externalSearchDisabled, setExternalSearchDisabled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // サーバ側の設定（環境変数）に応じて、外部検索の有効/無効を判定
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/book-search/config')
        if (!res.ok) throw new Error('Failed to load book-search config')
        const data = await res.json()
        const providers = (data.enabledProviders || []) as Array<'RAKUTEN' | 'AMAZON'>
        if (!cancelled) {
          setEnabledProviders(providers)
          setExternalSearchDisabled(providers.length === 0)
          setProvidersLoaded(true)
        }
      } catch {
        // 取得できない場合は「外部検索なし」として扱う（外部テスターで事故らない）
        if (!cancelled) {
          setEnabledProviders([])
          setExternalSearchDisabled(true)
          setProvidersLoaded(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // debounce付き検索
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (query.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        // mode=select の場合は「登録済みのみ」表示にする（外部検索はしない）
        const providersForRequest =
          mode === 'select'
            ? ''
            : enabledProviders.length > 0
              ? enabledProviders.join(',')
              : ''

        // includeExistingパラメータで既存書籍を含めるか制御
        // 外部検索が無効な環境では providers='' となり、サーバ側で外部検索をスキップする
        const searchParams = new URLSearchParams({
          q: query.trim(),
          providers: providersForRequest,
          includeExisting: includeExisting.toString(),
        })
        const res = await fetch(`/api/book-search?${searchParams.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const all = (data.results || []) as BookSearchResult[]
          // mode=select の場合は「登録済み」だけに絞る
          const filtered = mode === 'select' ? all.filter((b) => b.isExisting) : all
          setResults(filtered)
          setShowResults(true)
          setSelectedIndex(-1)
        } else {
          const errorData = await res.json().catch(() => ({}))
          console.error('Search error:', errorData)
          setResults([])
        }
      } catch (error) {
        console.error('Failed to search books:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500) // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, mode, includeExisting, enabledProviders])

  // キーボード操作（矢印キー、Enter）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  const handleSelect = (book: BookSearchResult) => {
    onSelect(book)
    setQuery('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
  }

  // クリックアウトサイドで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full">
      {providersLoaded && mode === 'create' && externalSearchDisabled && (
        <div className="mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          外部検索（楽天/Amazon）はこの環境では無効です（管理者の環境変数設定が必要）。
          いまは「手動入力」または「登録済みの本の検索」を使ってください。
        </div>
      )}
      {/* 検索入力欄 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true)
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
        {!loading && query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* 検索結果ドロップダウン */}
      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {results.map((book, index) => (
            <button
              key={`${book.provider}-${book.externalId}`}
              onClick={() => handleSelect(book)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="flex gap-3">
                {/* 表紙画像 */}
                {book.coverImageUrl && (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="w-16 h-20 object-cover rounded flex-shrink-0"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                {/* 書籍情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
                    {book.isExisting ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex-shrink-0">
                        登録済み
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded flex-shrink-0">
                        {book.provider === 'RAKUTEN' ? '楽天' : 'Amazon'}
                      </span>
                    )}
                  </div>
                  {book.author && (
                    <p className="text-sm text-gray-600 mt-1">著者: {book.author}</p>
                  )}
                  {book.publisher && (
                    <p className="text-xs text-gray-500 mt-1">
                      {book.publisher}
                      {book.publishedDate && ` (${book.publishedDate})`}
                    </p>
                  )}
                  {book.isbn13 && (
                    <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn13}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 検索結果なし */}
      {showResults && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          検索結果が見つかりませんでした
        </div>
      )}
    </div>
  )
}
