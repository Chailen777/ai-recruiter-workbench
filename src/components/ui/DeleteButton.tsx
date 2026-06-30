'use client'

import { useState } from 'react'

import { ActionButton, ConfirmDialog } from '@/components/ui'

type DeleteButtonProps = {
  /** 删除操作的 server action */
  action: (formData: FormData) => void
  /** 被删除记录的唯一标识 */
  id: number | string
  /** 被删除条目的名称（用于确认文案） */
  label?: string
  /** 按钮尺寸 */
  size?: 'sm' | 'md'
  /** 按钮变体，默认 danger */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

/**
 * 带确认的删除按钮 — 点击先弹确认窗，确认后提交表单。
 */
export function DeleteButton({ action, id, label = '该项目', size = 'sm', variant = 'danger' }: DeleteButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirm = () => {
    const formData = new FormData()
    formData.set('id', String(id))
    action(formData)
    setConfirmOpen(false)
  }

  return (
    <>
      <ActionButton size={size} type="button" variant={variant} onClick={() => setConfirmOpen(true)}>
        删除
      </ActionButton>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="确认删除"
        message={`确定要删除「${label}」吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        variant="danger"
      />
    </>
  )
}
