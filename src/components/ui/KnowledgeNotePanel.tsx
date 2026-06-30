'use client'

import { useCallback, useEffect, useState } from 'react'
import { NotePanel } from '@/components/ui/NotePanel'
import type { NoteItem } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

/**
 * 知识库专属卡片笔记库
 * 每条知识拥有独立笔记空间（entityType = 'knowledge'）
 */
export function KnowledgeNotePanel({
  knowledgeId,
  onTodoCountChange,
  filterDate,
}: {
  knowledgeId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = useCallback(() => {
    getNotes('knowledge', knowledgeId).then((rows) => {
      const items = rows as NoteItem[]
      setNotes(items)
      setLoading(false)
      onTodoCountChange?.(items.filter(n => n.type === 'todo' && !n.done).length)
    })
  }, [knowledgeId, onTodoCountChange])

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
      entityType="knowledge"
      entityId={knowledgeId}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
