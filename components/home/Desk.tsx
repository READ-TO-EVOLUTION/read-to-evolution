'use client'

type DeskProps = {
  onClick: () => void
  isActive: boolean
}

/**
 * 机コンポーネント
 * 勉強コースユーザー用の机（椅子の代わり）
 * タップ可能で、今日の復習を開始する
 */
export default function Desk({ onClick, isActive }: DeskProps) {
  return (
    <button
      onClick={onClick}
      className={`relative transition-all duration-300 ${
        isActive ? 'scale-110 cursor-pointer' : 'scale-100 cursor-default opacity-60'
      }`}
      disabled={!isActive}
      aria-label="今日の復習を開始"
    >
      <svg
        width="200"
        height="150"
        viewBox="0 0 200 150"
        className={`${isActive ? 'text-amber-700' : 'text-gray-400'}`}
      >
        {/* 机の天板 */}
        <rect
          x="20"
          y="40"
          width="160"
          height="20"
          rx="2"
          fill="currentColor"
          className="transition-all"
        />
        {/* 机の左側面 */}
        <polygon
          points="20,40 30,80 30,100 20,60"
          fill="currentColor"
          opacity="0.7"
        />
        {/* 机の右側面 */}
        <polygon
          points="180,40 190,80 190,100 180,60"
          fill="currentColor"
          opacity="0.7"
        />
        {/* 机の前面 */}
        <rect
          x="30"
          y="80"
          width="140"
          height="20"
          fill="currentColor"
          opacity="0.8"
        />
        {/* 机の引き出し（左） */}
        <rect
          x="40"
          y="100"
          width="50"
          height="15"
          fill="currentColor"
          opacity="0.6"
        />
        <line
          x1="65"
          y1="100"
          x2="65"
          y2="115"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.8"
        />
        {/* 机の引き出し（右） */}
        <rect
          x="110"
          y="100"
          width="50"
          height="15"
          fill="currentColor"
          opacity="0.6"
        />
        <line
          x1="135"
          y1="100"
          x2="135"
          y2="115"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.8"
        />
        {/* 机の上の本（アクティブ時のみ） */}
        {isActive && (
          <>
            <rect
              x="50"
              y="30"
              width="30"
              height="8"
              fill="currentColor"
              opacity="0.9"
              rx="1"
            />
            <rect
              x="120"
              y="25"
              width="25"
              height="8"
              fill="currentColor"
              opacity="0.9"
              rx="1"
            />
          </>
        )}
      </svg>
      {isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      )}
    </button>
  )
}
