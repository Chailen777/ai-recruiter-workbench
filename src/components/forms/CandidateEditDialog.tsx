'use client'

import { useRef, useState } from 'react'

import { ActionButton } from '@/components/ui'

import { CandidateForm } from './CandidateForm'

type CandidateData = Parameters<typeof CandidateForm>[0]['candidate']

export function CandidateEditDialog({ candidate }: { candidate: NonNullable<CandidateData> }) {
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
      <ActionButton onClick={show} size="sm" type="button" variant="secondary">
        编辑
      </ActionButton>
      <div
        className={fullscreen ? 'dialog-fullscreen' : ''}
        id="candidate-edit-dialog"
        popover="auto"
        ref={dialogRef}
      >
        {open ? (
          <div className="dialog-panel">
            <div className="dialog-head">
              <h2>编辑候选人</h2>
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
              <CandidateForm candidate={candidate} onSubmitRef={handleSubmitRef} hideActions onClose={hide} />
            </div>
            <div className="dialog-foot">
              <ActionButton onClick={hide} type="button" variant="secondary">取消</ActionButton>
              <button
                className="ui-action-button ui-action-button-primary"
                onClick={() => submitFormRef.current()}
                type="button"
              >
                保存修改
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
