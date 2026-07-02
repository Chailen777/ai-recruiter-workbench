'use client'

import { useCallback, useRef, useState } from 'react'
import { useMusic, type LoopMode } from '@/components/providers/MusicProvider'

/** 时间格式化 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const LOOP_ICONS: Record<LoopMode, string> = { all: '🔁', one: '🔂', none: '🔁' }
const LOOP_LABELS: Record<LoopMode, string> = { all: '列表循环', one: '单曲循环', none: '顺序播放' }

export function MusicPlayer({ onBack }: { onBack?: () => void }) {
  const {
    tracks, folders, addCustomMusic, removeCustomTrack,
    addFolder, removeFolder, renameFolder, moveTrackToFolder,
    currentIndex, isPlaying, currentTime, duration, loopMode, setLoopMode,
    play, togglePlay, prevTrack, nextTrack, seek,
  } = useMusic()

  const progressRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── UI 状态 ──
  const [activeFolder, setActiveFolder] = useState('default')
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameTarget, setRenameTarget] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [contextTrackId, setContextTrackId] = useState<string | null>(null)

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // 当前文件夹内的曲目
  const folderTracks = tracks.filter((t) => t.folderId === activeFolder)
  const otherFolderTracks = tracks.filter((t) => t.folderId !== activeFolder)

  // ── 进度条点击 ──
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(ratio * duration)
  }, [duration, seek])

  // ── 上传 ──
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const audioFiles = Array.from(files).filter((f) => f.type.startsWith('audio/'))
    if (audioFiles.length > 0) addCustomMusic(audioFiles, activeFolder)
    e.target.value = ''
  }, [addCustomMusic, activeFolder])

  // ── 文件夹操作 ──
  const handleAddFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    addFolder(name)
    setNewFolderName('')
    setShowAddFolder(false)
  }

  const handleRenameFolder = () => {
    if (!renameTarget || !renameValue.trim()) return
    renameFolder(renameTarget, renameValue.trim())
    setRenameTarget(null)
    setRenameValue('')
  }

  const handleDeleteFolder = (id: string) => {
    if (id === 'default') return
    removeFolder(id)
    setActiveFolder('default')
  }

  const nextLoop = () => {
    const order: LoopMode[] = ['all', 'one', 'none']
    const idx = order.indexOf(loopMode)
    setLoopMode(order[(idx + 1) % order.length])
  }

  // 在 folderTracks 中找到 currentTrack 的索引，用于全局播放
  const handlePlayInFolder = (trackId: string) => {
    const idx = tracks.findIndex((t) => t.id === trackId)
    if (idx >= 0) play(idx)
  }

  // 移动曲目到文件夹
  const handleMoveTrack = (trackId: string, folderId: string) => {
    moveTrackToFolder(trackId, folderId)
    setContextTrackId(null)
  }

  return (
    <div className="music-player">
      {/* ══════ 顶部栏：返回 + 标题 + 添加音乐 ══════ */}
      <div className="music-topbar">
        {onBack && (
          <button type="button" className="music-back-btn" onClick={onBack} title="返回笔记">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M15 18l-7-7 7-7" />
            </svg>
          </button>
        )}
        <span className="music-topbar-title">音乐</span>
        <button
          type="button"
          className="music-add-btn"
          onClick={() => fileInputRef.current?.click()}
          title="添加音乐"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
            <line x1="10" y1="3" x2="10" y2="17" />
            <line x1="3" y1="10" x2="17" y2="10" />
          </svg>
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
      </div>

      {/* ══════ 当前播放信息 ══════ */}
      <div className="music-now-playing">
        {currentTrack ? (
          <>
            <div className="music-track-cover">
              <span className="music-cover-icon">{isPlaying ? '🎵' : '🎶'}</span>
            </div>
            <div className="music-track-name">{currentTrack.name}</div>
            <div className="music-track-artist">{currentTrack.artist}</div>
          </>
        ) : (
          <div className="music-track-name" style={{ opacity: 0.5 }}>选择音乐开始播放</div>
        )}
      </div>

      {/* ══════ 进度条 ══════ */}
      <div ref={progressRef} className="music-progress" onClick={handleProgressClick}>
        <div className="music-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="music-time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* ══════ 播放控制 ══════ */}
      <div className="music-controls">
        <button type="button" className="music-btn music-btn-loop" onClick={nextLoop} title={LOOP_LABELS[loopMode]}>
          <span style={{ opacity: loopMode === 'none' ? 0.3 : 1 }}>{LOOP_ICONS[loopMode]}</span>
        </button>
        <button type="button" className="music-btn" onClick={prevTrack} title="上一首">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M16 3l-9 7 9 7z" />
            <rect x="2" y="3" width="2" height="14" />
          </svg>
        </button>
        <button type="button" className="music-btn music-btn-play" onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
          {isPlaying ? (
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <rect x="4" y="2" width="4" height="16" rx="1" />
              <rect x="12" y="2" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" width="22" height="22">
              <path d="M5 3l14 7-14 7z" />
            </svg>
          )}
        </button>
        <button type="button" className="music-btn" onClick={nextTrack} title="下一首">
          <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path d="M4 3l9 7-9 7z" />
            <rect x="14" y="3" width="2" height="14" />
          </svg>
        </button>
        <button type="button" className="music-btn music-btn-loop" style={{ visibility: 'hidden' }} />
      </div>

      {/* ══════ 文件夹标签栏 ══════ */}
      <div className="music-folders">
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`music-folder-tab ${activeFolder === f.id ? 'is-active' : ''}`}
            onClick={() => setActiveFolder(f.id)}
            onDoubleClick={() => {
              if (f.id !== 'default') {
                setRenameTarget(f.id)
                setRenameValue(f.name)
              }
            }}
          >
            {renameTarget === f.id ? (
              <input
                className="music-folder-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameFolder}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameFolder() }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <>
                <span className="music-folder-name">{f.name}</span>
                <span className="music-folder-count">{tracks.filter((t) => t.folderId === f.id).length}</span>
              </>
            )}
            {/* 删除文件夹（非默认文件夹） */}
            {f.id !== 'default' && (
              <button
                type="button"
                className="music-folder-del"
                onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id) }}
                title="删除文件夹"
              >
                ×
              </button>
            )}
          </button>
        ))}
        {/* 添加文件夹 */}
        {showAddFolder ? (
          <div className="music-folder-tab music-folder-add">
            <input
              className="music-folder-add-input"
              placeholder="文件夹名"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleAddFolder}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setShowAddFolder(false) }}
              autoFocus
            />
          </div>
        ) : (
          <button type="button" className="music-folder-tab music-folder-add-btn" onClick={() => setShowAddFolder(true)} title="新建文件夹">
            +
          </button>
        )}
      </div>

      {/* ══════ 音乐列表 ══════ */}
      <div className="music-list">
        {folderTracks.length === 0 ? (
          <div className="music-empty">
            <span className="music-empty-icon">🎶</span>
            <p>这个文件夹还是空的</p>
            <p className="music-empty-hint">点击右上角 + 添加音乐</p>
          </div>
        ) : (
          folderTracks.map((track, i) => {
            const globalIdx = tracks.findIndex((t) => t.id === track.id)
            return (
              <div
                key={track.id}
                className={`music-list-item ${globalIdx === currentIndex ? 'is-playing' : ''}`}
                onClick={() => handlePlayInFolder(track.id)}
              >
                <span className="music-list-idx">{i + 1}</span>
                <div className="music-list-info">
                  <span className="music-list-name">{track.name}</span>
                  <span className="music-list-artist">{track.artist}</span>
                </div>
                <span className="music-list-dur">--:--</span>
                {/* 更多操作 */}
                {track.type === 'custom' && (
                  <div className="music-list-actions">
                    {/* 移动到文件夹 */}
                    <div className="music-move-menu">
                      <button
                        type="button"
                        className="music-move-trigger"
                        onClick={(e) => {
                          e.stopPropagation()
                          setContextTrackId(contextTrackId === track.id ? null : track.id)
                        }}
                        title="移动到文件夹"
                      >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14">
                          <path d="M3 7h14M6 3l-3 4 3 4M14 17l3-4-3-4" />
                        </svg>
                      </button>
                      {contextTrackId === track.id && (
                        <div className="music-move-dropdown">
                          {folders.filter((f) => f.id !== activeFolder).map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              className="music-move-option"
                              onClick={(e) => { e.stopPropagation(); handleMoveTrack(track.id, f.id) }}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 删除 */}
                    <button
                      type="button"
                      className="music-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCustomTrack(track.id)
                      }}
                      title="删除"
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14">
                        <path d="M4 6h12M7 6v10h6V6M8 6V4h4v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
