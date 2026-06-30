import { NextResponse } from 'next/server'
import { signToken } from '@/lib/server-auth'

/**
 * 认证 API
 * POST /api/auth
 * Body: { password: string }
 * Response: { success: boolean, token?: string, error?: string }
 * Token 使用 HMAC-SHA256 签名，防伪造
 */

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    // 从环境变量读取密码，默认 admin123
    const appPassword = process.env.APP_PASSWORD || 'admin123'

    if (password !== appPassword) {
      return NextResponse.json(
        { success: false, error: '密码错误' },
        { status: 401 }
      )
    }

    // 生成带 HMAC-SHA256 签名的 token
    const token = signToken()

    // 创建响应
    const res = NextResponse.json({
      success: true,
      token,
    })

    // 设置 cookie（session cookie，浏览器关闭即清除）
    res.cookies.set('ai-recruiter-token', token, {
      path: '/',
      sameSite: 'strict',
      httpOnly: true,
    })

    return res
  } catch {
    return NextResponse.json(
      { success: false, error: '请求格式错误' },
      { status: 400 }
    )
  }
}
