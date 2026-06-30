'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DIMS_C2J, DIMS_J2C } from '@/lib/matching'
import type { MatchDimensionKey } from '@/lib/matching'

type Props = {
  /** 当前匹配模式 */
  mode: 'candidate-to-job' | 'job-to-candidate'
  /** 当前选中的实体 ID（候选人 or 岗位） */
  selectedId?: number | null
  /** 当前启用的维度键集合 */
  activeDims: MatchDimensionKey[]
  /** 当前维度的 URL 参数字符串 */
  dimsParam?: string
  /** 模式切换 segmented 按钮的 JSX */
  modeSwitch: React.ReactNode
  /** 选择器 <select> + hidden inputs 的 JSX（不含提交按钮） */
  selectPicker: React.ReactNode
  /** 选择器的 form action 目标 URL */
  formAction: string
  /** 当前选中的 ID 作为 hidden input 的值 */
  formSelectedValue: string
  /** hidden input 的 name（candidateId / jobId） */
  formIdName: string
}

/** 将维度 Set 序列化为 URL 友好字符串 */
export function dimsToParam(dims: MatchDimensionKey[]): string {
  return dims.join(',')
}

export function dimsFromParam(param?: string): MatchDimensionKey[] {
  if (!param) return []
  return param.split(',').filter((k): k is MatchDimensionKey => {
    const valid: MatchDimensionKey[] = ['city', 'education', 'age', 'skills', 'experience', 'industry', 'salary']
    return valid.includes(k as MatchDimensionKey)
  })
}

export function MatchToolbar({
  mode,
  selectedId,
  activeDims,
  dimsParam,
  modeSwitch,
  selectPicker,
  formAction,
  formSelectedValue,
  formIdName,
}: Props) {
  const router = useRouter()

  const dims = mode === 'candidate-to-job' ? DIMS_C2J : DIMS_J2C
  const activeSet = useMemo(() => new Set(activeDims), [activeDims])

  const toggleDim = useCallback(
    (key: MatchDimensionKey) => {
      const next = activeSet.has(key)
        ? activeDims.filter((d) => d !== key)
        : [...activeDims, key]
      const dimsStr = dimsToParam(next)
      const base = `/match?mode=${mode}`
      const idParam = mode === 'candidate-to-job'
        ? (selectedId ? `&candidateId=${selectedId}` : '')
        : (selectedId ? `&jobId=${selectedId}` : '')
      const qs = dimsStr ? `&dims=${dimsStr}` : ''
      router.push(`${base}${idParam}${qs}`)
    },
    [mode, selectedId, activeDims, activeSet, router],
  )

  return (
    <div className="match-toolbar-v2">
      {/* ── Row 1: 模式切换 tabs ── */}
      {modeSwitch}

      {/* ── Row 2: 选择器 + 开始匹配按钮（同一行居中） ── */}
      <form action={formAction} className="match-action-row">
        <input type="hidden" name="mode" value={mode} />
        {dimsParam && <input type="hidden" name="dims" value={dimsParam} />}
        <input type="hidden" name={formIdName} value={formSelectedValue} />

        {selectPicker}

        <button type="submit" className="match-start-btn">
          ⚡ 开始匹配
        </button>
      </form>

      {/* ── Row 3: 匹配维度 pills ── */}
      <div className="quick-match-dims">
        <span className="quick-match-dims-label">📐 匹配维度：</span>
        <div className="quick-match-dims-pills">
          {dims.map((dim) => {
            const isActive = activeSet.has(dim.key)
            return (
              <button
                key={dim.key}
                type="button"
                className={`quick-match-dim-pill${isActive ? ' is-active' : ''}`}
                onClick={() => toggleDim(dim.key)}
              >
                <span className="quick-match-dim-pill-icon">{dim.icon}</span>
                <span className="quick-match-dim-pill-label">{dim.label}</span>
                {isActive && <span className="quick-match-dim-pill-check">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
