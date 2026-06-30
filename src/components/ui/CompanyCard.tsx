'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui'

type CompanyCardProps = {
  id: number
  name: string
  industry?: string | null
  city?: string | null
  address?: string | null
  cooperationStatus?: string | null
  companyContactName?: string | null
  companyContactPhone?: string | null
  jobsCount?: number
  note?: string | null
  isSelected?: boolean
}

/** Determine status badge variant for a company */
function companyStatusVariant(status?: string | null) {
  if (!status) return 'neutral'
  if (status.includes('合作中') || status.includes('已联系')) return 'success'
  if (status.includes('待沟通')) return 'pending'
  if (status.includes('暂停')) return 'progress'
  if (status.includes('结束')) return 'risk'
  return 'neutral'
}

export const CompanyCard = memo(function CompanyCard(props: CompanyCardProps) {
  const {
    id,
    name,
    industry,
    city,
    cooperationStatus,
    companyContactName,
    jobsCount,
    isSelected = false,
  } = props

  return (
    <Link
      className={`company-card${isSelected ? ' is-selected' : ''}`}
      href={`/companies?companyId=${id}`}
      title={name}
    >
      {/* ── Header: Name + Status ── */}
      <div className="ccp-header">
        <div className="ccp-header-info">
          <h3 className="ccp-name">{name}</h3>
          {cooperationStatus && (
            <StatusBadge variant={companyStatusVariant(cooperationStatus)}>
              {cooperationStatus}
            </StatusBadge>
          )}
        </div>
      </div>

      {/* ── Info Tags ── */}
      <div className="ccp-tags">
        {industry && <span className="ccp-tag">{industry}</span>}
        {city && <span className="ccp-tag">{city}</span>}
        {jobsCount != null && <span className="ccp-tag">{jobsCount} 个岗位</span>}
      </div>

      {/* ── Contact Info ── */}
      {companyContactName && (
        <div className="ccp-contact">
          <span className="ccp-contact-label">联系人：</span>
          <span className="ccp-contact-value">{companyContactName}</span>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="ccp-footer">
        <span className="ccp-action">查看详情</span>
      </div>
    </Link>
  )
})
