'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { GenderBadge, StatusBadge } from '@/components/ui'

type CandidateCardProps = {
  id: number
  name: string
  gender?: string | null
  avatar?: string | null
  city?: string | null
  age?: number | null
  education?: string | null
  yearsOfWork?: number | null
  expectedSalary?: string | null
  currentCompany?: string | null
  currentTitle?: string | null
  schoolName?: string | null
  major?: string | null
  selfIntro?: string | null
  skillTags?: string | null
  tags?: string | null
  status?: string | null
  /** ISO date string of creation or last active time */
  createdAt?: string | null
  updatedAt?: string | null
  /** Whether this card is currently selected */
  selected?: boolean
}

/** Determine if the candidate was created/active "today" */
function isActiveToday(dateStr?: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

/** Map status to badge variant + label for the activity badge */
function activityLabel(
  status: string | null | undefined,
  createdAt?: string | null,
  updatedAt?: string | null
): { label: string; variant: 'success' | 'progress' | 'pending' | 'risk' | 'neutral' } {
  // If updated today → "今天活跃"
  if (isActiveToday(updatedAt ?? createdAt)) {
    return { label: '今天活跃', variant: 'success' }
  }
  // If created within 3 days → "近期活跃"
  if (createdAt || updatedAt) {
    const d = new Date((updatedAt ?? createdAt)!)
    const diffMs = Date.now() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 3) return { label: '近期活跃', variant: 'progress' }
    if (diffDays <= 7) return { label: '本周活跃', variant: 'progress' }
  }
  return { label: status || '待跟进', variant: 'pending' as const }
}

function formatDuration(years?: number | null): string {
  if (years == null) return ''
  const y = Math.floor(years)
  const m = Math.round((years - y) * 12)
  if (m > 0) return `${y}年${m}个月`
  return `${y}年`
}

export const CandidateCard = memo(function CandidateCard(props: CandidateCardProps) {
  const {
    id,
    name,
    gender,
    avatar,
    city,
    age,
    education,
    yearsOfWork,
    expectedSalary,
    currentCompany,
    currentTitle,
    schoolName,
    major,
    selfIntro,
    tags,
    status,
    createdAt,
    updatedAt,
    selected = false,
  } = props

  const activity = activityLabel(status, createdAt, updatedAt)

  // Build info line parts
  const infoParts: string[] = []
  if (city) infoParts.push(city)
  if (age != null) infoParts.push(`${age}岁`)
  if (education) infoParts.push(education)
  if (yearsOfWork != null) infoParts.push(formatDuration(yearsOfWork))
  if (expectedSalary) infoParts.push(expectedSalary)

  // Parse tags into array
  const tagList = tags
    ? tags.split(/[,，;；|]/).map((t) => t.trim()).filter(Boolean)
    : []

  return (
    <Link
      href={`/candidates?candidateId=${id}`}
      className={`candidate-card${selected ? ' is-selected' : ''}`}
      aria-current={selected ? 'page' : undefined}
    >
      {/* ── Header ── */}
      <div className="cc-header">
        {/* Avatar on the left */}
        {avatar ? (
          <div className="cc-avatar-wrap">
            <img
              alt={`${name}的头像`}
              className="cc-avatar-img"
              src={avatar}
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="cc-avatar-placeholder"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--ds-color-primary, #2563eb), color-mix(in srgb, var(--ds-color-primary) 60%, #6366f1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {(name || '?')[0]}
          </div>
        )}
        <div className="cc-header-left">
          <span className="cc-name">{name}</span>
          <GenderBadge gender={gender ?? null} />
          <StatusBadge variant={activity.variant}>{activity.label}</StatusBadge>
        </div>
      </div>

      {/* ── Info Line (City · Age · Education · Exp · Salary) ── */}
      {infoParts.length > 0 && (
        <div className="cc-info">{infoParts.join(' \u00A0\u00A0 ')}</div>
      )}

      {/* ── Work Experience ── */}
      {(currentCompany || currentTitle) && (
        <div className="cc-row">
          <span className="cc-row-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22V12h6v10M9 12h6" />
            </svg>
          </span>
          <span className="cc-row-text">
            {[currentCompany, currentTitle].filter(Boolean).join(' \u00B7 ')}
          </span>
          <span className="cc-row-meta">{formatDuration(yearsOfWork)}</span>
        </div>
      )}

      {/* ── Education ── */}
      {schoolName && (
        <div className="cc-row">
          <span className="cc-row-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
            </svg>
          </span>
          <span className="cc-row-text">
            {schoolName}{major ? ` \u00B7 ${major}` : ''}
          </span>
        </div>
      )}

      {/* ── Self Intro / Summary ── */}
      {selfIntro ? (
        <p className="cc-summary">{selfIntro}</p>
      ) : null}

      {/* ── Tags ── */}
      {tagList.length > 0 && (
        <div className="cc-tags">
          {tagList.map((tag) => (
            <span key={tag} className="cc-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
})
