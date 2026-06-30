'use client'

import { useRef, useState } from 'react'

import { ActionButton, Sheet } from '@/components/ui'
import { ContactForm } from './ContactForm'

export function ContactCreateSheet() {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} type="button" variant="secondary">
        + 新增人脉
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="新增人脉"
        width={640}
        footer={
          <>
            <ActionButton onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </ActionButton>
            <ActionButton onClick={() => submitFormRef.current()} type="button" variant="secondary">
              保存人脉
            </ActionButton>
          </>
        }
      >
        <ContactForm
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}

export function ContactEditSheet({ contact }: { contact: NonNullable<Parameters<typeof ContactForm>[0]['contact']> }) {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
        编辑人脉
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="编辑人脉"
        width={640}
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
        <ContactForm
          contact={contact}
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}
