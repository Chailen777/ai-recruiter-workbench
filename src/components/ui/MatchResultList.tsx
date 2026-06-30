'use client'

import Link from 'next/link'
import { useState } from 'react'

/* ─── Types ─── */

type MatchCandidate = {
  id?: number
  name?: string | null
  currentTitle?: string | null
  city?: string | null
  education?: string | null
  yearsOfWork?: number | null
  expectedSalary?: string | null
  skillTags?: string | null
  currentCompany?: string | null
}

type MatchJob = {
  id: number
  companyName: string
  title: string
  city?: string | null
  salaryRange?: string | null
  status: string
}

export type CandidateMatch = {
  score: number
  level: '高' | '中' | '低'
  reasons: string[]
  gaps: string[]
  suggestion: string
  candidate: MatchCandidate
  /** 匹配状态：未推荐 / 已推荐 / 已拒绝 / 已淘汰 / 已放弃 */
  status: string
  /** 关联的候选人 ID（用于操作） */
  candidateId: number
  /** 关联的岗位 ID（用于操作） */
  jobId: number
}

export type JobMatch = {
  score: number
  level: '高' | '中' | '低'
  reasons: string[]
  gaps: string[]
  suggestion: string
  job: MatchJob
  /** 匹配状态：未推荐 / 已推荐 / 已拒绝 / 已淘汰 / 已放弃 */
  status: string
  /** 关联的候选人 ID（用于操作） */
  candidateId: number
  /** 关联的岗位 ID（用于操作） */
  jobId: number
}

const PAGE_SIZE = 8

/* ─── Level helpers ─── */

function levelConfig(level: string) {
  if (level === '高') return {
    color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)',
    ring: 'rgba(22,163,74,0.15)', label: '高匹配',
  }
  if (level === '中') return {
    color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)',
    ring: 'rgba(217,119,6,0.15)', label: '中匹配',
  }
  return {
    color: '#c45c5c', bg: 'rgba(196,92,92,0.10)', border: 'rgba(196,92,92,0.22)',
    ring: 'rgba(196,92,92,0.15)', label: '低匹配',
  }
}

