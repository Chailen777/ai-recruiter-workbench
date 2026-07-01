'use client'

import { useCallback, useEffect, useState } from 'react'
import { NotePanel } from '@/components/ui/NotePanel'
import type { NoteItem } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

/**
 * 学校库专属卡片笔记
 * 每条学校拥有独立笔记空间（entityType = 'school'）
 */
export function SchoolNotePanel({
  schoolId,
  onTodoCountChange,
  filterDate,
}: {
  schoolId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = useCallback(() => {
    getNotes('school', schoolId).then((rows) => {
      const items = rows as NoteItem[]
      setNotes(items)
      setLoading(false)
      onTodoCountChange?.(items.filter(n => n.type === 'todo' && !n.done).length)
    })
  }, [schoolId, onTodoCountChange])

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
      entityType="school"
      entityId={schoolId}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
