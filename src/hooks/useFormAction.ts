'use client'

import { useActionState } from 'react'

import type { ActionResult } from '@/lib/form'

export function useFormAction<T>(action: (formData: FormData) => Promise<ActionResult<T>>) {
  const wrapped = async (_prevState: ActionResult<T> | undefined, formData: FormData) =>
    action(formData)
  const [state, formAction, isPending] = useActionState(wrapped, undefined)
  return { formAction, isPending, state }
}
