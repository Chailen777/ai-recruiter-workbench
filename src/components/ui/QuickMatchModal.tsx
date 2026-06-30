'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useDeferredValue } from 'react'
import { useRouter } from 'next/navigation'
import {
  quickMatch,
  quickRecommend,
  quickIgnore,
  quickEliminate,
  quickAbandon,
  quickReset,
  fetchQuickSources,
  fetchQuickPreview,
} from '@/app/actions/match'
import type {
  QuickMatchMode,
  QuickMatchResult,
  QuickMatchItem,
  QuickSourceItem,
  QuickPreviewData,
} from '@/app/actions/match'
import type { MatchDimensionKey, MatchDimension } from '@/lib/matching'
import { DIMS_C2J, DIMS_J2C } from '@/lib/matching'

/* ═══════════════════════════════════════════════
   Helpers — level colors & score circle
   ═══════════════════════════════════════════════ */

function levelCfg(level: string) {
  if (level === '高') return { color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.2)', label: '高匹配' }
  if (level === '中') return { color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)', label: '中匹配' }
  return { color: '#c45c5c', bg: 'rgba(196,92,92,0.10)', border: 'rgba(196,92,92,0.22)', label: '低匹配' }
}

function ScoreDot({ score, level }: { score: number; level: string }) {
  const cfg = levelCfg(level)
  const angle = score * 3.6
  return (
    <div
      style={{
        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${cfg.color} ${angle}deg, rgba(128,128,128,0.05) ${angle}deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 12px ${cfg.color}1a, 0 0 24px ${cfg.color}08`,
      }}
    >
      <div
        style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--ds-color-card, #1e1e2e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(128,128,128,0.08)',
        }}
      >
        <span
          style={{
            fontSize: 14, fontWeight: 900, color: cfg.color, lineHeight: 1,
            textShadow: `0 0 10px ${cfg.color}40`,
          }}
        >
          {score}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   QuickMatchModal
   ═══════════════════════════════════════════════ */

type Phase = 'select' | 'loading' | 'results'

export function QuickMatchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  // ── UI state ──
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [phase, setPhase] = useState<Phase>('select')
  const [mode, setMode] = useState<QuickMatchMode>('candidate-to-job')

  // ── Data state ──
  const [sources, setSources] = useState<QuickSourceItem[]>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const deferredSearch = useDeferredValue(search)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 带 debounce 的搜索输入
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearch(value)
    }, 150)
  }, [])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [result, setResult] = useState<QuickMatchResult | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // track which item is being actioned
  const [activeDims, setActiveDims] = useState<Set<MatchDimensionKey>>(new Set())
  const [previewData, setPreviewData] = useState<QuickPreviewData | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // ── Filtered sources ──
  const filteredSources = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase()
    if (!q) return sources
    return sources.filter(
      (s) => s.name.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q),
    )
  }, [sources, deferredSearch])

  // ── Load sources ──
  const loadSources = useCallback(async () => {
    try {
      const list = await fetchQuickSources(mode)
      setSources(list)
    } catch {
      setSources([])
    }
  }, [mode])

  // ── Load preview for selected item ──
  const loadPreview = useCallback(async (id: number) => {
    setPreviewLoading(true)
    setPreviewData(null)
    try {
      const data = await fetchQuickPreview(mode, id)
      setPreviewData(data)
    } catch {
      setPreviewData(null)
    }
    setPreviewLoading(false)
  }, [mode])

  // ── Run matching ──
  const handleMatch = useCallback(async () => {
    if (!selectedId) return
    setPhase('loading')
    try {
      const dims: MatchDimension[] = (mode === 'candidate-to-job' ? DIMS_C2J : DIMS_J2C)
        .map((d) => ({ key: d.key, enabled: activeDims.has(d.key) }))
      const res = await quickMatch(mode, selectedId, dims)
      setResult(res)
      setPhase('results')
    } catch {
      setPhase('select')
    }
  }, [mode, selectedId, activeDims])

  // ── Toggle dimension ──
  const toggleDim = useCallback((key: MatchDimensionKey) => {
    setActiveDims((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── Recommend (toggle: click again to undo) ──
  const handleRecommend = useCallback(
    async (item: QuickMatchItem, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const key = mode === 'candidate-to-job' ? `r-${item.jobId}` : `r-${item.candidateId}`
      setActionLoading(key)
      try {
        const cid = mode === 'candidate-to-job' ? selectedId! : item.candidateId!
        const jid = mode === 'candidate-to-job' ? item.jobId! : selectedId!
        // 如果已经是已推荐 → 撤销
        if (item.status === '已推荐') {
          await quickReset(cid, jid)
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '' }
            return { ...prev, matches: next }
          })
        } else {
          await quickRecommend(
            cid, jid, item.score,
            JSON.stringify(item.reasons),
            JSON.stringify(item.gaps),
            item.suggestion,
          )
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '已推荐' }
            return { ...prev, matches: next }
          })
        }
      } catch { /* ignore */ }
      setActionLoading(null)
    },
    [mode, selectedId],
  )

  // ── Ignore (toggle: click again to undo) ──
  const handleIgnore = useCallback(
    async (item: QuickMatchItem, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const key = mode === 'candidate-to-job' ? `i-${item.jobId}` : `i-${item.candidateId}`
      setActionLoading(key)
      try {
        const cid = mode === 'candidate-to-job' ? selectedId! : item.candidateId!
        const jid = mode === 'candidate-to-job' ? item.jobId! : selectedId!
        // 如果已经是已拒绝 → 撤销
        if (item.status === '已拒绝') {
          await quickReset(cid, jid)
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '' }
            return { ...prev, matches: next }
          })
        } else {
          await quickIgnore(
            cid, jid, item.score,
            JSON.stringify(item.reasons),
            JSON.stringify(item.gaps),
            item.suggestion,
          )
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '已拒绝' }
            return { ...prev, matches: next }
          })
        }
      } catch { /* ignore */ }
      setActionLoading(null)
    },
    [mode, selectedId],
  )

  // ── Eliminate (toggle) ──
  const handleEliminate = useCallback(
    async (item: QuickMatchItem, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const key = mode === 'candidate-to-job' ? `e-${item.jobId}` : `e-${item.candidateId}`
      setActionLoading(key)
      try {
        const cid = mode === 'candidate-to-job' ? selectedId! : item.candidateId!
        const jid = mode === 'candidate-to-job' ? item.jobId! : selectedId!
        if (item.status === '已淘汰') {
          await quickReset(cid, jid)
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '' }
            return { ...prev, matches: next }
          })
        } else {
          await quickEliminate(
            cid, jid, item.score,
            JSON.stringify(item.reasons),
            JSON.stringify(item.gaps),
            item.suggestion,
          )
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '已淘汰' }
            return { ...prev, matches: next }
          })
        }
      } catch { /* ignore */ }
      setActionLoading(null)
    },
    [mode, selectedId],
  )

  // ── Abandon (toggle) ──
  const handleAbandon = useCallback(
    async (item: QuickMatchItem, idx: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const key = mode === 'candidate-to-job' ? `a-${item.jobId}` : `a-${item.candidateId}`
      setActionLoading(key)
      try {
        const cid = mode === 'candidate-to-job' ? selectedId! : item.candidateId!
        const jid = mode === 'candidate-to-job' ? item.jobId! : selectedId!
        if (item.status === '已放弃') {
          await quickReset(cid, jid)
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '' }
            return { ...prev, matches: next }
          })
        } else {
          await quickAbandon(
            cid, jid, item.score,
            JSON.stringify(item.reasons),
            JSON.stringify(item.gaps),
            item.suggestion,
          )
          setResult((prev) => {
            if (!prev) return null
            const next = [...prev.matches]
            if (next[idx]) next[idx] = { ...next[idx], status: '已放弃' }
            return { ...prev, matches: next }
          })
        }
      } catch { /* ignore */ }
      setActionLoading(null)
    },
    [mode, selectedId],
  )

  // ── Close (定义在 goDetail 之前) ──
  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setMounted(false)
      setClosing(false)
      setDropdownOpen(false)
      onClose()
    }, 180)
  }, [onClose])

  // ── Navigate to detail ──
  const goDetail = useCallback(
    (item: QuickMatchItem) => {
      // 人找岗: selected=candidate, items=jobs → detail 跳对应 job 详情
      // 岗找人: selected=job, items=candidates → detail 跳对应 candidate 详情
      if (mode === 'candidate-to-job') {
        router.push(`/jobs?jobId=${item.jobId}`)
      } else {
        router.push(`/candidates?candidateId=${item.candidateId}`)
      }
      handleClose()
    },
    [mode, router, handleClose],
  )

  // ── Animation lifecycle ──
  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      setPhase('select')
      setResult(null)
      setSelectedId(null)
      setSearch('')
      setDropdownOpen(false)
      setActiveDims(new Set())
      setPreviewData(null)
      setPreviewLoading(false)
      loadSources()
      // 自动聚焦搜索框
      requestAnimationFrame(() => requestAnimationFrame(() => searchRef.current?.focus()))
    }
  }, [open, loadSources])

  // ── Keyboard ──
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // 在结果页 → 返回选择；在选择页 → 关闭
        if (phase === 'results') {
          setPhase('select')
          setResult(null)
        } else {
          handleClose()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, phase, handleClose])

  if (!mounted) return null

  /* ── Preview card renderer ── */
  const renderPreviewCard = () => {
    if (!selectedId) return null
    if (previewLoading) {
      return (
        <div className="quick-match-preview quick-match-preview--loading">
          <span className="quick-match-preview-spinner" />
          <span className="quick-match-preview-loading-text">加载详情…</span>
        </div>
      )
    }
    if (!previewData) return null

    const isCandidate = previewData.mode === 'candidate-to-job'

    // Build key-value rows
    const rows: Array<{ label: string; value: string | number | null | undefined; icon: string }> = isCandidate
      ? [
          { icon: '💼', label: '当前职位', value: previewData.currentTitle },
          { icon: '🏢', label: '当前公司', value: previewData.currentCompany },
          { icon: '📍', label: '城市',     value: previewData.city },
          { icon: '🎂', label: '年龄',     value: previewData.age != null ? `${previewData.age} 岁` : null },
          { icon: '🎓', label: '学历',     value: previewData.education },
          { icon: '⏱️', label: '工作年限', value: previewData.yearsOfWork != null ? `${previewData.yearsOfWork} 年` : null },
          { icon: '💰', label: '薪资期望', value: previewData.expectedSalary },
          { icon: '🔍', label: '求职状态', value: previewData.jobSearchStatus },
        ]
      : [
          { icon: '🏢', label: '公司',     value: previewData.companyName },
          { icon: '📍', label: '城市',     value: previewData.jobCity },
          { icon: '💰', label: '薪资',     value: previewData.salaryRange },
          { icon: '🎓', label: '学历要求', value: previewData.educationRequirement },
          { icon: '🎂', label: '年龄要求', value: previewData.ageRequirement },
          { icon: '⏱️', label: '经验要求', value: previewData.experienceRequirement },
          { icon: '🏷️', label: '职位类别', value: previewData.jobCategory },
          { icon: '👥', label: '招聘人数', value: previewData.headcount != null ? `${previewData.headcount} 人` : null },
        ]

    const validRows = rows.filter((r) => r.value != null && r.value !== '' && r.value !== '—')

    // Skills/keywords
    const skills = isCandidate
      ? previewData.skillTags?.split(/[，,、\s]+/).filter(Boolean) ?? []
      : previewData.skillKeywords?.split(/[，,、\s]+/).filter(Boolean) ?? []

    const detailHref = isCandidate
      ? `/candidates?candidateId=${previewData.id}`
      : `/jobs?jobId=${previewData.id}`

    const displayName = isCandidate
      ? previewData.name
      : previewData.jobTitle

    return (
      <div className="quick-match-preview">
        {/* Preview header */}
        <div className="quick-match-preview-header">
          <div className="quick-match-preview-avatar">
            {isCandidate ? '👤' : '💼'}
          </div>
          <div className="quick-match-preview-title-block">
            <span className="quick-match-preview-name">{displayName}</span>
            <span className="quick-match-preview-subtitle">
              {isCandidate
                ? [previewData.currentTitle, previewData.currentCompany].filter(Boolean).join(' · ')
                : previewData.companyName}
            </span>
          </div>
          <a
            href={detailHref}
            className="quick-match-preview-link"
            onClick={(e) => { e.preventDefault(); router.push(detailHref); handleClose() }}
          >
            详情页 →
          </a>
        </div>

        {/* Info grid */}
        {validRows.length > 0 && (
          <div className="quick-match-preview-grid">
            {validRows.map((r) => (
              <div key={r.label} className="quick-match-preview-cell">
                <span className="quick-match-preview-cell-icon">{r.icon}</span>
                <span className="quick-match-preview-cell-label">{r.label}</span>
                <span className="quick-match-preview-cell-value">{String(r.value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Skill tags */}
        {skills.length > 0 && (
          <div className="quick-match-preview-skills">
            <span className="quick-match-preview-skills-label">💡 {isCandidate ? '技能标签' : '技能要求'}</span>
            <div className="quick-match-preview-skill-tags">
              {skills.slice(0, 8).map((s, si) => (
                <span key={si} className="quick-match-preview-skill-tag">{s}</span>
              ))}
              {skills.length > 8 && (
                <span className="quick-match-preview-skill-more">+{skills.length - 8}</span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSelectPhase = () => (
    <>
      {/* Mode tabs */}
      <div className="quick-match-tabs">
        <button
          className={`quick-match-tab${mode === 'candidate-to-job' ? ' is-active' : ''}`}
          onClick={() => { setMode('candidate-to-job'); setActiveDims(new Set()); setPreviewData(null); setSelectedId(null) }}
        >
          👤 人找岗
        </button>
        <button
          className={`quick-match-tab${mode === 'job-to-candidate' ? ' is-active' : ''}`}
          onClick={() => { setMode('job-to-candidate'); setActiveDims(new Set()); setPreviewData(null); setSelectedId(null) }}
        >
          💼 岗找人
        </button>
      </div>

      {/* Search + dropdown */}
      <div className="quick-match-selector">
        <div className="quick-match-input-wrap">
          <input
            ref={searchRef}
            type="text"
            className="quick-match-input"
            placeholder={mode === 'candidate-to-job' ? '🔍 搜索候选人姓名或职位…' : '🔍 搜索公司或岗位名称…'}
            value={searchInput}
            onChange={(e) => { handleSearchChange(e.target.value); setDropdownOpen(true) }}
            onFocus={() => setDropdownOpen(true)}
          />
          {searchInput && (
            <button className="quick-match-input-clear" onClick={() => { setSearchInput(''); setSearch(''); setSelectedId(null); setPreviewData(null) }}>
              ✕
            </button>
          )}
        </div>

        {dropdownOpen && filteredSources.length > 0 && (
          <div className="quick-match-dropdown">
            {filteredSources.slice(0, 25).map((s) => (
              <button
                key={s.id}
                className={`quick-match-dropdown-item${selectedId === s.id ? ' is-selected' : ''}`}
                onClick={() => {
                  setSelectedId(s.id)
                  setSearch(s.name)
                  setDropdownOpen(false)
                  loadPreview(s.id)
                }}
              >
                <span className="quick-match-dropdown-name">{s.name}</span>
                <span className="quick-match-dropdown-sub">{s.subtitle}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Preview card — auto-shown after selection, replaces simple hint */}
      {renderPreviewCard()}

      {/* ── Dimension filters ── */}
      <div className="quick-match-dims">
        <span className="quick-match-dims-label">📐 匹配维度</span>
        <div className="quick-match-dims-pills">
          {(mode === 'candidate-to-job' ? DIMS_C2J : DIMS_J2C).map((dim) => {
            const isActive = activeDims.has(dim.key)
            return (
              <button
                key={dim.key}
                className={`quick-match-dim-pill${isActive ? ' is-active' : ''}`}
                onClick={() => toggleDim(dim.key)}
                type="button"
              >
                <span className="quick-match-dim-pill-icon">{dim.icon}</span>
                <span className="quick-match-dim-pill-label">{dim.label}</span>
                {isActive && <span className="quick-match-dim-pill-check">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Action button */}
      <button
        className="quick-match-start"
        disabled={!selectedId}
        onClick={handleMatch}
      >
        ⚡ 开始匹配
      </button>
    </>
  )

  const renderResultsPhase = () => {
    if (!result) return null

    // Stats
    const high = result.matches.filter((m) => m.level === '高').length
    const mid = result.matches.filter((m) => m.level === '中').length
    const low = result.matches.filter((m) => m.level === '低').length

    return (
      <>
        {/* Results header */}
        <div className="quick-match-results-top">
          <button
            className="quick-match-back"
            onClick={() => { setPhase('select'); setResult(null) }}
          >
            ← 重新选择
          </button>
          <div className="quick-match-results-source">
            {result.sourceName}
          </div>
          <span className="quick-match-results-count">{result.matchCount} 项匹配</span>
        </div>

        {/* Stats bar */}
        <div className="quick-match-stats">
          <span className="quick-match-stat" data-lvl="high">高 {high}</span>
          <span className="quick-match-stat" data-lvl="mid">中 {mid}</span>
          <span className="quick-match-stat" data-lvl="low">低 {low}</span>
        </div>

        {/* Match list */}
        <div className="quick-match-list">
          {result.matches.map((item, i) => {
            const cfg = levelCfg(item.level)
            const itemKey = mode === 'candidate-to-job'
              ? `j-${item.jobId}`
              : `c-${item.candidateId}`

            const title = mode === 'candidate-to-job'
              ? item.jobTitle ?? '—'
              : item.candidateName ?? '—'

            const metaParts = mode === 'candidate-to-job'
              ? [item.companyName, item.jobCity, item.salaryRange].filter(Boolean)
              : [item.candidateTitle, item.candidateCompany, item.candidateCity].filter(Boolean)

            const statusLabel = item.status === '已推荐' ? '已推荐'
              : item.status === '已拒绝' ? '已拒绝'
              : item.status === '已淘汰' ? '已淘汰'
              : item.status === '已放弃' ? '已放弃'
              : item.status === '已跟进' ? '已跟进'
              : item.status === '已成交' ? '已成交'
              : '未推荐'

            const badgeClass = item.status === '已拒绝' ? ' is-rejected'
              : item.status === '已推荐' ? ' is-recommended'
              : item.status === '已淘汰' ? ' is-eliminated'
              : item.status === '已放弃' ? ' is-abandoned'
              : ' is-default'

            const isActing = actionLoading != null

            const hasAnyStatus = item.status === '已推荐' || item.status === '已拒绝'
              || item.status === '已淘汰' || item.status === '已放弃'

            return (
              <div
                key={itemKey}
                className="quick-match-card-item"
                data-level={item.level}
              >
                <span className={`quick-match-card-badge${badgeClass}`}>
                  {statusLabel}
                </span>
                {/* Score + info row */}
                <div className="quick-match-card-row">
                  <ScoreDot score={item.score} level={item.level} />

                  <div className="quick-match-card-info">
                    <span className="quick-match-card-title">{title}</span>
                    <span className="quick-match-card-meta">{metaParts.join(' · ')}</span>
                    <span className="quick-match-card-tag" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Reason tags */}
                {item.reasons.length > 0 && (
                  <div className="quick-match-card-reasons">
                    {item.reasons.slice(0, 3).map((r, ri) => (
                      <span key={ri} className="quick-match-reason" style={{ color: cfg.color, background: cfg.bg }}>
                        ✓ {r}
                      </span>
                    ))}
                    {item.reasons.length > 3 && (
                      <span className="quick-match-reason-more">+{item.reasons.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="quick-match-card-actions">
                  <button
                    className={`quick-match-act quick-match-act--rec${item.status === '已推荐' ? ' is-active' : ''}`}
                    disabled={isActing || hasAnyStatus && item.status !== '已推荐'}
                    onClick={(e) => handleRecommend(item, i, e)}
                  >
                    {item.status === '已推荐' ? '✓ 已推荐' : '👍 推荐'}
                  </button>
                  <button
                    className={`quick-match-act quick-match-act--ign${item.status === '已拒绝' ? ' is-active' : ''}`}
                    disabled={isActing || hasAnyStatus && item.status !== '已拒绝'}
                    onClick={(e) => handleIgnore(item, i, e)}
                  >
                    {item.status === '已拒绝' ? '✗ 已拒绝' : '👎 拒绝'}
                  </button>
                  <button
                    className={`quick-match-act quick-match-act--elm${item.status === '已淘汰' ? ' is-active' : ''}`}
                    disabled={isActing || hasAnyStatus && item.status !== '已淘汰'}
                    onClick={(e) => handleEliminate(item, i, e)}
                  >
                    {item.status === '已淘汰' ? '✗ 已淘汰' : '🚫 淘汰'}
                  </button>
                  <button
                    className={`quick-match-act quick-match-act--abd${item.status === '已放弃' ? ' is-active' : ''}`}
                    disabled={isActing || hasAnyStatus && item.status !== '已放弃'}
                    onClick={(e) => handleAbandon(item, i, e)}
                  >
                    {item.status === '已放弃' ? '✗ 已放弃' : '🏳 放弃'}
                  </button>
                  <button
                    className="quick-match-act quick-match-act--det"
                    onClick={() => goDetail(item)}
                  >
                    详情 →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <div
      className={`quick-match-backdrop${closing ? ' is-closing' : ''}`}
    >
      <div className={`quick-match-modal${closing ? ' is-closing' : ''}`}>
        {/* ── Header ── */}
        <div className="quick-match-header">
          <span className="quick-match-header-title">⚡ 快速匹配</span>
          <button
            className="quick-match-close"
            onClick={handleClose}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="quick-match-body">
          {phase === 'select' && renderSelectPhase()}
          {phase === 'loading' && (
            <div className="quick-match-loading">
              <span className="quick-match-spinner" />
              <span>正在计算匹配度…</span>
            </div>
          )}
          {phase === 'results' && renderResultsPhase()}
        </div>
      </div>
    </div>
  )
}
