import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logRevenueShareGateDecision } from '@/lib/revenue-share'

/**
 * Snapshot経由の外部リンク遷移（サーバー側リダイレクト）
 * GET /out/snapshot/[snapshotId]?to=<purchaseUrl>
 * 未ログインでも利用可能（snapshotIdのみで計測）
 * 
 * 動作:
 * 1. GateLogを記録（SNAPSHOT_CLICK）
 * 2. purchaseUrlへ302リダイレクト
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  try {
    const { snapshotId } = await params
    const { searchParams } = new URL(request.url)
    const purchaseUrl = searchParams.get('to')

    // purchaseUrlのバリデーション（http/httpsのみ）
    if (!purchaseUrl) {
      return NextResponse.json({ error: 'toパラメータが必要です' }, { status: 400 })
    }

    // 許可されたホストリスト（amazon/rakuten）
    const ALLOWED_HOSTS = [
      'www.amazon.co.jp',
      'amazon.co.jp',
      'www.amazon.com',
      'amazon.com',
      'www.rakuten.co.jp',
      'rakuten.co.jp',
      'books.rakuten.co.jp',
    ]

    try {
      const url = new URL(purchaseUrl)
      
      // プロトコルチェック（http/httpsのみ）
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'toパラメータはhttpまたはhttpsのURLである必要があります' },
          { status: 400 }
        )
      }

      // ホストチェック（許可されたホストのみ）
      const hostname = url.hostname.toLowerCase()
      const isAllowed = ALLOWED_HOSTS.some((allowedHost) => 
        hostname === allowedHost || hostname.endsWith('.' + allowedHost)
      )

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'toパラメータはAmazonまたは楽天のURLである必要があります' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'toパラメータが有効なURLではありません' },
        { status: 400 }
      )
    }

    // Snapshotの存在確認
    const snapshot = await prisma.publishedSnapshot.findUnique({
      where: { id: snapshotId },
      select: {
        id: true,
        ownerUserId: true,
        bookId: true,
        status: true,
        visibility: true,
      },
    })

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshotが見つかりません' }, { status: 404 })
    }

    // PUBLISHEDかつPUBLICのみ計測対象
    if (snapshot.status !== 'PUBLISHED' || snapshot.visibility !== 'PUBLIC') {
      return NextResponse.json({ error: '公開Snapshotのみ計測対象です' }, { status: 403 })
    }

    // 報酬ゲート判定ログ（外部遷移時点で記録）
    // 注意: クリック計測のみ（購入完了は検知できない）
    await logRevenueShareGateDecision({
      userId: snapshot.ownerUserId,
      snapshotId: snapshot.id,
      source: 'SNAPSHOT_CLICK',
      eligible: false, // クリック時点では購入完了が検知できないためfalse
      reason: 'CLICK_RECORDED', // クリック記録済み
      metadata: {
        bookId: snapshot.bookId,
        purchaseUrl,
        clickTime: new Date().toISOString(),
        message: 'Snapshot経由の外部リンク遷移（クリック記録）',
      },
    }).catch(() => {
      // エラーは無視（クリック計測は任意のため）
    })

    // 302リダイレクト
    return NextResponse.redirect(purchaseUrl, 302)
  } catch (error) {
    console.error('Outbound redirect error:', error)
    return NextResponse.json(
      { error: 'リダイレクト処理に失敗しました' },
      { status: 500 }
    )
  }
}
