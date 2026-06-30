'use client'

import { useEffect, useState } from 'react'
import { NotePanel } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import type { NoteItem } from '@/components/ui/NotePanel'
import { useNotesRefresh } from '@/components/providers'

/**
 * 候选人专属卡片笔记库
 * 每个候选人拥有独立笔记空间（entityType = 'candidate'）
 */
export function CandidateNotePanel({
  candidateId,
  onTodoCountChange,
  filterDate,
}: {
  candidateId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = () => {
    getNotes('candidate', candidateId).then((rows) => {
      const list = rows as NoteItem[]
      setNotes(list)
      setLoading(false)
      const count = list.filter((n) => n.type === 'todo' && !n.done).length
      onTodoCountChange?.(count)
    })
  }

  const handleNotesChanged = () => {
    loadNotes()
    triggerRefresh()
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadNotes() }, [candidateId])

  return (
    <NotePanel
      entityType="candidate"
      entityId={candidateId}
      notes={notes}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
