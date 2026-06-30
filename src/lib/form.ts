export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; errors: Record<string, string>; message?: string }

export type FormState<T = void> =
  | ActionResult<T>
  | { success: false; errors: Record<string, string> }

export type FieldValidator = (value: string) => string | null

export type FormSchema = Record<string, FieldValidator | undefined>

export function validateForm(
  formData: FormData,
  schema: FormSchema
): { errors: Record<string, string>; valid: boolean } {
  const errors: Record<string, string> = {}
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator) continue
    const value = typeof formData.get(key) === 'string' ? (formData.get(key) as string).trim() : ''
    const error = validator(value)
    if (error) errors[key] = error
  }
  return { errors, valid: Object.keys(errors).length === 0 }
}

export function required(message = '必填项，请填写'): FieldValidator {
  return (value) => (value.trim() ? null : message)
}

export function minLength(min: number, message = `长度至少 ${min} 个字符`): FieldValidator {
  return (value) => (value.trim().length >= min ? null : message)
}

export function pattern(regexp: RegExp, message: string): FieldValidator {
  return (value) => (value.trim() === '' || regexp.test(value) ? null : message)
}

export function phone(message = '手机号格式不正确'): FieldValidator {
  return (value) => (value.trim() === '' || /^1[3-9]\d{9}$/.test(value) ? null : message)
}

export function integer(message = '请输入整数'): FieldValidator {
  return (value) => (value.trim() === '' || /^\d+$/.test(value) ? null : message)
}

export function compose(...validators: FieldValidator[]): FieldValidator {
  return (value) => {
    for (const validator of validators) {
      const error = validator(value)
      if (error) return error
    }
    return null
  }
}
