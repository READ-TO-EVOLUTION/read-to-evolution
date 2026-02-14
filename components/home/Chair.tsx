'use client'

type ChairProps = {
  onClick: () => void
  isActive: boolean
}

/**
 * 椅子コンポーネント
 * タップ可能で、今日の復習を開始する
 */
export default function Chair({ onClick, isActive }: ChairProps) {
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
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className={`${isActive ? 'text-amber-600' : 'text-gray-400'}`}
      >
        {/* 椅子の座面 */}
        <rect
          x="20"
          y="60"
          width="80"
          height="20"
          rx="4"
          fill="currentColor"
          className="transition-all"
        />
        {/* 椅子の背もたれ */}
        <rect
          x="20"
          y="20"
          width="80"
          height="10"
          rx="4"
          fill="currentColor"
          className="transition-all"
        />
        {/* 椅子の脚（左前） */}
        <line
          x1="30"
          y1="80"
          x2="30"
          y2="100"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* 椅子の脚（右前） */}
        <line
          x1="90"
          y1="80"
          x2="90"
          y2="100"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* 椅子の脚（左後） */}
        <line
          x1="30"
          y1="20"
          x2="30"
          y2="100"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* 椅子の脚（右後） */}
        <line
          x1="90"
          y1="20"
          x2="90"
          y2="100"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {isActive && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      )}
    </button>
  )
}
