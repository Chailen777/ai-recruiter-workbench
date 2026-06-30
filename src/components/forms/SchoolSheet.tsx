'use client'

import { useRef, useState } from 'react'

import { ActionButton, Sheet } from '@/components/ui'
import { SchoolForm } from './SchoolForm'

export function SchoolCreateSheet() {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} type="button" variant="secondary">
        + 新增学校
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="新增学校"
        footer={
          <>
            <ActionButton onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </ActionButton>
            <ActionButton onClick={() => submitFormRef.current()} type="button" variant="secondary">
              保存学校
            </ActionButton>
          </>
        }
      >
        <SchoolForm
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}

export function SchoolEditSheet({ school }: { school: NonNullable<Parameters<typeof SchoolForm>[0]['school']> }) {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
        编辑学校
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="编辑学校"
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
        <SchoolForm
          school={school}
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}
