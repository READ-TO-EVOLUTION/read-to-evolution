import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware'
import { searchBooks, BookSearchResult } from '@/lib/book-search'
import { prisma } from '@/lib/prisma'

/**
 * 書籍検索API
 * 楽天・Amazonから書籍候補を取得
 * 既存書籍も検索結果に含める
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const userId = await getCurrentUser()
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const providersParam = searchParams.get('providers')
    const providers =
      providersParam == null
        ? (['RAKUTEN'] as string[])
        : providersParam.trim() === ''
          ? []
          : providersParam.split(',').map((s) => s.trim()).filter(Boolean)
    const includeExisting = searchParams.get('includeExisting') !== 'false' // デフォルトtrue

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: '検索クエリが必要です' }, { status: 400 })
    }

    const results: (BookSearchResult & { isExisting?: boolean; existingBookId?: string })[] = []

    // 既存書籍の検索（ユーザーが所有する書籍のみ）
    if (includeExisting) {
      const existingBooks = await prisma.book.findMany({
        where: {
          readingLogs: {
            some: {
              userId,
            },
          },
          OR: [
            { title: { contains: query.trim() } },
            { author: { contains: query.trim() } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
      })

      for (const book of existingBooks) {
        results.push({
          title: book.title,
          author: book.author || undefined,
          isbn13: book.isbn13 || undefined,
          coverImageUrl: book.coverImageUrl || undefined,
          publisher: book.publisher || undefined,
          publishedDate: book.publishedDate?.toISOString(),
          provider: 'RAKUTEN' as const, // 既存書籍はプロバイダー情報なし
          externalId: book.id,
          purchaseUrl: '',
          isExisting: true,
          existingBookId: book.id,
        })
      }
    }

    // 外部API検索（楽天・Amazon）
    if (providers.length > 0) {
      try {
        const externalResults = await searchBooks(
          query.trim(),
          providers as ('RAKUTEN' | 'AMAZON')[]
        )
        results.push(...externalResults)
      } catch (error: any) {
        console.error('External book search error:', error)
        // 外部APIエラーでも既存書籍の結果は返す
      }
    }

    return NextResponse.json({
      query,
      results,
      count: results.length,
    })
  } catch (error: any) {
    console.error('Book search error:', error)
    return NextResponse.json(
      {
        error: '書籍検索に失敗しました',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
