import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import type { AttachmentInfo } from './attachment-utils'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const AVATAR_DIR = join(process.cwd(), 'public', 'uploads', 'avatars')
const COVER_DIR = join(process.cwd(), 'public', 'uploads', 'covers')

/** 单文件最大允许上传大小：20MB */
const MAX_FILE_SIZE = 20 * 1024 * 1024

/** 允许上传的文件 MIME 类型白名单 */
const ALLOWED_MIME_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 文本
  'text/plain',
  'text/csv',
  'text/markdown',
]

/** Ensure upload directory exists */
async function ensureDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

/**
 * 将单个文件保存到 UPLOAD_DIR，返回 AttachmentInfo
 */
async function saveOneAttachment(file: File): Promise<AttachmentInfo> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件 "${file.name}" 超过 20MB 限制（实际：${(file.size / 1024 / 1024).toFixed(1)}MB）`)
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`不支持的文件类型: ${file.type || '未知'}。支持的格式: 图片(JPG/PNG/GIF/WebP/SVG)、文档(PDF/Word/Excel/PPT)、文本(TXT/CSV/Markdown)`)
  }
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_()\u4e00-\u9fff]/g, '_')
  const filename = `${timestamp}-${Math.random().toString(36).slice(2, 7)}-${safeName}`
  const filepath = join(UPLOAD_DIR, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)
  return {
    name: file.name,
    path: `/uploads/${filename}`,
    size: file.size,
    type: file.type,
  }
}

/**
 * Process attachment form fields: save new files, keep existing ones, delete removed ones.
 *
 * Form fields used:
 *   [prefix]New       – File[]  new uploads
 *   [prefix]Existing  – string  JSON of kept existing attachments
 *   [prefix]Deleted   – string[] paths to delete
 */
export async function processAttachments(
  formData: FormData,
  prefix: string,
): Promise<string> {
  await ensureDir()

  const kept: AttachmentInfo[] = []

  // 1. Keep existing attachments that weren't deleted
  const existingJson = formData.get(`${prefix}Existing`) as string | null
  if (existingJson) {
    try {
      const existing: AttachmentInfo[] = JSON.parse(existingJson)
      const deleted = formData.getAll(`${prefix}Deleted`) as string[]
      // 并发删除标记移除的文件
      await Promise.all(
        existing.map(async (att) => {
          if (!deleted.includes(att.path)) {
            kept.push(att)
          } else {
            const fullPath = join(process.cwd(), 'public', att.path.replace(/^\//, ''))
            try { await unlink(fullPath) } catch { /* file may not exist */ }
          }
        })
      )
    } catch { /* invalid JSON, skip */ }
  }

  // 2. 并发保存新上传文件
  const newFiles = (formData.getAll(`${prefix}New`) as File[]).filter((f) => f && f.size > 0)
  if (newFiles.length > 0) {
    const saved = await Promise.all(newFiles.map(saveOneAttachment))
    kept.push(...saved)
  }

  return JSON.stringify(kept)
}

/** Delete all attachments for a given JSON string */
export async function deleteAllAttachments(attachmentsJson: string | null) {
  if (!attachmentsJson) return
  try {
    const attachments: AttachmentInfo[] = JSON.parse(attachmentsJson)
    for (const att of attachments) {
      const fullPath = join(process.cwd(), 'public', att.path.replace(/^\//, ''))
      try { await unlink(fullPath) } catch { /* file may not exist */ }
    }
  } catch { /* invalid JSON */ }
}

/**
 * Save an avatar image file. Returns the public path, or null if no file.
 * Deletes the previous avatar if provided.
 */
export async function saveAvatar(
  formData: FormData,
  previousAvatar?: string | null,
): Promise<string | null> {
  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) {
    // No new upload: keep existing, unless the form explicitly says to remove it
    if (formData.get('avatarRemove') === '1') {
      await deleteAvatarFile(previousAvatar)
      return null
    }
    return previousAvatar ?? null
  }

  // Delete old avatar file
  await deleteAvatarFile(previousAvatar)

  // Ensure directory exists
  if (!existsSync(AVATAR_DIR)) {
    await mkdir(AVATAR_DIR, { recursive: true })
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_()\u4e00-\u9fff]/g, '_')
  const filename = `${timestamp}-${safeName}`
  const filepath = join(AVATAR_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return `/uploads/avatars/${filename}`
}

/** Delete a single avatar file from disk */
async function deleteAvatarFile(avatar: string | null | undefined) {
  if (!avatar) return
  const fullPath = join(process.cwd(), 'public', avatar.replace(/^\//, ''))
  try { await unlink(fullPath) } catch { /* file may not exist */ }
}

/** Delete avatar file (public API for delete actions) */
export async function removeAvatar(avatar: string | null | undefined) {
  await deleteAvatarFile(avatar)
}

/**
 * Save a cover image file (rectangle, same pattern as avatar).
 * Saves to uploads/covers/. Returns the public path, or null.
 */
export async function saveCover(
  formData: FormData,
  previousCover?: string | null,
): Promise<string | null> {
  const file = formData.get('cover') as File | null
  if (!file || file.size === 0) {
    if (formData.get('coverRemove') === '1') {
      await deleteCoverFile(previousCover)
      return null
    }
    return previousCover ?? null
  }

  await deleteCoverFile(previousCover)

  if (!existsSync(COVER_DIR)) {
    await mkdir(COVER_DIR, { recursive: true })
  }

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_()\u4e00-\u9fff]/g, '_')
  const filename = `${timestamp}-${safeName}`
  const filepath = join(COVER_DIR, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return `/uploads/covers/${filename}`
}

/** Delete a single cover file from disk */
async function deleteCoverFile(cover: string | null | undefined) {
  if (!cover) return
  const fullPath = join(process.cwd(), 'public', cover.replace(/^\//, ''))
  try { await unlink(fullPath) } catch { /* file may not exist */ }
}

/** Delete cover file (public API for delete actions) */
export async function removeCover(cover: string | null | undefined) {
  await deleteCoverFile(cover)
}
