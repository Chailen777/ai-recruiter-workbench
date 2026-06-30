'use client'

import { useRef, useState } from 'react'

import { ActionButton, Sheet } from '@/components/ui'
import { InfoForm } from './InfoForm'

export function InfoCreateSheet() {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} type="button" variant="secondary">
        + 新增信息
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="新增信息"
        footer={
          <>
            <ActionButton onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </ActionButton>
            <ActionButton onClick={() => submitFormRef.current()} type="button" variant="secondary">
              保存信息
            </ActionButton>
          </>
        }
      >
        <InfoForm
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}

export function InfoEditSheet({ info }: { info: NonNullable<Parameters<typeof InfoForm>[0]['info']> }) {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} size="sm" type="button" variant="secondary">
        编辑信息
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="编辑信息"
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
        <InfoForm
          info={info}
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}
