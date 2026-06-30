'use client'

import { useRef, useState } from 'react'

import { ActionButton, Sheet } from '@/components/ui'
import { CompanyForm } from './CompanyForm'

export function CompanyCreateSheet() {
  const [open, setOpen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} type="button" variant="secondary">
        + 新增企业
      </ActionButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="新增企业"
        footer={
          <>
            <ActionButton onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </ActionButton>
            <ActionButton onClick={() => submitFormRef.current()} type="button" variant="secondary">
              保存企业
            </ActionButton>
          </>
        }
      >
        <CompanyForm
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}

export function CompanyEditSheet({ company }: { company: NonNullable<Parameters<typeof CompanyForm>[0]['company']> }) {
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
        title="编辑企业"
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
        <CompanyForm
          company={company}
          onSubmitRef={(fn) => { submitFormRef.current = fn }}
          hideActions
          onClose={() => setOpen(false)}
        />
      </Sheet>
    </>
  )
}
