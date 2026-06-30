'use client'

import { useRef, useState } from 'react'

import { ActionButton, Sheet } from '@/components/ui'
import { KnowledgeForm } from './KnowledgeForm'

export function KnowledgeCreateSheet() {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} type="button" variant="secondary">
        + 新增知识
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="新增知识"
        footer={
          <>
            <ActionButton onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </ActionButton>
            <ActionButton onClick={() => submitFormRef.current()} type="button" variant="secondary">
              保存知识
            </ActionButton>
          </>
        }
      >
        <KnowledgeForm
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}

export function KnowledgeEditSheet({ knowledge }: { knowledge: NonNullable<Parameters<typeof KnowledgeForm>[0]['knowledge']> }) {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
        编辑知识
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="编辑知识"
        footer={
          <>
            <ActionButton onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </ActionButton>
            <ActionButton onClick={() => submitFormRef.current()} type="button" variant="secondary">
              保存修改
            </ActionButton>
          </>
        }
      >
        <KnowledgeForm
          knowledge={knowledge}
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}
