import { NextResponse } from 'next/server'

/**
 * 认证 API
 * POST /api/auth
 * Body: { password: string }
 * Response: { success: boolean, token?: string, error?: string }
 * token 存在 sessionStorage，关闭浏览器即失效
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

    // 生成 token：base64(时间戳 + 随机数)
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 10)
    const token = Buffer.from(`${timestamp}:${random}`).toString('base64')

    // 创建响应
    const res = NextResponse.json({
      success: true,
      token,
    })

    // 设置 cookie（session cookie，浏览器关闭即清除，与 sessionStorage 行为一致）
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
