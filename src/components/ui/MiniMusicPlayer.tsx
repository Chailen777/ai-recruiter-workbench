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
    togglePlay, prevTrack, nextTrack, stop,
  } = useMusic()

  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  const currentTrack: MusicTrack | null = currentIndex >= 0 ? tracks[currentIndex] : null

  // 有曲目就显示（即使没在播放）
  useEffect(() => {
    if (tracks.length > 0) {
      setVisible(true)
    }
  }, [tracks.length])

  // 展开后 4 秒自动收起
  useEffect(() => {
    if (!expanded) return
    const timer = setTimeout(() => setExpanded(false), 4000)
    return () => clearTimeout(timer)
  }, [expanded, isPlaying])

  // 有音乐就显示迷你播放器（即使没在播放）
  // tracks.length === 0 时不显示
  if (!visible) return null

  return (
    <div className={`mini-music-player ${expanded ? 'is-expanded' : ''} ${isPlaying ? 'is-playing' : ''} ${currentIndex < 0 ? 'is-idle' : ''}`}>
      {/* 收起状态：小圆形 */}
      <button
        type="button"
        className="mini-toggle"
        onClick={() => setExpanded(!expanded)}
        title={currentTrack ? currentTrack.name : '音乐'}
      >
        {isPlaying ? (
          <AudioBars playing={true} />
        ) : (
          <span className="mini-music-note">♪</span>
        )}
      </button>

      {/* 展开状态 */}
      <div className="mini-info">
        <button
          type="button"
          className="mini-close"
          onClick={() => { setExpanded(false); stop() }}
        >
          ×
        </button>
        {currentTrack ? (
          <>
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
          </>
        ) : (
          <div className="mini-track-name">点击音乐图标</div>
        )}
      </div>
    </div>
  )
}
