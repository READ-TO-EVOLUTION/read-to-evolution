'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * ログイン画面
 * コンセプト：本にペンで記入する
 * - 背景：開いた本（見開き）
 * - 入力項目：「記入」の印象
 * - ログイン行為の意味：本を自分のものとして開く行為
 */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'ログインに失敗しました')
        return
      }

      router.push('/')
    } catch (err) {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-100 to-amber-50 flex items-center justify-center px-4 py-8">
      {/* 背景：開いた本（見開き） */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 top-0 w-1/2 h-full bg-gradient-to-r from-amber-200/30 to-transparent transform -skew-x-12 origin-left"></div>
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-amber-200/30 to-transparent transform skew-x-12 origin-right"></div>
        {/* 本の中央の綴じ目 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-amber-800/20 transform -translate-x-1/2"></div>
        {/* ページの線 */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-amber-900"
              style={{ top: `${(i + 1) * 5}%` }}
            />
          ))}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 max-w-md w-full">
        {/* タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 font-serif">
            READ TO EVOLUTION
          </h1>
          <p className="text-sm text-gray-600">本を開いて、記入してください</p>
        </div>

        {/* ログインフォーム（本のページ上に記入するイメージ） */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 border-2 border-amber-200">
          <div className="mb-6 text-center">
            <div className="inline-block text-5xl mb-2">📖</div>
            <h2 className="text-xl font-semibold text-gray-800">ログイン情報を記入</h2>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* メールアドレス（手書き風の入力欄） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">✍️</span>
                <span>メールアドレス</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  ─
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-3 border-b-2 border-amber-300 bg-transparent focus:outline-none focus:border-amber-600 focus:bg-amber-50/50 transition-all font-mono text-sm"
                  placeholder="your.email@example.com"
                  style={{
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                  }}
                />
              </div>
            </div>

            {/* パスワード（手書き風の入力欄） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">🔒</span>
                <span>パスワード</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  ─
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-3 border-b-2 border-amber-300 bg-transparent focus:outline-none focus:border-amber-600 focus:bg-amber-50/50 transition-all font-mono text-sm"
                  placeholder="••••••••"
                  style={{
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                  }}
                />
              </div>
            </div>

            {/* ログインボタン（ペンで記入するイメージ） */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition disabled:opacity-50 font-semibold shadow-lg transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>記入中...</span>
                </>
              ) : (
                <>
                  <span>✍️</span>
                  <span>記入して開く</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-amber-600 hover:underline font-medium">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
