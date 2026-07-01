'use client'

import { useCallback, useEffect, useState } from 'react'
import { NotePanel } from '@/components/ui/NotePanel'
import type { NoteItem } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

/**
 * 信息库专属卡片笔记
 * 每条信息拥有独立笔记空间（entityType = 'info'）
 */
export function InfoNotePanel({
  infoId,
  onTodoCountChange,
  filterDate,
}: {
  infoId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = useCallback(() => {
    getNotes('info', infoId).then((rows) => {
      const items = rows as NoteItem[]
      setNotes(items)
      setLoading(false)
      onTodoCountChange?.(items.filter(n => n.type === 'todo' && !n.done).length)
    })
  }, [infoId, onTodoCountChange])

  const handleNotesChanged = useCallback(() => {
    loadNotes()
    triggerRefresh()
  }, [loadNotes, triggerRefresh])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  return (
    <NotePanel
      notes={notes}
      entityType="info"
      entityId={infoId}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
