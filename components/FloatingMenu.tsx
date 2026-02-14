'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

type MenuItem = {
  label: string
  href: string
}

const menuItems: MenuItem[] = [
  { label: 'ホーム', href: '/' },
  { label: '今日の復習', href: '/study/today' },
  { label: '教材管理', href: '/books' },
  { label: 'レビュー', href: '/reviews' },
  { label: '通知', href: '/notifications' },
  { label: 'こより', href: '/koyori' },
  { label: 'アフィリエイト', href: '/settings/affiliate' },
]

export default function FloatingMenu() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [affiliateState, setAffiliateState] = useState<string | null>(null)

  // 初期位置を右下に設定（ローカルストレージから読み込み、なければデフォルト）
  useEffect(() => {
    const savedPosition = localStorage.getItem('floatingMenuPosition')
    if (savedPosition) {
      const { x, y } = JSON.parse(savedPosition)
      setPosition({ x, y })
    } else {
      // デフォルト位置：右下（画面サイズに応じて計算）
      if (typeof window !== 'undefined') {
        setPosition({
          x: window.innerWidth - 80,
          y: window.innerHeight - 80,
        })
      }
    }
  }, [])

  // AffiliateStateを取得（成果ダッシュボードの表示判定用）
  useEffect(() => {
    fetch('/api/affiliate/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.affiliateState) {
          setAffiliateState(data.affiliateState)
        }
      })
      .catch(() => {})
  }, [])

  // 位置を保存
  const savePosition = (x: number, y: number) => {
    localStorage.setItem('floatingMenuPosition', JSON.stringify({ x, y }))
  }

  // リセット機能
  const handleReset = () => {
    if (typeof window !== 'undefined') {
      const defaultPosition = {
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      }
      setPosition(defaultPosition)
      savePosition(defaultPosition.x, defaultPosition.y)
    }
  }

  // ドラッグ開始
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // 左クリックのみ
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
    e.preventDefault()
  }

  // ドラッグ中
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // 画面内に制限
      const maxX = typeof window !== 'undefined' ? window.innerWidth - 60 : 0
      const maxY = typeof window !== 'undefined' ? window.innerHeight - 60 : 0

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      savePosition(position.x, position.y)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, position])

  // タッチイベント対応（モバイル）
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const newX = touch.clientX - dragStart.x
      const newY = touch.clientY - dragStart.y

      const maxX = typeof window !== 'undefined' ? window.innerWidth - 60 : 0
      const maxY = typeof window !== 'undefined' ? window.innerHeight - 60 : 0

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      savePosition(position.x, position.y)
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, dragStart, position])

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* メインボタン */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all text-2xl ${
          isOpen
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        } ${isDragging ? 'opacity-80' : ''}`}
        aria-label="目次メニュー"
      >
        {isOpen ? '✕' : '📖'}
      </button>

      {/* メニュー項目 */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-2 min-w-[200px]">
          <div className="mb-2 pb-2 border-b border-gray-200">
            <button
              onClick={handleReset}
              className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              📍 位置をリセット
            </button>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 text-sm rounded transition ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* 成果ダッシュボード（ONのみ表示） */}
            {affiliateState === 'ON' && (
              <Link
                href="/affiliate/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 text-sm rounded transition ${
                  pathname === '/affiliate/dashboard'
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                成果ダッシュボード
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
