'use client'

import React from 'react'

// ── 类型定义 ──────────────────────────────────────────
export type AvatarType = 'company' | 'candidate' | 'job'
export type AvatarSize = 'sm' | 'md' | 'lg'

export type AvatarProps = {
  type: AvatarType
  size?: AvatarSize
  className?: string
  /** Uploaded image URL — overrides the default icon when set */
  src?: string | null
}

// ── 尺寸映射 ──────────────────────────────────────────
const SIZE_MAP: Record<AvatarSize, number> = { sm: 36, md: 48, lg: 72 }

// ── 企业大厦图标 ──────────────────────────────────────
function BuildingIcon({ size }: { size: number }) {
  const s = size * 0.55
  const offset = (size - s) / 2
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} x={offset} y={offset}>
      <path
        d="M3 21V8l9-4.5L21 8v13M3 21h18M3 21v-5h4v5m2-10h2m-2 5h2m4-5h2m-2 5h2M8 11h2M8 16h2"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── 候选人头像（中性人形） ────────────────────────────
function PersonIcon({ size }: { size: number }) {
  const s = size * 0.58
  const offset = (size - s) / 2
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} x={offset} y={offset}>
      {/* 头部 */}
      <circle cx="12" cy="8" r="4" fill="#d1d5db" />
      {/* 身体 */}
      <path
        d="M4 22c0-4.418 3.582-8 8-8s8 3.582 8 8"
        fill="#d1d5db"
      />
    </svg>
  )
}

// ── 岗位图标（公文包 / 工作牌） ────────────────────────
function JobIcon({ size }: { size: number }) {
  const s = size * 0.52
  const offset = (size - s) / 2
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} x={offset} y={offset}>
      {/* 公文包主体 */}
      <rect x="3" y="7" width="18" height="13" rx="2" fill="#fbbf24" />
      {/* 把手 */}
      <path
        d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 竖线（文件感） */}
      <line x1="12" y1="10" x2="12" y2="17" stroke="#d97706" strokeWidth="1.2" />
      <line x1="9" y1="13" x2="15" y2="13" stroke="#d97706" strokeWidth="1.2" />
    </svg>
  )
}

// ── 背景色映射 ────────────────────────────────────────
function bgFor(type: AvatarType): string {
  switch (type) {
    case 'company':  return '#f3f4f6'
    case 'candidate': return '#eef2ff'
    case 'job':       return '#fef9c3'
  }
}

// ── Avatar 主组件 ─────────────────────────────────────
export function Avatar({ type, size = 'md', className, src }: AvatarProps) {
  const dim = SIZE_MAP[size]

  const icon = (() => {
    switch (type) {
      case 'company':
        return <BuildingIcon size={dim} />
      case 'candidate':
        return <PersonIcon size={dim} />
      case 'job':
        return <JobIcon size={dim} />
    }
  })()

  return (
    <span
      className={`ui-avatar ui-avatar--${type} ui-avatar--${size}${className ? ' ' + className : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        width: dim,
        height: dim,
        borderRadius: '50%',
        background: bgFor(type),
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
          onError={(e) => {
            // Fallback: remove broken image so icon shows
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : null}
      {!src ? icon : null}
    </span>
  )
}
