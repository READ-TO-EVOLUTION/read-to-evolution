'use client'

type StatusBarProps = {
  todayReviewCount: number
  unloggedBooksCount: number
  streak: number
}

/**
 * 今日の状態バー
 * 上部に表示される軽量な情報表示
 */
export default function StatusBar({
  todayReviewCount,
  unloggedBooksCount,
  streak,
}: StatusBarProps) {
  return (
    <div className="w-full px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center justify-between text-sm text-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-blue-600 font-semibold">{todayReviewCount}</span>
            <span>件の復習</span>
          </div>
          {unloggedBooksCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-orange-600 font-semibold">{unloggedBooksCount}</span>
              <span>冊未記入</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-600 font-semibold">🔥 {streak}</span>
          <span>日連続</span>
        </div>
      </div>
    </div>
  )
}
