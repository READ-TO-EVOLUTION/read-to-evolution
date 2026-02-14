'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import KoyoriList from '@/components/koyori/KoyoriList'

type Koyori = {
  id: string
  title: string
  memo: string | null
  updatedAt: string
  _count?: {
    items: number
  }
}

export default function KoyoriPage() {
  const router = useRouter()
  const [koyoris, setKoyoris] = useState<Koyori[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKoyoris()
  }, [])

  const fetchKoyoris = async () => {
    try {
      const res = await fetch('/api/koyori')
      const data = await res.json()
      setKoyoris(data.items || [])
    } catch (error) {
      console.error('Failed to fetch koyoris:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    const title = prompt('こよりのタイトルを入力してください')
    if (!title) return

    try {
      const res = await fetch('/api/koyori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (res.ok) {
        const koyori = await res.json()
        router.push(`/koyori/${koyori.id}`)
      }
    } catch (error) {
      console.error('Failed to create koyori:', error)
      alert('こよりの作成に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">こより</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ＋新規こより
          </button>
        </div>

        <KoyoriList
          koyoris={koyoris}
          nextCursor={null}
          onLoadMore={async (cursor) => {
            try {
              const res = await fetch(`/api/koyori?cursor=${cursor}`)
              if (res.ok) {
                const data = await res.json()
                setKoyoris([...koyoris, ...(data.items || [])])
              }
            } catch (error) {
              console.error('Failed to load more:', error)
            }
          }}
        />
      </div>
    </div>
  )
}
