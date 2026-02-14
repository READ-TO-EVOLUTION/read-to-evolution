'use client'

import Link from 'next/link'

type Book = {
  id: string
  title: string
  coverImageUrl?: string | null
  readingLogs?: Array<{ createdAt: Date }>
}

type BookshelfProps = {
  books: Book[]
}

/**
 * 本棚コンポーネント（横スクロール）
 * 背景として表示され、登録した本の一覧を表示
 */
export default function Bookshelf({ books }: BookshelfProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      <div className="flex gap-4 px-8 py-4 h-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="flex-shrink-0 w-32 pointer-events-auto hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg shadow-md p-3 h-48 flex flex-col items-center justify-center border-2 border-amber-200">
              {book.coverImageUrl ? (
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-full h-32 object-cover rounded mb-2"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded mb-2 flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
              )}
              <p className="text-xs text-gray-700 font-medium text-center line-clamp-2">
                {book.title}
              </p>
              {book.readingLogs && book.readingLogs.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {book.readingLogs.length}件
                </p>
              )}
            </div>
          </Link>
        ))}
        {books.length === 0 && (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <p className="text-sm">本を登録するとここに表示されます</p>
          </div>
        )}
      </div>
    </div>
  )
}
