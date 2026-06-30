'use client'

import React from 'react'

// ── 封面图片尺寸 ──────────────────────────────────────
export type CoverImageSize = 'sm' | 'md' | 'lg'

export type CoverImageProps = {
  size?: CoverImageSize
  className?: string
  /** 封面图片URL */
  src?: string | null
  /** 替代文本 */
  alt?: string
}

// ── 尺寸映射（宽度 x 高度） ──────────────────────────
const SIZE_MAP: Record<CoverImageSize, { width: number; height: number }> = {
  sm: { width: 60, height: 40 },   // 列表显示：小矩形，根据行高比例
  md: { width: 200, height: 133 }, // 中等尺寸
  lg: { width: 480, height: 320 }, // 详情显示：大图展示，倒圆角，非常好看
}

// ── 默认图标（当没有封面时显示） ──────────────────────
function CoverPlaceholder({ width, height }: { width: number; height: number }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={width * 0.4} 
      height={height * 0.4} 
      style={{ opacity: 0.5 }}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.6"
      />
      <circle cx="8.5" cy="8.5" r="1.5" fill="#9ca3af" />
      <path
        d="M21 15l-5-5L5 21"
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── CoverImage 主组件 ──────────────────────────────────
export function CoverImage({ size = 'md', className, src, alt = '封面' }: CoverImageProps) {
  const { width, height } = SIZE_MAP[size]
  const borderRadius = size === 'lg' ? '12px' : '6px' // 大尺寸倒圆角更明显

  return (
    <span
      className={`cover-image cover-image--${size}${className ? ' ' + className : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        width,
        height,
        borderRadius,
        background: '#f3f4f6',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius,
          }}
          onError={(e) => {
            // Fallback: remove broken image so placeholder shows
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : null}
      {!src ? <CoverPlaceholder width={width} height={height} /> : null}
    </span>
  )
}
