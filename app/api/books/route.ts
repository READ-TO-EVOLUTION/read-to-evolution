import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn13: z.string().optional(),
  publisher: z.string().optional(),
  publishedDate: z.string().optional(), // ISO string
  coverImageUrl: z
    .union([z.string().url(), z.literal(''), z.undefined()])
    .optional(),
})

// 書籍一覧取得
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const books = await prisma.book.findMany({
      where: {
        readingLogs: {
          some: {
            userId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        materials: {
          where: { status: 'active' },
        },
        readingLogs: {
          where: {
            userId,
          },
          select: {
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    return NextResponse.json({ books })
  } catch (error) {
    console.error('Get books error:', error)
    return NextResponse.json({ error: '書籍一覧の取得に失敗しました' }, { status: 500 })
  }
}

// 書籍登録
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request)
    if (userId instanceof NextResponse) return userId

    const body = await request.json()
    const { title, author, isbn13, publisher, publishedDate, coverImageUrl } =
      createBookSchema.parse(body)

    // 書籍作成（検索結果の詳細情報も保存）
    // 注意: 書籍登録は非勉強コースの機能のため、冊数制限は適用しない
    // 冊数制限は勉強コース（Material/StudyItem/OCRAsset）の登録時にのみ適用される
    
    // 既存のBookを確認（ISBN13で重複チェック）
    let book
    if (isbn13 && isbn13.trim() !== '') {
      const existingBook = await prisma.book.findUnique({
        where: { isbn13 },
      })
      if (existingBook) {
        book = existingBook
      }
    }

    // Bookが存在しない場合は新規作成
    if (!book) {
      book = await prisma.book.create({
        data: {
          userId: null, // Legacyフィールドはnull（後で削除予定）
          title,
          author: author && author.trim() !== '' ? author : undefined,
          isbn13: isbn13 && isbn13.trim() !== '' ? isbn13 : undefined,
          publisher: publisher && publisher.trim() !== '' ? publisher : undefined,
          publishedDate: publishedDate ? new Date(publishedDate) : undefined,
          coverImageUrl:
            coverImageUrl && coverImageUrl.trim() !== '' ? coverImageUrl : undefined,
        },
      })
    }

    // UserBookを作成（本棚に追加）
    // 既に存在する場合はスキップ
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId: book.id,
        },
      },
    })

    let userBook
    if (!existingUserBook) {
      userBook = await prisma.userBook.create({
        data: {
          userId,
          bookId: book.id,
          status: 'TSUNDOKU', // デフォルトは積読
        },
        include: {
          book: true,
        },
      })
    } else {
      userBook = existingUserBook
    }

    return NextResponse.json({ book, userBook }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: '入力が正しくありません', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create book error:', error)
    // エラーの詳細を返す（開発環境用）
    const errorMessage =
      error instanceof Error ? error.message : '書籍の登録に失敗しました'
    return NextResponse.json(
      { error: '書籍の登録に失敗しました', details: errorMessage },
      { status: 500 }
    )
  }
}
