'use client'

import React, { memo } from 'react'
import { StatusBadge } from '@/components/ui'

type JobCardProps = {
  id: number
  title: string
  salaryRange?: string | null
  commission?: string | null
  city?: string | null
  educationRequirement?: string | null
  experienceRequirement?: string | null
  headcount?: number | null
  companyName?: string | null
  status?: string | null
  skillKeywords?: string | null
  jobCategory?: string | null
  /** External link for job application */
  link?: string | null
  /** Whether this card is currently selected in the list */
  isSelected?: boolean
}

/** Determine status badge variant for a job */
function jobStatusVariant(status?: string | null) {
  if (status === '已关闭' || status === '关闭') return 'neutral'
  if (status === 'Offer') return 'success'
  if (status === '进行中' || status === '推荐中' || status === '面试中') return 'progress'
  return 'pending'
}

/** Format commission value with K suffix */
function formatCommission(value?: string | null): string {
  if (!value) return ''
  const num = parseFloat(value.replace(/[^\d.]/g, ''))
  if (!isNaN(num)) return `${num}K`
  return value
}

/** Build tag-like metadata from job fields */
function buildMetaTags(job: JobCardProps): string[] {
  const tags: string[] = []
  if (job.salaryRange) tags.push(job.salaryRange)
  if (job.city) tags.push(job.city)
  if (job.educationRequirement) tags.push(job.educationRequirement)
  if (job.experienceRequirement) tags.push(job.experienceRequirement)
  if (job.headcount != null) tags.push(`${job.headcount}人`)
  return tags
}

export const JobCard = memo(function JobCard(props: JobCardProps) {
  const {
    id: _id,
    title,
    commission,
    companyName,
    status,
    link,
    isSelected,
  } = props

  const metaTags = buildMetaTags(props)
  const statusVariant = jobStatusVariant(status)

  return (
    <div className={`job-card${isSelected ? ' selected' : ''}`}>
      {/* ── Header: title + commission ── */}
      <div className="jc-header">
        <h3 className="jc-title">{title}</h3>
        <span className="jc-commission">
          佣金 <strong>{formatCommission(commission)}</strong>
        </span>
      </div>

      {/* ── Tag Row (salary · city · edu · exp · count) ── */}
      {metaTags.length > 0 && (
        <div className="jc-tags">
          {metaTags.map((tag, i) => (
            <span key={i} className="jc-tag">{tag}</span>
          ))}
        </div>
      )}

      {/* ── Company Name ── */}
      {companyName && (
        <p className="jc-company">{companyName}</p>
      )}

      {/* ── Footer: status badge (left) + action button (right) ── */}
      <div className="jc-footer">
        <div className="jc-footer-left">
          {status && (
            <StatusBadge variant={statusVariant}>
              {status}
            </StatusBadge>
          )}
        </div>
        {link ? (
          <span
            className="jc-action"
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              window.open(link, '_blank', 'noopener,noreferrer')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                window.open(link, '_blank', 'noopener,noreferrer')
              }
            }}
          >
            立即接单
          </span>
        ) : (
          <span className="jc-actiondisabled">立即接单</span>
        )}
      </div>
    </div>
  )
})
