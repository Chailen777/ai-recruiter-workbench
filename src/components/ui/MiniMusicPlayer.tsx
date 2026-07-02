'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useMusic, type MusicTrack, type LoopMode } from '@/components/providers/MusicProvider'

/** 律动条 */
function AudioBars({ playing }: { playing: boolean }) {
  return (
    <span className="mini-audio-bars">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`mini-bar ${playing ? 'is-playing' : ''}`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

/** 循环模式图标 */
function LoopIcon({ mode }: { mode: LoopMode }) {
  if (mode === 'one') return <span className="mini-loop-icon">🔂</span>
  if (mode === 'all') return <span className="mini-loop-icon">🔁</span>
  return <span className="mini-loop-icon" style={{ opacity: 0.4 }}>🔁</span>
}

export function MiniMusicPlayer({ onSwitchView }: { onSwitchView?: () => void }) {
  const {
    tracks, currentIndex, isPlaying, loopMode, setLoopMode,
    togglePlay, prevTrack, nextTrack, play, stop,
  } = useMusic()

  const [expanded, setExpanded] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // 双击检测
  const lastTapRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTrack: MusicTrack | null = currentIndex >= 0 ? tracks[currentIndex] : null

  // 从音乐页面播放后，自动取消 dismiss
  useEffect(() => {
    if (isPlaying && dismissed) {
      setDismissed(false)
    }
  }, [isPlaying, dismissed])

  // tracks 变化时重置 dismiss
  useEffect(() => {
    if (tracks.length > 0 && dismissed) {
      setDismissed(false)
    }
  }, [tracks.length])

  const nextLoop = () => {
    const order: LoopMode[] = ['all', 'one', 'none']
    const idx = order.indexOf(loopMode)
    setLoopMode(order[(idx + 1) % order.length])
  }

  // 单击 → 展开/收起面板
  const handleToggleClick = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 350) {
      // 双击 → 进入音乐页面
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
      onSwitchView?.()
      return
    }
    lastTapRef.current = now

    tapTimerRef.current = setTimeout(() => {
      setExpanded((prev) => !prev)
    }, 350)
  }, [onSwitchView])

  // 展开后 16 秒自动收起
  useEffect(() => {
    if (!expanded) return
    const timer = setTimeout(() => setExpanded(false), 16000)
    return () => clearTimeout(timer)
  }, [expanded, isPlaying])

  // 没有音乐或已 dismiss 时不显示（必须放在所有 hooks 之后）
  if (tracks.length === 0 || dismissed) return null

  return (
    <div className={`mini-music-player ${expanded ? 'is-expanded' : ''} ${isPlaying ? 'is-playing' : ''}`}>
      {/* 小圆形按钮 */}
      <button
        type="button"
        className="mini-toggle"
        onClick={handleToggleClick}
        title={currentTrack ? currentTrack.name : '双击进入音乐页面'}
      >
        {isPlaying ? (
          <AudioBars playing={true} />
        ) : currentTrack ? (
          <span className="mini-music-note">♪</span>
        ) : (
          <span className="mini-music-note" style={{ opacity: 0.5 }}>♪</span>
        )}
      </button>

      {/* 展开面板 */}
      <div className="mini-info">
        {/* 当前歌曲信息 */}
        {currentTrack ? (
          <>
            <div className="mini-track-name">{currentTrack.name}</div>
            <div className="mini-track-artist">{currentTrack.artist}</div>
          </>
        ) : (
          <div className="mini-track-name" style={{ opacity: 0.6 }}>未在播放</div>
        )}

        {/* 播放控制 + 循环 */}
        <div className="mini-controls">
          <button type="button" onClick={(e) => { e.stopPropagation(); prevTrack() }} title="上一首">
            ⏮
          </button>
          <button
            type="button"
            className="mini-play-btn"
            onClick={(e) => { e.stopPropagation(); togglePlay() }}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); nextTrack() }} title="下一首">
            ⏭
          </button>
        </div>

        {/* 循环 + 播放列表按钮行 */}
        <div className="mini-extra-actions">
          <button type="button" className="mini-action-btn" onClick={(e) => { e.stopPropagation(); nextLoop() }} title={`循环模式: ${loopMode === 'all' ? '列表循环' : loopMode === 'one' ? '单曲循环' : '不循环'}`}>
            <LoopIcon mode={loopMode} />
          </button>
          <button type="button" className="mini-action-btn" onClick={(e) => { e.stopPropagation(); setShowPlaylist(!showPlaylist) }} title="播放列表">
            📋
          </button>
        </div>

        {/* 播放列表（展开时显示） */}
        {showPlaylist && (
          <div className="mini-playlist">
            {tracks.map((t, i) => (
              <div
                key={t.id}
                className={`mini-playlist-item ${i === currentIndex ? 'is-active' : ''}`}
                onClick={(e) => { e.stopPropagation(); play(i) }}
              >
                <span className="mini-playlist-idx">{i + 1}</span>
                <span className="mini-playlist-name">{t.name}</span>
                <span className="mini-playlist-artist">{t.artist}</span>
              </div>
            ))}
          </div>
        )}

        {/* 底部两个按钮：退出音乐 / 隐藏面板 */}
        <div className="mini-bottom-actions">
          <button
            type="button"
            className="mini-bottom-btn mini-exit-btn"
            onClick={(e) => {
              e.stopPropagation()
              stop()
              setDismissed(true)
              setExpanded(false)
              setShowPlaylist(false)
            }}
            title="退出音乐"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>
          <button
            type="button"
            className="mini-bottom-btn mini-hide-btn"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); setShowPlaylist(false) }}
            title="隐藏面板"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
              <polyline points="16,10 10,16 4,10" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
