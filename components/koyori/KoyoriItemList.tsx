'use client'

import { useState } from 'react'
import Link from 'next/link'

type KoyoriItem = {
  id: string
  type: string
  sourceId: string
  order: number
  note: string | null
  readingLog: {
    id: string
    pointText: string
    rangeText: string
    book: {
      id: string
      title: string
    }
  } | null
  ocrAsset: {
    id: string
    extractedText: string
    book: {
      id: string
      title: string
    }
  } | null
}

type KoyoriItemListProps = {
  items: KoyoriItem[]
  onReorder: (itemIds: string[]) => Promise<void>
  onUpdateNote: (itemId: string, note: string | null) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
}

export default function KoyoriItemList({
  items,
  onReorder,
  onUpdateNote,
  onDelete,
}: KoyoriItemListProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')

  const sortedItems = [...items].sort((a, b) => a.order - b.order)

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (targetItemId: string) => {
    if (!draggedItem || draggedItem === targetItemId) {
      setDraggedItem(null)
      return
    }

    const draggedIndex = sortedItems.findIndex((item) => item.id === draggedItem)
    const targetIndex = sortedItems.findIndex((item) => item.id === targetItemId)

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null)
      return
    }

    const newItems = [...sortedItems]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, removed)

    const itemIds = newItems.map((item) => item.id)
    await onReorder(itemIds)
    setDraggedItem(null)
  }

  const handleNoteEdit = (item: KoyoriItem) => {
    setEditingNote(item.id)
    setNoteValue(item.note || '')
  }

  const handleNoteSave = async (itemId: string) => {
    await onUpdateNote(itemId, noteValue || null)
    setEditingNote(null)
    setNoteValue('')
  }

  if (sortedItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500 text-sm">まだ断片がありません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold text-gray-900 mb-4">断片リスト</h2>
      <div className="space-y-2">
        {sortedItems.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(item.id)}
            className={`border rounded p-3 hover:bg-gray-50 cursor-move ${
              draggedItem === item.id ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {item.type}
                  </span>
                  {item.readingLog && (
                    <Link
                      href={`/books/${item.readingLog.book.id}/reading-logs`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {item.readingLog.book.title} - {item.readingLog.rangeText}
                    </Link>
                  )}
                  {item.ocrAsset && (
                    <Link
                      href={`/books/${item.ocrAsset.book.id}/ocr`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {item.ocrAsset.book.title} - OCR
                    </Link>
                  )}
                  {item.type === 'NOTE' && <span className="text-sm text-gray-600">メモ</span>}
                </div>

                {item.readingLog && (
                  <p className="text-sm text-gray-600 mt-1">{item.readingLog.pointText}</p>
                )}
                {item.ocrAsset && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {item.ocrAsset.extractedText}
                  </p>
                )}
                {item.type === 'NOTE' && (
                  <p className="text-sm text-gray-600">{item.note || 'メモなし'}</p>
                )}

                {editingNote === item.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      onBlur={() => handleNoteSave(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNoteSave(item.id)
                        } else if (e.key === 'Escape') {
                          setEditingNote(null)
                          setNoteValue('')
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs border rounded"
                      placeholder="メモを入力..."
                      autoFocus
                    />
                  </div>
                ) : (
                  item.note && item.type !== 'NOTE' && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        メモ: {item.note}
                        <button
                          onClick={() => handleNoteEdit(item)}
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          編集
                        </button>
                      </p>
                    </div>
                  )
                )}
              </div>
              <div className="flex gap-2 ml-4">
                {item.type !== 'NOTE' && (
                  <button
                    onClick={() => handleNoteEdit(item)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    メモ
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('このアイテムを削除しますか？')) {
                      onDelete(item.id)
                    }
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
