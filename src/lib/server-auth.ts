/**
 * 服务端认证工具
 * 基于 HMAC-SHA256 签名验证，用于保护所有 Server Actions
 *
 * Token 格式: base64(时间戳:随机数:HMAC签名)
 * - 时间戳：防重放过期
 * - 随机数：保证唯一性
 * - HMAC签名：防伪造
 */

import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'ai-recruiter-token'
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 小时（与 sessionStorage 行为一致）

function getSecret(): string {
  // 使用 APP_PASSWORD 或默认值作为 HMAC 密钥
  return process.env.APP_PASSWORD || 'admin123'
}

/**
 * 从 cookie 中获取并验证 token
 * 返回 true 表示验证通过，false 表示无效
 */
export async function verifyServerToken(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return false

    // 解码 token
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length !== 3) return false

    const [timestampStr, random, signature] = parts
    const timestamp = Number(timestampStr)

    // 检查是否过期
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return false

    // 验证 HMAC 签名
    const secret = getSecret()
    const expectedPayload = `${timestampStr}:${random}`
    const expectedSignature = createHmac('sha256', secret)
      .update(expectedPayload)
      .digest('hex')

    // 使用 timing-safe 比较防止时序攻击
    const sigBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (sigBuffer.length !== expectedBuffer.length) return false

    return timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * 要求认证，未通过则抛出错误
 * 在 Server Action 开头调用
 */
export async function requireServerAuth(): Promise<void> {
  const valid = await verifyServerToken()
  if (!valid) {
    throw new Error('UNAUTHORIZED: 请先登录')
  }
}

/**
 * 生成带 HMAC 签名的 token
 * 由 /api/auth 登录接口调用
 */
export function signToken(): string {
  const secret = getSecret()
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  const payload = `${timestamp}:${random}`
  const signature = createHmac('sha256', secret).update(payload).digest('hex')

  return Buffer.from(`${timestamp}:${random}:${signature}`).toString('base64')
}
