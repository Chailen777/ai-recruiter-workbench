import { ReactNode } from 'react'

type WorkflowStepState = 'done' | 'active' | 'todo'

type WorkflowStepProps = {
  actions?: ReactNode
  description?: string
  index: number
  state?: WorkflowStepState
  title: string
}

export function WorkflowStep({
  actions,
  description,
  index,
  state = 'todo',
  title,
}: WorkflowStepProps) {
  return (
    <article className={`ui-workflow-step ui-workflow-step-${state}`}>
      <div className="ui-workflow-index">{index}</div>
      <div className="ui-workflow-content">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="ui-workflow-actions">{actions}</div> : null}
    </article>
  )
}
