'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

/* ── 内置音乐列表 ── */
const BUILT_IN_TRACKS = [
  { id: 'b1', name: '轻音乐 - 清晨', artist: '免版权', url: '/music/morning.mp3', type: 'light' },
  { id: 'b2', name: '轻音乐 - 宁静', artist: '免版权', url: '/music/peace.mp3', type: 'light' },
  { id: 'b3', name: '中国风 - 山水之间', artist: '免版权', url: '/music/chinese.mp3', type: 'chinese' },
  { id: 'b4', name: '80后 - 经典回忆', artist: '免版权', url: '/music/80s.mp3', type: '80s' },
]

export function MusicPlayer() {
  const [tracks, setTracks] = useState(BUILT_IN_TRACKS)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [customTracks, setCustomTracks] = useState<typeof BUILT_IN_TRACKS>([])

  // 加载本地存储的自定义音乐
  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom-music-tracks')
      if (saved) {
        const parsed = JSON.parse(saved)
        setCustomTracks(parsed)
        setTracks([...BUILT_IN_TRACKS, ...parsed])
      }
    } catch {}
  }, [])

  // 播放/暂停
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      if (currentIndex < 0) {
        setCurrentIndex(0)
        return
      }
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, currentIndex])

  // 上一首
  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return
    const newIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1
    setCurrentIndex(newIndex)
    setIsPlaying(true)
  }, [currentIndex, tracks.length])

  // 下一首
  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return
    const newIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(newIndex)
    setIsPlaying(true)
  }, [currentIndex, tracks.length])

  // 上传本地音乐
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newTracks: typeof BUILT_IN_TRACKS = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('audio/')) continue
      const url = URL.createObjectURL(file)
      newTracks.push({
        id: `custom-${Date.now()}-${i}`,
        name: file.name.replace(/\.[^.]+$/, ''),
        artist: '本地上传',
        url,
        type: 'custom',
      })
    }

    if (newTracks.length > 0) {
      const updated = [...customTracks, ...newTracks]
      setCustomTracks(updated)
      setTracks([...BUILT_IN_TRACKS, ...updated])
      localStorage.setItem('custom-music-tracks', JSON.stringify(updated))
    }

    e.target.value = ''
  }, [customTracks])

  // 当 currentIndex 变化时，加载并播放
  useEffect(() => {
    if (currentIndex < 0 || !audioRef.current) return
    const track = tracks[currentIndex]
    if (!track) return

    audioRef.current.src = track.url
    if (isPlaying) {
      audioRef.current.play()
    }
  }, [currentIndex])

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => nextTrack()

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [nextTrack])

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] : null
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="music-player">
      <audio ref={audioRef} preload="metadata" />

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
      <div className="music-progress">
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
            onClick={() => { setCurrentIndex(i); setIsPlaying(true) }}
          >
            <span className="music-list-icon">{i === currentIndex && isPlaying ? '🎵' : '♪'}</span>
            <span className="music-list-name">{track.name}</span>
            <span className="music-list-artist">{track.artist}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
