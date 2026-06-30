'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { CoverImage, StatusBadge } from '@/components/ui'

type StatusBadgeConfig = {
  label: string
  variant: 'success' | 'pending' | 'progress' | 'risk' | 'neutral' | 'warning'
}

type MetaItem = {
  label?: string
  value: string
}

type ResourceCardProps = {
  title: string
  href: string
  cover?: string | null
  tags?: string[]
  metaItems?: MetaItem[]
  statusBadges?: StatusBadgeConfig[]
  footerLeft?: string
  footerRight?: string
  isSelected?: boolean
  variant?: 'default' | 'compact'
}

export const ResourceCard = memo(function ResourceCard(props: ResourceCardProps) {
  const {
    title,
    href,
    cover,
    tags = [],
    metaItems = [],
    statusBadges = [],
    footerLeft,
    footerRight,
    isSelected = false,
    variant = 'default',
  } = props

  return (
    <Link
      className={`resource-card${isSelected ? ' is-selected' : ''} ${variant === 'compact' ? 'resource-card--compact' : ''}`}
      href={href}
      title={title}
    >
      {/* ── Cover Image (if available) ── */}
      {cover && (
        <div className="rc-cover">
          <CoverImage src={cover} alt={title} size="md" />
        </div>
      )}

      {/* ── Content ── */}
      <div className="rc-content">
        {/* Title + Status Badges */}
        <div className="rc-header">
          <h3 className="rc-title">{title}</h3>
          {statusBadges.length > 0 && (
            <div className="rc-status-badges">
              {statusBadges.map((badge, i) => (
                <StatusBadge key={i} variant={badge.variant}>
                  {badge.label}
                </StatusBadge>
              ))}
            </div>
          )}
        </div>

        {/* Meta Items */}
        {metaItems.length > 0 && (
          <div className="rc-meta">
            {metaItems.map((item, i) => (
              <span key={i} className="rc-meta-item">
                {item.label && <span className="rc-meta-label">{item.label}: </span>}
                <span className="rc-meta-value">{item.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="rc-tags">
            {tags.map((tag, i) => (
              <span key={i} className="rc-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        {(footerLeft || footerRight) && (
          <div className="rc-footer">
            {footerLeft && <span className="rc-footer-left">{footerLeft}</span>}
            {footerRight && <span className="rc-footer-right">{footerRight}</span>}
          </div>
        )}
      </div>
    </Link>
  )
})
