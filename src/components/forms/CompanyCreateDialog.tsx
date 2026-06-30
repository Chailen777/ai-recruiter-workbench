'use client'

import { useRef, useState } from 'react'

import { ActionButton } from '@/components/ui'

import { CompanyForm } from './CompanyForm'

export function CompanyCreateDialog() {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  const handleSubmitRef = (submitFn: () => void) => {
    submitFormRef.current = submitFn
  }

  const show = () => {
    setOpen(true)
    dialogRef.current?.showPopover()
  }

  const hide = () => {
    dialogRef.current?.hidePopover()
    setOpen(false)
  }

  return (
    <>
      <ActionButton onClick={show} type="button" variant="secondary">
        + 新增企业
      </ActionButton>
      <div
        className={fullscreen ? 'dialog-fullscreen' : ''}
        id="company-create-dialog"
        popover="auto"
        ref={dialogRef}
      >
        {open ? (
          <div className="dialog-panel">
            <div className="dialog-head">
              <h2>新增企业</h2>
              <div>
                <button
                  className="dialog-fullscreen-btn"
                  onClick={() => setFullscreen((v) => !v)}
                  title={fullscreen ? '退出全屏' : '全屏'}
                  type="button"
                >
                  {fullscreen ? '⊠' : '⛶'}
                </button>
                <ActionButton onClick={hide} size="sm" type="button" variant="secondary">
                  ×
                </ActionButton>
              </div>
            </div>
            <div className="dialog-body">
              <CompanyForm onSubmitRef={handleSubmitRef} hideActions onClose={hide} />
            </div>
            <div className="dialog-foot">
              <ActionButton onClick={hide} type="button" variant="secondary">取消</ActionButton>
              <ActionButton onClick={() => submitFormRef.current()} type="button" variant="secondary">
                保存企业
              </ActionButton>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
