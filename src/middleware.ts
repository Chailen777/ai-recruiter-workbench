import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

/**
 * API 守卫 middleware
 * 拦截所有 /api/* 请求（排除 /api/auth），验证 cookie 中的 HMAC 签名 token
 */

// 不需要认证的 API 路径
const PUBLIC_API = ['/api/auth']

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

function getSecret(): string {
  return process.env.APP_PASSWORD || 'admin123'
}

function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length !== 3) return false

    const [timestampStr, random, signature] = parts
    const timestamp = Number(timestampStr)

    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) return false

    const secret = getSecret()
    const payload = `${timestampStr}:${random}`
    const expected = createHmac('sha256', secret).update(payload).digest('hex')

    return signature === expected
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('ai-recruiter-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json(
      { success: false, error: '未登录或会话已过期' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
