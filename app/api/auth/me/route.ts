import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const userId = await getCurrentUser()
  if (!userId) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      plan: true, // schema.prismaでは plan フィールド
      affiliatePlanType: true,
    },
  })
  
  // planTypeとして返す（フロントエンドとの互換性のため）
  const userWithPlanType = user ? {
    ...user,
    planType: user.plan,
  } : null

  return NextResponse.json({ user: userWithPlanType })
}
