'use client'

import React from 'react'

export type GenderBadgeProps = {
  gender: string | null
}

export function GenderBadge({ gender }: GenderBadgeProps) {
  if (gender !== '男' && gender !== '女') return null

  const label = gender === '男' ? '♂' : '♀'
  const bgColor = gender === '男' ? '#3b82f6' : '#ec4899'

  return (
    <span
      className="gender-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: bgColor,
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
        verticalAlign: 'super',
      }}
      aria-label={gender}
      title={gender}
    >
      {label}
    </span>
  )
}
