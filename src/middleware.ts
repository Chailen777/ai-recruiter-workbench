import { NextRequest, NextResponse } from 'next/server'

/**
 * API 守卫 middleware
 * 拦截所有 /api/* 请求（排除 /api/auth），验证 cookie 中的 token
 * token 格式：base64(时间戳:随机数)，由 /api/auth 登录成功后签发
 */

// 不需要认证的 API 路径
const PUBLIC_API = ['/api/auth']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 只拦截 /api/* 路径
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // 排除公开 API
  if (PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // 从 cookie 读取 token
  const token = request.cookies.get('ai-recruiter-token')?.value

  if (!token) {
    return NextResponse.json(
      { success: false, error: '未登录或会话已过期' },
      { status: 401 }
    )
  }

  // 验证 token 格式：base64 解码后应包含冒号
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    if (!decoded.includes(':')) {
      throw new Error('invalid token')
    }
  } catch {
    return NextResponse.json(
      { success: false, error: '无效的认证凭证' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
