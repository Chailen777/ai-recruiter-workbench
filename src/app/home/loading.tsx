export default function HomeLoading() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="app-eyebrow">AI Headhunter Operations</p>
          <h1>加载中…</h1>
          <p className="muted">正在获取最新数据</p>
        </div>
      </section>
      <section
        className="dashboard-kpi-grid dashboard-kpi-grid-v2"
        style={{ opacity: 0.4 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#f1f5f9',
              borderRadius: 16,
              height: 100,
            }}
          />
        ))}
      </section>
    </div>
  )
}
