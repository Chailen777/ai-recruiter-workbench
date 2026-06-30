/**
 * 共享工具函数 — 供各 actions 子模块复用（纯工具函数，不需要 'use server'）
 */

import type { ActionResult } from '@/lib/form'

export function value(formData: FormData, key: string) {
  const raw = formData.get(key)
  const text = typeof raw === 'string' ? raw.trim() : ''
  return text || null
}

export function multiValue(formData: FormData, key: string) {
  const values = formData
    .getAll(key)
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
  return values.length ? values.join('、') : null
}

export function cityValue(formData: FormData) {
  const cities = formData
    .getAll('city')
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
  const customCity = value(formData, 'customCity')
  if (customCity && !cities.includes(customCity)) {
    cities.push(customCity)
  }
  return cities.length ? cities.join('、') : null
}

export function intValue(formData: FormData, key: string) {
  const text = value(formData, key)
  if (!text) return null
  const num = Number(text)
  return Number.isFinite(num) ? num : null
}

export function requiredValue(formData: FormData, key: string) {
  return value(formData, key) ?? ''
}

export function jsonListValue(formData: FormData, key: string) {
  const text = value(formData, key)
  if (!text) return '[]'
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? JSON.stringify(parsed) : '[]'
  } catch {
    return JSON.stringify([text])
  }
}

export function actionError(message: string, errors: Record<string, string> = {}): ActionResult {
  return { errors, message, success: false }
}

export function actionSuccess(): ActionResult {
  return { success: true }
}

export function collectErrors(error: unknown): Record<string, string> {
  if (error instanceof Error && 'meta' in error) {
    const prismaError = error as Error & { meta?: { target?: string[] } }
    const target = prismaError.meta?.target?.[0]
    if (target) return { [target]: '该值已存在或格式不正确' }
  }
  return {}
}
