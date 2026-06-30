'use client'

import { useFormStatus } from 'react-dom'

interface MatchActionFormProps {
  action: (formData: FormData) => void | Promise<void>
  className: string
  disabled?: boolean
  fields: React.ReactNode
  label: string
  type?: 'submit' | 'reset'
}

function SubmitButton({ className, disabled, label }: { className: string; disabled?: boolean; label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      className={className}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? '⏳ 处理中...' : label}
    </button>
  )
}

export function MatchActionForm({ action, className, disabled, fields, label }: MatchActionFormProps) {
  return (
    <form action={action}>
      {fields}
      <SubmitButton className={className} disabled={disabled} label={label} />
    </form>
  )
}
