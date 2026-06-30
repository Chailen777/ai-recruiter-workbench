import { ReactNode } from 'react'

type DetailPanelProps = {
  actions?: ReactNode
  avatar?: string | null
  children: ReactNode
  description?: string
  title: string
  titleExtra?: ReactNode
}

export function DetailPanel({ actions, avatar, children, description, title, titleExtra }: DetailPanelProps) {
  return (
    <section className="ui-detail-panel">
      <div className="ui-detail-panel-head">
        {avatar ? (
          <div className="dp-avatar-wrap">
            <img alt="" className="dp-avatar-img" src={avatar} />
          </div>
        ) : null}
        <div className="ui-detail-panel-title-group">
          <h2 className="ui-detail-panel-title">
            {title}
            {titleExtra}
          </h2>
          {description ? <p className="muted">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="ui-detail-panel-actions">{actions}</div> : null}
      <div className="ui-detail-panel-body">{children}</div>
    </section>
  )
}
