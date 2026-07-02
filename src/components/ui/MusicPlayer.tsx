'use client'

import { useCallback, useRef } from 'react'
import { useMusic } from '@/components/providers/MusicProvider'

/** 时间格式化 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MusicPlayer({ onBack }: { onBack?: () => void }) {
  const {
    tracks, addCustomMusic, removeCustomTrack,
    currentIndex, isPlaying, currentTime, duration,
    play, togglePlay, prevTrack, nextTrack, seek,
  } = useMusic()

  const progressRef = useRef<HTMLDivElement>(null)

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(ratio * duration)
  }, [duration, seek])

  // 上传本地音乐 → 存入 IndexedDB（持久化）
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const audioFiles = Array.from(files).filter((f) => f.type.startsWith('audio/'))
    if (audioFiles.length > 0) {
      addCustomMusic(audioFiles)
    }
    e.target.value = ''
  }, [addCustomMusic])

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="music-player">
      {/* 顶部导航：返回按钮 */}
      {onBack && (
        <div className="music-header">
          <button type="button" className="music-back-btn" onClick={onBack} title="返回笔记">
            ← 返回
          </button>
          <span className="music-header-title">🎵 音乐</span>
          <span className="music-header-spacer" />
        </div>
      )}

      {/* 当前播放信息 */}
      <div className="music-now-playing">
        {currentTrack ? (
          <>
            <div className="music-track-name">{currentTrack.name}</div>
            <div className="music-track-artist">{currentTrack.artist}</div>
          </>
        ) : (
          <div className="music-track-name">选择一首音乐开始播放</div>
        )}
      </div>

      {/* 进度条 */}
      <div
        ref={progressRef}
        className="music-progress"
        onClick={handleProgressClick}
      >
        <div className="music-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="music-time">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* 播放控制 */}
      <div className="music-controls">
        <button type="button" className="music-btn" onClick={prevTrack} title="上一首">⏮</button>
        <button type="button" className="music-btn music-btn-play" onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button type="button" className="music-btn" onClick={nextTrack} title="下一首">⏭</button>
      </div>

      {/* 音乐列表 */}
      <div className="music-list">
        <div className="music-list-header">
          <span>音乐列表 ({tracks.length})</span>
          <label className="music-upload-btn">
            + 添加音乐
            <input type="file" accept="audio/*" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
        {tracks.map((track, i) => (
          <div
            key={track.id}
            className={`music-list-item ${i === currentIndex ? 'is-playing' : ''}`}
            onClick={() => play(i)}
          >
            <span className="music-list-icon">{i === currentIndex && isPlaying ? '🎵' : '♪'}</span>
            <span className="music-list-name">{track.name}</span>
            <span className="music-list-artist">{track.artist}</span>
            {/* 只有自定义音乐才显示删除按钮 */}
            {track.type === 'custom' && (
              <button
                type="button"
                className="music-delete-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  removeCustomTrack(track.id)
                }}
                title="删除这首音乐"
              >
                🗑
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
