'use client'

import { useRef, useState } from 'react'

import { ActionButton } from '@/components/ui'

import { InfoForm } from './InfoForm'

export function InfoCreateDialog() {
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
      <ActionButton onClick={show} type="button">
        + 新增信息
      </ActionButton>
      <div
        className={fullscreen ? 'dialog-fullscreen' : ''}
        popover="auto"
        ref={dialogRef}
      >
        {open ? (
          <div className="dialog-panel">
            <div className="dialog-head">
              <h2>新增信息</h2>
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
              <InfoForm onSubmitRef={handleSubmitRef} hideActions onClose={hide} />
            </div>
            <div className="dialog-foot">
              <ActionButton onClick={hide} type="button" variant="secondary">取消</ActionButton>
              <button
                className="ui-action-button ui-action-button-primary"
                onClick={() => submitFormRef.current()}
                type="button"
              >
                保存信息
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
