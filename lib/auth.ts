import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

/**
 * JWT_SECRETの遅延初期化（モジュール内キャッシュ）
 * import時にprocess.env.JWT_SECRETをチェックしない（ビルド時エラー回避）
 */
let cachedJwtSecret: string | null = null

/**
 * JWT_SECRETを取得（遅延初期化）
 * 実行時に初めてprocess.env.JWT_SECRETを要求する
 */
function getJwtSecret(): string {
  if (cachedJwtSecret) {
    return cachedJwtSecret
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_NOT_CONFIGURED: JWT_SECRET environment variable is required')
  }

  cachedJwtSecret = secret
  return cachedJwtSecret
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '30d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as unknown as { userId: string }
    return decoded
  } catch {
    return null
  }
}
