'use client'

import { ReactNode, useEffect, useRef } from 'react'

import { ActionButton } from './ActionButton'

export type FormFieldProps = {
  children: ReactNode
  error?: string
  label: ReactNode
}

export function FormField({ children, error, label }: FormFieldProps) {
  const id = useRef(`field-${Math.random().toString(36).slice(2, 9)}`).current
  return (
    <label className="ui-form-field" htmlFor={id}>
      <span className="ui-form-label">{label}</span>
      <span className="ui-form-control">{children}</span>
      {error ? <span className="ui-form-error">{error}</span> : null}
    </label>
  )
}

export function FormInput({
  className,
  defaultValue,
  error,
  id,
  label,
  max,
  min,
  name,
  placeholder,
  required,
  type = 'text',
}: {
  className?: string
  defaultValue?: string
  error?: string
  id?: string
  label: ReactNode
  max?: string
  min?: string
  name: string
  placeholder?: string
  required?: boolean
  type?: string
}) {
  const fieldId = id ?? name
  return (
    <label className={`ui-form-field${error ? ' is-error' : ''}${className ? ` ${className}` : ''}`} htmlFor={fieldId}>
      <span className="ui-form-label">
        {label}
        {required ? <span className="ui-form-required">*</span> : null}
      </span>
      <input
        className="ui-form-control"
        defaultValue={defaultValue}
        id={fieldId}
        max={max}
        min={min}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {error ? <span className="ui-form-error">{error}</span> : null}
    </label>
  )
}

export function FormSelect({
  children,
  defaultValue,
  error,
  id,
  label,
  name,
  required,
}: {
  children: ReactNode
  defaultValue?: string
  error?: string
  id?: string
  label: ReactNode
  name: string
  required?: boolean
}) {
  const fieldId = id ?? name
  return (
    <label className={`ui-form-field${error ? ' is-error' : ''}`} htmlFor={fieldId}>
      <span className="ui-form-label">
        {label}
        {required ? <span className="ui-form-required">*</span> : null}
      </span>
      <select
        className="ui-form-control"
        defaultValue={defaultValue}
        id={fieldId}
        name={name}
        required={required}
      >
        {children}
      </select>
      {error ? <span className="ui-form-error">{error}</span> : null}
    </label>
  )
}

export function FormTextarea({
  className,
  defaultValue,
  error,
  id,
  label,
  name,
  placeholder,
  rows,
}: {
  className?: string
  defaultValue?: string
  error?: string
  id?: string
  label: ReactNode
  name: string
  placeholder?: string
  rows?: number
}) {
  const fieldId = id ?? name
  return (
    <label
      className={`ui-form-field${error ? ' is-error' : ''}${className ? ` ${className}` : ''}`}
      htmlFor={fieldId}
    >
      <span className="ui-form-label">{label}</span>
      <textarea
        className="ui-form-control"
        defaultValue={defaultValue}
        id={fieldId}
        name={name}
        placeholder={placeholder}
        rows={rows}
      />
      {error ? <span className="ui-form-error">{error}</span> : null}
    </label>
  )
}

export function FormCheckboxGroup({
  error,
  label,
  name,
  options,
  selectedValues,
}: {
  error?: string
  label: ReactNode
  name: string
  options: string[]
  selectedValues?: string[]
}) {
  return (
    <fieldset className={`ui-form-fieldset${error ? ' is-error' : ''}`}>
      <legend className="ui-form-label">{label}</legend>
      <div className="checkbox-panel">
        {options.map((option) => (
          <label key={option}>
            <input
              defaultChecked={selectedValues?.includes(option)}
              name={name}
              type="checkbox"
              value={option}
            />
            {option}
          </label>
        ))}
      </div>
      {error ? <span className="ui-form-error">{error}</span> : null}
    </fieldset>
  )
}

export function FormRadioGroup({
  error,
  label,
  name,
  options,
  selectedValue,
}: {
  error?: string
  label: ReactNode
  name: string
  options: string[]
  selectedValue?: string
}) {
  return (
    <fieldset className={`radio-panel${error ? ' is-error' : ''}`}>
      <legend>{label}</legend>
      <div className="radio-options">
        {options.map((option) => (
          <label key={option}>
            <input
              defaultChecked={selectedValue === option}
              name={name}
              type="radio"
              value={option}
            />
            {option}
          </label>
        ))}
      </div>
      {error ? <span className="ui-form-error">{error}</span> : null}
    </fieldset>
  )
}

export function FormError({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null
  return <div className={`ui-form-global-error${className ? ` ${className}` : ''}`}>{children}</div>
}

export function FormSubmitButton({
  children,
  className,
  loading,
  variant = 'primary',
}: {
  children: ReactNode
  className?: string
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  return (
    <ActionButton className={className} aria-disabled={loading} type="submit" variant={variant}>
      {loading ? '保存中…' : children}
    </ActionButton>
  )
}

export function Form({
  action,
  children,
  className,
  onSuccess,
  state,
}: {
  action: (formData: FormData) => void
  children: ReactNode
  className?: string
  onSuccess?: () => void
  state?: { success?: boolean; message?: string; errors?: Record<string, string> } | null
}) {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      onSuccess?.()
    }
  }, [state, onSuccess])

  return (
    <form action={action} className={className} ref={formRef}>
      {children}
    </form>
  )
}
