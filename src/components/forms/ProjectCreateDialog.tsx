'use client'

import { useRef, useState } from 'react'
import { ActionButton } from '@/components/ui'
import { ProjectForm } from './ProjectForm'

export function ProjectCreateDialog() {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const submitFormRef = useRef<() => void>(() => {})

  const show = () => { setOpen(true); dialogRef.current?.showPopover() }
  const hide = () => { dialogRef.current?.hidePopover(); setOpen(false) }

  return (
    <>
      <ActionButton onClick={show} type="button">+ 新增项目</ActionButton>
      <div className={fullscreen ? 'dialog-fullscreen' : ''} popover="auto" ref={dialogRef}>
        {open ? (
          <div className="dialog-panel">
            <div className="dialog-head">
              <h2>新增项目</h2>
              <div>
                <button className="dialog-fullscreen-btn" onClick={() => setFullscreen(v => !v)} title={fullscreen ? '退出全屏' : '全屏'} type="button">
                  {fullscreen ? '⊠' : '⛶'}
                </button>
                <ActionButton onClick={hide} size="sm" type="button" variant="secondary">×</ActionButton>
              </div>
            </div>
            <div className="dialog-body">
              <ProjectForm onSubmitRef={(fn) => { submitFormRef.current = fn }} hideActions onClose={hide} />
            </div>
            <div className="dialog-foot">
              <ActionButton onClick={hide} type="button" variant="secondary">取消</ActionButton>
              <button className="ui-action-button ui-action-button-primary" onClick={() => submitFormRef.current()} type="button">保存项目</button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
