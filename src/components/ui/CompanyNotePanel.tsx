'use client'

import { useEffect, useState } from 'react'
import { NotePanel, type NoteItem } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

/**
 * 企业专属卡片笔记
 * 每个企业拥有独立笔记空间（entityType = 'company'）
 */
export function CompanyNotePanel({
  companyId,
  onTodoCountChange,
  filterDate,
}: {
  companyId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = () => {
    getNotes('company', companyId).then((rows) => {
      const items = rows as NoteItem[]
      setNotes(items)
      setLoading(false)
      const count = items.filter((n) => n.type === 'todo' && !n.done).length
      onTodoCountChange?.(count)
    })
  }

  const handleNotesChanged = () => {
    loadNotes()
    triggerRefresh()
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadNotes() }, [companyId])

  return (
    <NotePanel
      entityType="company"
      entityId={companyId}
      notes={notes}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
