import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'
import { cookies } from 'next/headers'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // パスワード検証
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // トークン生成
    // JWT_SECRET未設定時はJWT_NOT_CONFIGUREDエラーが発生する可能性あり
    let token: string
    try {
      token = generateToken(user.id)
    } catch (error: any) {
      if (error?.message?.includes('JWT_NOT_CONFIGURED')) {
        return NextResponse.json(
          { error: 'JWT_NOT_CONFIGURED', message: 'JWTの設定が完了していません' },
          { status: 500 }
        )
      }
      throw error // その他のエラーは再スロー
    }

    // クッキーに保存
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30日
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        planType: user.plan, // schema.prismaでは plan フィールド
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '入力が正しくありません' }, { status: 400 })
    }
    console.error('Login error:', error)
    return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
  }
}
