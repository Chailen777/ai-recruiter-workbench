'use client'

import { useState, useEffect } from 'react'
import { useMusic, type MusicTrack } from '@/components/providers/MusicProvider'

/** 等宽律动条（模拟音响频谱跳动） */
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

export function MiniMusicPlayer() {
  const {
    tracks, currentIndex, isPlaying,
    togglePlay, prevTrack, nextTrack,
  } = useMusic()

  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  const currentTrack: MusicTrack | null = currentIndex >= 0 ? tracks[currentIndex] : null

  // 有选中的曲目才显示
  useEffect(() => {
    if (currentIndex >= 0) {
      setVisible(true)
    } else {
      setVisible(false)
      setExpanded(false)
    }
  }, [currentIndex])

  // 展开后 4 秒自动收起
  useEffect(() => {
    if (!expanded) return
    const timer = setTimeout(() => setExpanded(false), 4000)
    return () => clearTimeout(timer)
  }, [expanded, isPlaying])

  if (!visible || !currentTrack) return null

  return (
    <div className={`mini-music-player ${expanded ? 'is-expanded' : ''} ${isPlaying ? 'is-playing' : ''}`}>
      {/* 收起状态：小圆形 */}
      <button
        type="button"
        className="mini-toggle"
        onClick={() => setExpanded(!expanded)}
        title={currentTrack.name}
      >
        <AudioBars playing={isPlaying} />
      </button>

      {/* 展开状态：完整信息 */}
      <div className="mini-info">
        <button
          type="button"
          className="mini-close"
          onClick={() => setExpanded(false)}
        >
          ×
        </button>
        <div className="mini-track-name">{currentTrack.name}</div>
        <div className="mini-track-artist">{currentTrack.artist}</div>
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
      </div>
    </div>
  )
}
