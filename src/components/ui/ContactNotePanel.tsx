'use client'

import { useCallback, useEffect, useState } from 'react'
import { NotePanel } from '@/components/ui/NotePanel'
import type { NoteItem } from '@/components/ui/NotePanel'
import { getNotes } from '@/app/actions'
import { useNotesRefresh } from '@/components/providers'

export function ContactNotePanel({
  contactId,
  onTodoCountChange,
  filterDate,
}: {
  contactId: number
  onTodoCountChange?: (count: number) => void
  filterDate?: string | null
}) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const { triggerRefresh } = useNotesRefresh()

  const loadNotes = useCallback(() => {
    getNotes('contact', contactId).then((rows) => {
      const items = rows as NoteItem[]
      setNotes(items)
      setLoading(false)
      onTodoCountChange?.(items.filter(n => n.type === 'todo' && !n.done).length)
    })
  }, [contactId, onTodoCountChange])

  const handleNotesChanged = useCallback(() => {
    loadNotes()
    triggerRefresh()
  }, [loadNotes, triggerRefresh])

  useEffect(() => { loadNotes() }, [loadNotes])

  return (
    <NotePanel
      notes={notes}
      entityType="contact"
      entityId={contactId}
      onNotesChanged={handleNotesChanged}
      filterDate={filterDate}
      loading={loading}
    />
  )
}
