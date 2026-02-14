'use client'

import { useState, useEffect } from 'react'

type KoyoriEditorProps = {
  title: string
  memo: string | null
  onUpdate: (title: string, memo: string | null) => Promise<void>
  onDelete: () => Promise<void>
}

export default function KoyoriEditor({
  title: initialTitle,
  memo: initialMemo,
  onUpdate,
  onDelete,
}: KoyoriEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [memo, setMemo] = useState(initialMemo || '')
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingMemo, setEditingMemo] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTitle(initialTitle)
    setMemo(initialMemo || '')
  }, [initialTitle, initialMemo])

  const handleTitleSave = async () => {
    if (!title.trim()) {
      setTitle(initialTitle)
      setEditingTitle(false)
      return
    }

    setSaving(true)
    try {
      await onUpdate(title, memo || null)
      setEditingTitle(false)
    } catch (error) {
      console.error('Failed to update title:', error)
      setTitle(initialTitle)
    } finally {
      setSaving(false)
    }
  }

  const handleMemoSave = async () => {
    setSaving(true)
    try {
      await onUpdate(title, memo || null)
      setEditingMemo(false)
    } catch (error) {
      console.error('Failed to update memo:', error)
      setMemo(initialMemo || '')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このこよりを削除しますか？')) return
    try {
      await onDelete()
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('削除に失敗しました')
    }
  }

  return (
    <div className="space-y-4">
      {/* タイトル編集 */}
      <div className="bg-white rounded-lg shadow p-4">
        {editingTitle ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleSave()
                } else if (e.key === 'Escape') {
                  setTitle(initialTitle)
                  setEditingTitle(false)
                }
              }}
              className="flex-1 px-3 py-2 border rounded"
              disabled={saving}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl font-bold text-gray-900 cursor-pointer"
              onClick={() => setEditingTitle(true)}
            >
              {title}
            </h1>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
            >
              削除
            </button>
          </div>
        )}
      </div>

      {/* メモ編集 */}
      <div className="bg-white rounded-lg shadow p-4">
        {editingMemo ? (
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleMemoSave}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            disabled={saving}
            placeholder="短文まとめメモ..."
          />
        ) : (
          <p
            className="text-gray-600 cursor-pointer min-h-[3rem]"
            onClick={() => setEditingMemo(true)}
          >
            {memo || 'メモを追加（クリック）'}
          </p>
        )}
      </div>
    </div>
  )
}
