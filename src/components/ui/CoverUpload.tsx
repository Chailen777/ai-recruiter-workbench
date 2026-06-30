'use client'

import { useState, useCallback } from 'react'

type CoverUploadProps = {
  current?: string | null
  name: string
}

export function CoverUpload({ current, name }: CoverUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)

  const src = removed ? null : (preview ?? current ?? null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      setRemoved(false)
    }
  }, [])

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreview(null)
    setRemoved(true)
  }, [])

  return (
    <div className="cover-upload-area">
      <label className="cover-upload-label">
        {src ? (
          <img
            alt="封面预览"
            className="cover-preview-img"
            src={src}
          />
        ) : (
          <div className="cover-upload-placeholder">
            <svg fill="none" height="48" viewBox="0 0 24 24" width="48">
              <path
                d="M12 16V4m0 0L8 8m4-4l4 4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>点击上传封面</span>
          </div>
        )}
        <input
          accept="image/*"
          hidden
          name={name}
          type="file"
          onChange={handleChange}
        />
      </label>
      {src && (
        <button
          className="cover-remove-btn"
          onClick={handleRemove}
          title="删除封面"
          type="button"
        >
          ×
        </button>
      )}
      <input name={`${name}Remove`} type="hidden" value={removed ? '1' : '0'} />
    </div>
  )
}
