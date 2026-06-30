'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'

type SearchKind =
  | 'candidate'
  | 'job'
  | 'company'
  | 'knowledge'
  | 'school'
  | 'chart'
  | 'info'
  | 'contact'
  | 'project'
  | 'note'

type SearchResult = {
  href: string
  id: number
  kind: SearchKind
  subtitle: string
  title: string
}

const kindLabel: Record<SearchKind, string> = {
  candidate: '候选人',
  job: '岗位',
  company: '企业',
  knowledge: '知识库',
  school: '学校库',
  chart: '图表库',
  info: '信息库',
  contact: '人脉库',
  project: '项目库',
  note: '笔记库',
}

const kindColor: Record<SearchKind, string> = {
  candidate: '#3b82f6',
  job: '#f59e0b',
  company: '#10b981',
  knowledge: '#7c3aed',
  school: '#db2777',
  chart: '#0891b2',
  info: '#ea580c',
  contact: '#059669',
  project: '#2563eb',
  note: '#6b7280',
}

/* ────────────────────────────────────────────
   Command Palette 弹出式全局搜索
   通过 ⌘K / Ctrl+K 或 / 快捷键触发
   ──────────────────────────────────────────── */
export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 打开时聚焦输入框并重置
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIndex(-1)
      setClosing(false)
      // 延迟聚焦让入场动画先跑
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      })
    }
  }, [open])

  /* ── Search debounce ── */
  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      const trimmed = query.trim()
      if (trimmed.length < 2) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
        setActiveIndex(-1)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query, open])

  /* ── Close with animation ── */
  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 200)
  }, [onClose])

  /* ── Select a result ── */
  function select(result: SearchResult) {
    handleClose()
    setTimeout(() => {
      if (result.href !== '#') {
        router.push(result.href)
      }
    }, 220)
  }

  /* ── Keyboard ── */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleClose()
      return
    }

    if (!results.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      select(results[activeIndex])
    }
  }

  if (!open) return null

  const hasQuery = query.trim().length > 0

  return (
    <div className={`gp-backdrop${closing ? ' is-closing' : ''}`}>
      {/* Backdrop click area — 整个遮罩层 */}
      <div className="gp-backdrop-area" onClick={handleClose} />

      {/* ── 命令面板主体 ── */}
      <div className={`gp-panel${closing ? ' is-closing' : ''}`}>
        {/* 搜索输入行 */}
        <div className="gp-input-row">
          <svg
            aria-hidden="true"
            className="gp-search-icon"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5L21 21" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <input
            ref={inputRef}
            aria-label="全局搜索"
            placeholder="搜索企业、岗位、候选人…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
          />

          {/* 关闭按钮 */}
          <button
            className="gp-close-btn"
            onClick={handleClose}
            aria-label="关闭搜索"
            type="button"
          >
            <kbd>ESC</kbd>
          </button>
        </div>

        {/* ── 结果区域 ── */}
        <div className="gp-results">
          {/* 无查询时 → 快捷键提示 */}
          {!hasQuery && (
            <div className="gp-hints">
              <div className="gp-hint-item">
                <kbd className="gp-hint-key">↑↓</kbd>
                <span>导航结果</span>
              </div>
              <div className="gp-hint-item">
                <kbd className="gp-hint-key">↵</kbd>
                <span>打开选中项</span>
              </div>
              <div className="gp-hint-item">
                <kbd className="gp-hint-key">ESC</kbd>
                <span>关闭搜索</span>
              </div>
            </div>
          )}

          {/* 加载中 */}
          {hasQuery && loading && !results.length && (
            <div className="gp-status">
              <span className="gp-spinner" />
              <span>搜索中…</span>
            </div>
          )}

          {/* 无结果 */}
          {hasQuery && !loading && results.length === 0 && (
            <div className="gp-status">
              <span className="gp-empty-icon">🔍</span>
              <span>未找到 &ldquo;{query.trim()}&rdquo; 的匹配结果</span>
            </div>
          )}

          {/* 结果列表 */}
          {results.map((result, index) => (
            <div
              key={`${result.kind}-${result.id}`}
              className={`gp-item ${index === activeIndex ? 'is-active' : ''}`}
              onClick={() => select(result)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {/* 左侧图标 */}
              <span
                className="gp-kind-icon"
                style={{ color: kindColor[result.kind] }}
              >
                {kindIcons[result.kind] ?? '📄'}
              </span>

              {/* 内容 */}
              <div className="gp-item-body">
                <strong>{result.title}</strong>
                <span>{result.subtitle}</span>
              </div>

              {/* 分类标签 */}
              <span
                className="gp-kind-tag"
                style={{
                  color: kindColor[result.kind],
                  background: kindColor[result.kind] + '14',
                }}
              >
                {kindLabel[result.kind]}
              </span>

              {/* 跳转提示 */}
              <span className="gp-item-jump">↵</span>
            </div>
          ))}
        </div>

        {/* ── Footer: 品牌标识 ── */}
        <div className="gp-footer">
          <span>AI Headhunter OS</span>
          <span className="gp-footer-hint">Command Palette</span>
        </div>
      </div>
    </div>
  )
}

/* ── 分类图标映射 ── */
const kindIcons: Record<SearchKind, string> = {
  candidate: '👤',
  job: '💼',
  company: '🏢',
  knowledge: '📚',
  school: '🏫',
  chart: '📊',
  info: '📰',
  contact: '🤝',
  project: '📁',
  note: '📝',
}
