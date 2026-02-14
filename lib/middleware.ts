import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  return decoded.userId
}

export async function requireAuth(request: NextRequest) {
  const userId = await getCurrentUser()
  if (!userId) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  return userId
}
