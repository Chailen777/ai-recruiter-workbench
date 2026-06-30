'use client'

import { useRef, useState, cloneElement, isValidElement, ReactNode, ReactElement } from 'react'

type DialogProps = {
  trigger: ReactElement<{ onClick?: () => void }>
  title: string
  children: (close: () => void) => ReactNode
}

export function Dialog({ trigger, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const show = () => {
    setOpen(true)
    dialogRef.current?.showPopover()
  }

  const hide = () => {
    dialogRef.current?.hidePopover()
    setOpen(false)
    setFullscreen(false)
  }

  const triggerWithClick = isValidElement(trigger)
    ? cloneElement(trigger, {
        ...trigger.props,
        onClick: show,
      })
    : null

  return (
    <>
      {triggerWithClick}
      <div
        className={fullscreen ? 'dialog-fullscreen' : ''}
        popover="auto"
        ref={dialogRef}
      >
        {open ? (
          <div className="dialog-panel">
            <div className="dialog-head">
              <h2>{title}</h2>
              <div>
                <button
                  className="dialog-fullscreen-btn"
                  onClick={() => setFullscreen((v) => !v)}
                  title={fullscreen ? '退出全屏' : '全屏'}
                  type="button"
                >
                  {fullscreen ? '⊠' : '⛶'}
                </button>
                <button
                  className="ui-action-button ui-action-button-secondary"
                  onClick={hide}
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="dialog-body">
              {children(hide)}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
