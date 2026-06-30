import Link from 'next/link'
import { ButtonHTMLAttributes, ReactNode } from 'react'

type ActionButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ActionButtonSize = 'sm' | 'md'

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  href?: string
  popoverTarget?: string
  popoverTargetAction?: 'hide' | 'show' | 'toggle'
  size?: ActionButtonSize
  variant?: ActionButtonVariant
}

export function ActionButton({
  children,
  className = '',
  href,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ActionButtonProps) {
  const visualVariant = variant === 'ghost' ? 'secondary' : variant
  const classes = [
    'ui-action-button',
    `ui-action-button-${visualVariant}`,
    `ui-action-button-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <Link className={classes} href={href}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  )
}
