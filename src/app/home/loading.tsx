import { DetailPanel, StatCard } from '@/components/ui'
import { formatLongDate } from '@/lib/date'

const skeletonKpis = Array.from({ length: 9 }).map((_, index) => ({
  description: '数据加载中…',
  title: `指标 ${index + 1}`,
  tone: ['blue', 'green', 'orange', 'red'][index % 4] as 'blue' | 'green' | 'orange' | 'red',
}))

export default function HomeLoading() {
  const dateText = formatLongDate()

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="app-eyebrow">AI Headhunter Operations</p>
          <h1>欢迎回来，猎头顾问</h1>
          <p className="muted">{dateText}，正在加载今日数据…</p>
        </div>
        <div className="dashboard-search">
          <input aria-label="全局搜索" disabled placeholder="搜索候选人、岗位、企业" />
          <span className="ui-action-button ui-action-button-secondary" />
        </div>
        <div className="dashboard-user">
          <span className="notification-dot">—</span>
          <span className="avatar">顾</span>
          <div>
            <strong>猎头顾问</strong>
            <p className="muted">专业版</p>
          </div>
        </div>
      </section>

      <section className="dashboard-kpi-grid dashboard-kpi-grid-v2">
        {skeletonKpis.map((item) => (
          <StatCard
            description={item.description}
            key={item.title}
            title={item.title}
            tone={item.tone}
            trend="加载中"
            value="—"
          />
        ))}
      </section>

      <section className="dashboard-analysis-grid">
        <DetailPanel description="近 7 天新增企业、岗位、候选人趋势。" title="业务趋势">
          <div className="trend-chart-skeleton" />
        </DetailPanel>

        <div className="distribution-stack">
          <DetailPanel title="岗位状态分布">
            <div className="donut-row">
              <div className="donut donut-job">
                <strong>—</strong>
                <span>总岗位</span>
              </div>
              <div className="donut-list">
                <p>数据加载中…</p>
              </div>
            </div>
          </DetailPanel>
          <DetailPanel title="候选人来源分布">
            <div className="donut-row">
              <div className="donut donut-candidate">
                <strong>—</strong>
                <span>总人数</span>
              </div>
              <div className="donut-list">
                <p>数据加载中…</p>
              </div>
            </div>
          </DetailPanel>
        </div>
      </section>
    </div>
  )
}
