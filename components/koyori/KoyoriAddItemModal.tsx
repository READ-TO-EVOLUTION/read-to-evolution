'use client'

import { useState, useEffect } from 'react'
import BookSearchInput, { BookSearchResult } from '@/components/BookSearchInput'

type Book = {
  id: string
  title: string
}

type ReadingLog = {
  id: string
  pointText: string
  rangeText: string
}

type OCRAsset = {
  id: string
  extractedText: string
  pageNo: number | null
}

type KoyoriAddItemModalProps = {
  isOpen: boolean
  onClose: () => void
  onAdd: (type: string, sourceId: string, note?: string) => Promise<void>
}

export default function KoyoriAddItemModal({
  isOpen,
  onClose,
  onAdd,
}: KoyoriAddItemModalProps) {
  const [step, setStep] = useState<'type' | 'book' | 'item' | 'note'>('type')
  const [selectedType, setSelectedType] = useState<'READING_LOG' | 'OCR_TEXT' | 'NOTE' | null>(
    null
  )
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>('')
  const [items, setItems] = useState<ReadingLog[] | OCRAsset[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchBooks()
    } else {
      // リセット
      setStep('type')
      setSelectedType(null)
      setSelectedBookId('')
      setItems([])
      setSelectedItemId('')
      setNote('')
    }
  }, [isOpen])

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

  const handleTypeSelect = (type: 'READING_LOG' | 'OCR_TEXT' | 'NOTE') => {
    setSelectedType(type)
    if (type === 'NOTE') {
      setStep('note')
    } else {
      setStep('book')
    }
  }

  const handleBookSelect = async (bookId: string) => {
    setSelectedBookId(bookId)
    setLoading(true)
    try {
      if (selectedType === 'READING_LOG') {
        const res = await fetch(`/api/reading-logs?bookId=${bookId}`)
        if (res.ok) {
          const data = await res.json()
          setItems(data.readingLogs || [])
        }
      } else if (selectedType === 'OCR_TEXT') {
        // TODO: OCR APIエンドポイントを確認・実装
        // 現時点では仮実装
        const res = await fetch(`/api/assets?bookId=${bookId}`)
        if (res.ok) {
          const data = await res.json()
          // OCRアセットを取得（実装待ち）
          setItems([])
        }
      }
      setStep('item')
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  // こより追加時の書籍選択処理（新規書籍を登録してから選択）
  const handleSelectBookForKoyori = async (book: BookSearchResult) => {
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
        await handleBookSelect(data.book.id)
        // 書籍一覧を更新
        await fetchBooks()
      } else {
        const errorData = await res.json().catch(() => ({}))
        alert(errorData.error || '書籍の登録に失敗しました')
      }
    } catch (error) {
      console.error('Failed to register book:', error)
      alert('書籍の登録に失敗しました')
    }
  }

  const handleSubmit = async () => {
    if (selectedType === 'NOTE') {
      if (!note.trim()) {
        alert('メモを入力してください')
        return
      }
      await onAdd('NOTE', `note-${Date.now()}`, note)
    } else {
      if (!selectedItemId) {
        alert('アイテムを選択してください')
        return
      }
      await onAdd(selectedType!, selectedItemId, note || undefined)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900">断片を追加</h2>

        {step === 'type' && (
          <div className="space-y-2">
            <button
              onClick={() => handleTypeSelect('READING_LOG')}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-left"
            >
              ReadingLogから追加
            </button>
            <button
              onClick={() => handleTypeSelect('OCR_TEXT')}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-left"
            >
              OCRから追加
            </button>
            <button
              onClick={() => handleTypeSelect('NOTE')}
              className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-left"
            >
              NOTEを追加
            </button>
          </div>
        )}

        {step === 'book' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">本を選択してください</p>
            <BookSearchInput
              mode="select"
              includeExisting={true}
              placeholder="書籍を検索して選択..."
              onSelect={(book) => {
                if (book.isExisting && book.existingBookId) {
                  // 既存書籍を選択
                  handleBookSelect(book.existingBookId)
                } else {
                  // 新規書籍を選択した場合は、まず登録してから選択
                  handleSelectBookForKoyori(book)
                }
              }}
            />
          </div>
        )}

        {step === 'item' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedType === 'READING_LOG' ? 'ReadingLog' : 'OCR'}を選択してください
            </p>
            {loading ? (
              <p className="text-sm text-gray-500">読み込み中...</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">アイテムがありません</p>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`w-full px-4 py-2 border rounded text-left ${
                        selectedItemId === item.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {'pointText' in item ? (
                        <div>
                          <p className="text-sm font-medium">{item.rangeText}</p>
                          <p className="text-xs text-gray-600">{item.pointText}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">
                            {item.pageNo ? `p.${item.pageNo}` : 'OCR'}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {item.extractedText}
                          </p>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedItemId && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">メモ（任意）</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="メモを入力..."
                />
              </div>
            )}
          </div>
        )}

        {step === 'note' && (
          <div className="space-y-4">
            <label className="block text-sm text-gray-600 mb-1">メモを入力してください</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              rows={4}
              placeholder="メモを入力..."
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          {(step === 'item' && selectedItemId) || (step === 'note' && note.trim()) ? (
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              追加
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
