'use client'

import { ActionButton } from '@/components/ui'

export default function HomeError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="app-eyebrow">AI Headhunter Operations</p>
          <h1>数据加载失败</h1>
          <p className="muted">看板数据暂时无法读取，请检查数据库连接后重试。</p>
        </div>
      </section>

      <section className="dashboard-error-state">
        <div className="dashboard-error-card">
          <h2>无法获取看板数据</h2>
          <p>可能是数据库未初始化或连接出现异常。你可以：</p>
          <div className="dashboard-quick-actions dashboard-quick-actions-v2">
            <ActionButton onClick={reset} type="button">
              重新加载
            </ActionButton>
            <ActionButton href="/candidates" variant="secondary">
              前往候选人库
            </ActionButton>
          </div>
        </div>
      </section>
    </div>
  )
}