/* ─── Score Circle ─── */
function ScoreCircle({ score, level }: { score: number; level: string }) {
  const cfg = levelConfig(level)
  const angle = (score * 3.6).toFixed(1)
  return (
    <div
      className="match-score-circle"
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: `conic-gradient(${cfg.color} ${angle}deg, rgba(128,128,128,0.05) ${angle}deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        boxShadow: `0 0 12px ${cfg.color}1a, 0 0 24px ${cfg.color}08`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--ds-color-card, #1e1e2e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          lineHeight: 1,
          border: '1px solid rgba(128,128,128,0.08)',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 900, color: cfg.color, textShadow: `0 0 10px ${cfg.color}40` }}>{score}</span>
        <span style={{ fontSize: '8px', color: 'var(--ds-color-text-muted)', fontWeight: 600, opacity: 0.6 }}>分</span>
      </div>
    </div>
  )
}

/* ─── Status helpers ─── */

function statusBadgeClass(status: string) {
  if (status === '已推荐') return ' is-recommended'
  if (status === '已拒绝') return ' is-rejected'
  if (status === '已淘汰') return ' is-eliminated'
  if (status === '已放弃') return ' is-abandoned'
  return ' is-default'
}

function hasAnyStatus(status: string) {
  return status === '已推荐' || status === '已拒绝' || status === '已淘汰' || status === '已放弃'
}

/* ─── Single Match Card ─── */
function MatchCard({
  m,
  mode,
  actionFields,
  actions,
}: {
  m: CandidateMatch | JobMatch
  mode: 'candidates' | 'jobs'
  actionFields: React.ReactNode
  actions?: {
    recommend: (formData: FormData) => void
    reject: (formData: FormData) => void
    eliminate: (formData: FormData) => void
    abandon: (formData: FormData) => void
    reset: (formData: FormData) => void
  }
}) {
  const isCandidate = mode === 'candidates'
  const item = isCandidate ? (m as CandidateMatch).candidate : (m as JobMatch).job
  const cfg = levelConfig(m.level)
  const href = isCandidate
    ? `/candidates?candidateId=${(item as MatchCandidate).id}`
    : `/jobs?jobId=${(item as MatchJob).id}`

  const title = isCandidate
    ? ((item as MatchCandidate).name || '未知候选人')
    : (item as MatchJob).title

  const subtitleParts = isCandidate
    ? [
        (item as MatchCandidate).currentTitle,
        (item as MatchCandidate).currentCompany,
        (item as MatchCandidate).city,
      ].filter(Boolean)
    : [
        (item as MatchJob).companyName,
        (item as MatchJob).city,
        (item as MatchJob).salaryRange,
      ].filter(Boolean)

  return (
    <article className="match-result-card" data-level={m.level} style={{ position: 'relative' }}>
      {/* Corner status badge */}
      <span className={`quick-match-card-badge${statusBadgeClass(m.status)}`}>
        {m.status}
      </span>

      {/* ── Top row: Score + Title row ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Score circle */}
        <ScoreCircle score={m.score} level={m.level} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2, paddingRight: 72 }}>
          {/* Title as link */}
          <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h4
              className="match-card-name"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </h4>
          </Link>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--ds-color-text-muted)',
              lineHeight: 1.35,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitleParts.join(' · ')}
          </p>

          {/* Level tag */}
          <span
            style={{
              display: 'inline-block',
              marginTop: 5,
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: cfg.color,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              padding: '1px 8px',
              borderRadius: 4,
              letterSpacing: '0.03em',
            }}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      {/* ── Reason tags ── */}
      {m.reasons.length > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--ds-color-border, rgba(128,128,128,0.12))',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 5,
          }}
        >
          {m.reasons.slice(0, 4).map((r, ri) => (
            <span
              key={ri}
              style={{
                fontSize: '0.6875rem',
                color: cfg.color,
                background: cfg.bg,
                padding: '2px 8px',
                borderRadius: 4,
                border: `1px solid ${cfg.border}`,
                whiteSpace: 'nowrap',
                lineHeight: 1.4,
              }}
            >
              ✓ {r}
            </span>
          ))}
          {m.reasons.length > 4 && (
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--ds-color-text-muted)',
                padding: '2px 6px',
                alignSelf: 'center',
              }}
            >
              +{m.reasons.length - 4}
            </span>
          )}
        </div>
      )}

      {/* ── Suggestion ── */}
      <div
        style={{
          marginTop: 8,
          fontSize: '0.75rem',
          color: 'var(--ds-color-text-secondary)',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            borderRadius: 3,
            background: cfg.bg,
            color: cfg.color,
            fontSize: '0.625rem',
            flexShrink: 0,
            fontWeight: 800,
          }}
        >
          i
        </span>
        {m.suggestion || '—'}
      </div>

      {/* ── Action buttons ── */}
      {actions && (
        <div className="quick-match-card-actions">
          {/* 推荐 */}
          {m.status === '已推荐' ? (
            <form action={actions.reset}>
              {actionFields}
              <button className="quick-match-act quick-match-act--rec is-active" type="submit">✓ 已推荐</button>
            </form>
          ) : (
            <form action={actions.recommend}>
              {actionFields}
              <button className="quick-match-act quick-match-act--rec" type="submit" disabled={hasAnyStatus(m.status)}>👍 推荐</button>
            </form>
          )}
          {/* 拒绝 */}
          {m.status === '已拒绝' ? (
            <form action={actions.reset}>
              {actionFields}
              <button className="quick-match-act quick-match-act--ign is-active" type="submit">✗ 已拒绝</button>
            </form>
          ) : (
            <form action={actions.reject}>
              {actionFields}
              <button className="quick-match-act quick-match-act--ign" type="submit" disabled={hasAnyStatus(m.status)}>👎 拒绝</button>
            </form>
          )}
          {/* 淘汰 */}
          {m.status === '已淘汰' ? (
            <form action={actions.reset}>
              {actionFields}
              <button className="quick-match-act quick-match-act--elm is-active" type="submit">✗ 已淘汰</button>
            </form>
          ) : (
            <form action={actions.eliminate}>
              {actionFields}
              <button className="quick-match-act quick-match-act--elm" type="submit" disabled={hasAnyStatus(m.status)}>🚫 淘汰</button>
            </form>
          )}
          {/* 放弃 */}
          {m.status === '已放弃' ? (
            <form action={actions.reset}>
              {actionFields}
              <button className="quick-match-act quick-match-act--abd is-active" type="submit">✗ 已放弃</button>
            </form>
          ) : (
            <form action={actions.abandon}>
              {actionFields}
              <button className="quick-match-act quick-match-act--abd" type="submit" disabled={hasAnyStatus(m.status)}>🏳 放弃</button>
            </form>
          )}
        </div>
      )}
    </article>
  )
}

/* ════════════ Main Component ════════════ */
export function MatchResultList({
  mode,
  matches,
  matchActions,
}: {
  mode: 'candidates' | 'jobs'
  matches: (CandidateMatch | JobMatch)[]
  matchActions?: {
    recommend: (formData: FormData) => void
    reject: (formData: FormData) => void
    eliminate: (formData: FormData) => void
    abandon: (formData: FormData) => void
    reset: (formData: FormData) => void
  }
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(matches.length / PAGE_SIZE)
  const currentPage = Math.max(1, Math.min(page, totalPages || 1))
  const start = (currentPage - 1) * PAGE_SIZE
  const pageMatches = matches.slice(start, start + PAGE_SIZE)

  if (matches.length === 0) {
    return (
      <div className="match-empty">
        <div className="match-empty-icon">🔍</div>
        <p>{mode === 'candidates' ? '暂无可匹配的候选人' : '暂无可匹配的岗位'}</p>
        <span>选择一个项目后自动计算匹配度</span>
      </div>
    )
  }

  // Stats summary
  const highCount = matches.filter((m) => m.level === '高').length
  const midCount = matches.filter((m) => m.level === '中').length
  const lowCount = matches.filter((m) => m.level === '低').length

  return (
    <div className="match-result-panel">
      {/* ── Panel Header ── */}
      <header className="match-header">
        <div className="match-header-top">
          <h3 className="match-title">
            {mode === 'candidates' ? '候选人匹配结果' : '岗位匹配结果'}
          </h3>
          <span className="match-count-badge">{matches.length}</span>
        </div>

        {/* Level distribution bars */}
        <div className="match-stats-row">
          <div className="match-stat-item" data-level="high">
            <span className="match-stat-dot" />
            高匹配 <b>{highCount}</b>
          </div>
          <div className="match-stat-item" data-level="mid">
            <span className="match-stat-dot" />
            中匹配 <b>{midCount}</b>
          </div>
          <div className="match-stat-item" data-level="low">
            <span className="match-stat-dot" />
            低匹配 <b>{lowCount}</b>
          </div>
        </div>
      </header>

      {/* ── Match Cards ── */}
      <div className="match-card-list">
        {pageMatches.map((m, _i) => {
          const fields = (
            <>
              <input type="hidden" name="candidateId" value={m.candidateId} />
              <input type="hidden" name="jobId" value={m.jobId} />
              <input type="hidden" name="score" value={m.score} />
            </>
          )
          return (
            <MatchCard
              key={`${mode}-${m.candidateId}-${m.jobId}`}
              m={m}
              mode={mode}
              actionFields={fields}
              actions={matchActions}
            />
          )
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <footer className="match-pagination">
          <button
            className="match-page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← 上一页
          </button>
          <span className="match-page-info">
            {currentPage} / {totalPages}
          </span>
          <button
            className="match-page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页 →
          </button>
        </footer>
      )}
    </div>
  )
}
