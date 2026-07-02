'use client'

import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

/* ── 类型定义 ── */
export type MusicTrack = {
  id: string
  name: string
  artist: string
  url: string
  type: string
}

type MusicContextType = {
  tracks: MusicTrack[]
  addCustomTracks: (newTracks: MusicTrack[]) => void
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  play: (index?: number) => void
  pause: () => void
  togglePlay: () => void
  prevTrack: () => void
  nextTrack: () => void
  seek: (time: number) => void
}

const MusicContext = createContext<MusicContextType | null>(null)

/* ── 内置音乐列表（用确认可播放的真实音乐链接） ── */
const BUILT_IN_TRACKS: MusicTrack[] = [
  { id: 'b1', name: '轻音乐 - 清晨', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', type: 'light' },
  { id: 'b2', name: '轻音乐 - 午后', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', type: 'light' },
  { id: 'b3', name: '轻音乐 - 星空', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', type: 'light' },
  { id: 'b4', name: '轻音乐 - 晚风', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', type: 'light' },
  { id: 'c1', name: '中国风 - 山水', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', type: 'chinese' },
  { id: 'c2', name: '中国风 - 古道', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', type: 'chinese' },
  { id: 'r1', name: '80年代 - 回忆', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', type: '80s' },
  { id: 'r2', name: '80年代 - 青春', artist: 'SoundHelix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', type: '80s' },
]

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [tracks, setTracks] = useState<MusicTrack[]>(BUILT_IN_TRACKS)
  const [customTracks, setCustomTracks] = useState<MusicTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // 加载本地存储的自定义音乐
  useEffect(() => {
    try {
      const saved = localStorage.getItem('custom-music-tracks')
      if (saved) {
        const parsed: MusicTrack[] = JSON.parse(saved)
        setCustomTracks(parsed)
        setTracks(BUILT_IN_TRACKS.concat(parsed))
      }
    } catch { /* ignore */ }
  }, [])

  // 当播放状态变化时，更新 body 属性（用于导航条发光效果）
  useEffect(() => {
    document.body.setAttribute('data-music-playing', isPlaying ? 'true' : 'false')
    return () => {
      document.body.setAttribute('data-music-playing', 'false')
    }
  }, [isPlaying])

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => nextTrack()

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  // 当 currentIndex 变化时，加载音乐
  useEffect(() => {
    if (currentIndex < 0 || !audioRef.current) return
    const track = tracks[currentIndex]
    if (!track) return

    audioRef.current.src = track.url
    audioRef.current.load()
    audioRef.current.play().catch((e) => {
      console.warn('播放失败:', track.name, e)
    })
  }, [currentIndex])

  const addCustomTracks = useCallback((newTracks: MusicTrack[]) => {
    const updated = [...customTracks, ...newTracks]
    setCustomTracks(updated)
    setTracks([...BUILT_IN_TRACKS, ...updated])
    localStorage.setItem('custom-music-tracks', JSON.stringify(updated))
  }, [customTracks])

  const play = useCallback((index?: number) => {
    if (!audioRef.current) return
    if (index !== undefined && index >= 0 && index < tracks.length) {
      setCurrentIndex(index)
      return
    }
    if (currentIndex < 0 && tracks.length > 0) {
      setCurrentIndex(0)
      return
    }
    audioRef.current.play().catch((e) => {
      console.warn('播放失败:', e)
    })
  }, [currentIndex, tracks.length])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const prevTrack = useCallback(() => {
    if (tracks.length === 0) return
    const newIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1
    setCurrentIndex(newIndex)
  }, [currentIndex, tracks.length])

  const nextTrack = useCallback(() => {
    if (tracks.length === 0) return
    const newIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(newIndex)
  }, [currentIndex, tracks.length])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  return (
    <MusicContext.Provider value={{
      tracks, addCustomTracks,
      currentIndex, isPlaying, currentTime, duration,
      play, pause, togglePlay, prevTrack, nextTrack, seek,
    }}>
      {/* 全局共享的 audio 元素 */}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const ctx = useContext(MusicContext)
  if (!ctx) {
    throw new Error('useMusic must be used within a MusicProvider')
  }
  return ctx
}
