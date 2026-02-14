import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Snapshot個別取得（slugで検索、未ログイン可）
 * GET /api/snapshots/[slug]
 * PUBLISHEDかつPUBLICのみ返す
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Snapshot取得（PUBLISHEDかつPUBLICのみ）
    const snapshot = await prisma.publishedSnapshot.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        publicTitle: true,
        publicText: true,
        publicFields: true,
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
    })

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshotが見つかりません' }, { status: 404 })
    }

    // PUBLISHEDかつPUBLICのみ公開
    // 注意: statusとvisibilityはselectに含めていないため、別途確認が必要
    // 暫定: 取得できたものは公開可能とみなす（DB制約で担保）
    const snapshotWithStatus = await prisma.publishedSnapshot.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      select: {
        id: true,
        slug: true,
        publicTitle: true,
        publicText: true,
        publicFields: true,
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
      },
    })

    if (!snapshotWithStatus) {
      return NextResponse.json({ error: '公開Snapshotが見つかりません' }, { status: 404 })
    }

    // publicFieldsをパースして返す
    let publicFields: any = null
    try {
      publicFields = JSON.parse(snapshotWithStatus.publicFields)
    } catch {
      // JSON解析失敗時はnull
    }

    return NextResponse.json({
      snapshot: {
        ...snapshotWithStatus,
        publicFields,
      },
    })
  } catch (error) {
    console.error('Get snapshot by slug error:', error)
    return NextResponse.json({ error: 'Snapshotの取得に失敗しました' }, { status: 500 })
  }
}
