/** Client-safe attachment utilities */

export type AttachmentInfo = {
  name: string
  path: string
  size: number
  type: string
}

/** Parse attachments JSON safely (client-safe). Normalises legacy string[] format. */
export function parseAttachments(json: string | null): AttachmentInfo[] {
  if (!json) return []
  try {
    const raw = JSON.parse(json)
    if (!Array.isArray(raw)) return []
    return raw.map((item: unknown) => {
      // Legacy format: plain string filename → normalise to AttachmentInfo
      if (typeof item === 'string') {
        const name = item.replace(/^\d+-/, '') // strip timestamp prefix if present
        return { name, path: `/uploads/${item}`, size: 0, type: '' }
      }
      // Current format: AttachmentInfo object
      return item as AttachmentInfo
    })
  } catch { return [] }
}
