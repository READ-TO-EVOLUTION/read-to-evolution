import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 公開Snapshot一覧取得
 * GET /api/snapshots/public?bookId=...&limit=20&offset=0
 * 未ログインでも閲覧可能（PUBLISHEDのみ）
 * 
 * 注意: user.emailは絶対にselectしない（PII除外）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // ページングパラメータのパース（デフォルト値）
    const limit = limitParam ? parseInt(limitParam, 10) : 20
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // バリデーション
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'limitは1〜100の範囲で指定してください' }, { status: 400 })
    }
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'offsetは0以上の整数で指定してください' }, { status: 400 })
    }

    // 公開Snapshotの取得条件（PUBLISHEDのみ）
    const where: any = {
      status: 'PUBLISHED',
      visibility: 'PUBLIC', // PUBLICのみ外部公開
    }
    if (bookId) {
      where.bookId = bookId
    }

    // 総件数を取得（ページング用）
    const total = await prisma.publishedSnapshot.count({
      where,
    })

    // 公開Snapshot一覧取得
    // 注意: user.emailは絶対にselectしない（PII除外）
    const snapshots = await prisma.publishedSnapshot.findMany({
      where,
      select: {
        id: true,
        slug: true,
        publicTitle: true,
        publicText: true,
        publicFields: true, // JSON文字列（新フォーマット）
        publishedAt: true,
        createdAt: true,
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn13: true,
          },
        },
        // userは含めない（匿名表示のため）
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // publicFieldsをパースして返す
    const snapshotsWithParsedFields = snapshots.map((snapshot) => {
      let publicFields: any = null
      try {
        publicFields = JSON.parse(snapshot.publicFields)
      } catch {
        // JSON解析失敗時はnull
      }

      return {
        id: snapshot.id,
        slug: snapshot.slug,
        publicTitle: snapshot.publicTitle,
        publicText: snapshot.publicText,
        publicFields,
        publishedAt: snapshot.publishedAt,
        createdAt: snapshot.createdAt,
        book: snapshot.book,
      }
    })

    return NextResponse.json({
      snapshots: snapshotsWithParsedFields,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Get public snapshots error:', error)
    return NextResponse.json({ error: '公開Snapshot一覧の取得に失敗しました' }, { status: 500 })
  }
}
