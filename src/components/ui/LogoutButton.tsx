'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { logout } from '@/lib/auth'

/**
 * 退出登录按钮
 * 用于首页看板右上角，点击后清除 token 并跳转登录页
 */
export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleLogout() {
    setLoading(true)
    logout()
    router.push('/login')
  }

  return (
    <button
      className="dashboard-logout-btn"
      disabled={loading}
      onClick={handleLogout}
      title="退出登录"
      type="button"
    >
      {loading ? '退出中…' : '🚪 退出登录'}
    </button>
  )
}
