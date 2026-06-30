/**
 * 客户端认证工具
 * 基于 SessionStorage 存储 token，关闭浏览器即失效，每次打开需重新登录
 */

const AUTH_KEY = 'ai-recruiter-auth'
const LOCK_KEY = 'ai-recruiter-locked'

type AuthData = {
  token: string
}

/** 检查是否已登录（客户端） */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return true // SSR 时默认通过，避免闪烁

  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    if (!raw) return false

    return true
  } catch {
    return false
  }
}

/** 登录：验证密码并存储 token */
export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    const data = await res.json()

    if (!data.success) {
      return { success: false, error: data.error || '登录失败' }
    }

    const authData: AuthData = {
      token: data.token,
    }

    sessionStorage.setItem(AUTH_KEY, JSON.stringify(authData))

    return { success: true }
  } catch {
    return { success: false, error: '网络错误，请检查服务是否运行' }
  }
}

/** 登出：清除 token（sessionStorage + cookie） */
export function logout(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(AUTH_KEY)
  sessionStorage.removeItem(LOCK_KEY)
  // 清除 cookie：设置过期时间为过去
  document.cookie = 'ai-recruiter-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

/* ── 锁屏功能 ── */

/** 检查是否处于锁屏状态 */
export function isLocked(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(LOCK_KEY) === '1'
  } catch {
    return false
  }
}

/** 锁屏：设置锁屏标记 */
export function lockScreen(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(LOCK_KEY, '1')
  } catch { /* ignore */ }
}

/** 解锁：清除锁屏标记 */
export function unlockScreen(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(LOCK_KEY)
  } catch { /* ignore */ }
}
