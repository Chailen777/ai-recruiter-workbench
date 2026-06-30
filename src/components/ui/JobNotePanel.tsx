'use client'

import { useEffect, useState } from 'react'
import { NotePanel, type NoteItem } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

/**
 * 岗位专属卡片笔记库
 * 每个岗位拥有独立笔记空间（entityType = 'job'）
 */
export function JobNotePanel({
  jobId,
  onTodoCountChange,
  filterDate,
}: {
  jobId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = () => {
    getNotes('job', jobId).then((rows) => {
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
  useEffect(() => { loadNotes() }, [jobId])

  return (
    <NotePanel
      entityType="job"
      entityId={jobId}
      notes={notes}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
