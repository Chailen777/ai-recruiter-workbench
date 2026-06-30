'use client'

import { useState } from 'react'

interface DetailTabViewProps {
  detailContent: React.ReactNode
  notesContent: React.ReactNode
  todoCount?: number
  /** Tab 行右侧附加操作（如日历按钮） */
  extraAction?: React.ReactNode
}

export function DetailTabView({ detailContent, notesContent, todoCount = 0, extraAction }: DetailTabViewProps) {
  const [activeTab, setActiveTab] = useState<'detail' | 'notes'>('detail')

  return (
    <div className="detail-tab-view">
      <div className="detail-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'detail'}
          className={`detail-tab ${activeTab === 'detail' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('detail')}
        >
          详细资料
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'notes'}
          className={`detail-tab ${activeTab === 'notes' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          卡片笔记
          {todoCount > 0 && (
            <span className="detail-tab-badge">{todoCount}</span>
          )}
        </button>
        {extraAction && (
          <div className="detail-tab-extra">{extraAction}</div>
        )}
      </div>
      <div className="detail-tab-content">
        {activeTab === 'detail' ? detailContent : notesContent}
      </div>
    </div>
  )
}
