'use client'

import { useCallback, useEffect, useState } from 'react'
import { NotePanel } from '@/components/ui/NotePanel'
import type { NoteItem } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

export function ProjectNotePanel({
  projectId,
  onTodoCountChange,
  filterDate,
}: {
  projectId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = useCallback(() => {
    getNotes('project', projectId).then((rows) => {
      const items = rows as NoteItem[]
      setNotes(items)
      setLoading(false)
      onTodoCountChange?.(items.filter(n => n.type === 'todo' && !n.done).length)
    })
  }, [projectId, onTodoCountChange])

  const handleNotesChanged = useCallback(() => {
    loadNotes()
    triggerRefresh()
  }, [loadNotes, triggerRefresh])

  useEffect(() => { loadNotes() }, [loadNotes])

  return (
    <NotePanel
      notes={notes}
      entityType="project"
      entityId={projectId}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
