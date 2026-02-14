import Link from 'next/link'

/**
 * 404 Not Found ページ
 * 存在しないページにアクセスした際に表示
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">📖</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">ページが見つかりません</h1>
        <p className="text-gray-600 mb-6">
          お探しのページは存在しないか、移動された可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
