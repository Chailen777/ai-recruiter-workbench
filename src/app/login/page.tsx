'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const passwordRef = useRef<HTMLInputElement>(null)

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // 自动聚焦密码输入框
    passwordRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    setError('')

    const result = await login(password)

    if (result.success) {
      router.push('/home')
    } else {
      setError(result.error || '登录失败')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* 背景装饰 */}
      <div className="login-bg-decoration">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
      </div>

      {/* 登录卡片 */}
      <div className="login-card">
        {/* Logo 区域 */}
        <div className="login-logo">
          <img
            alt="Chailen 柴伦世家"
            className="login-logo-img"
            src="/chailen-logo.png"
          />
          <div className="login-logo-text">
            <strong>AI超级猎头工作台</strong>
            <small>V0.2 · 数据安全登录</small>
          </div>
        </div>

        {/* 表单 */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label" htmlFor="password">
              🔒 访问密码
            </label>
            <div className="login-input-wrapper">
              <input
                ref={passwordRef}
                className="login-input"
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入访问密码"
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              '进入工作台'
            )}
          </button>
        </form>

        {/* 底部提示 */}
        <div className="login-hint">
          <span>🔒 您的数据受到密码保护，请妥善保管访问凭证</span>
        </div>
      </div>
    </div>
  )
}
