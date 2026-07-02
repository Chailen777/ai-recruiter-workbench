'use client'

import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { saveMusicFile, loadMusicFile, deleteMusicFile } from '@/lib/music-storage'

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
  addCustomMusic: (files: File[]) => Promise<void>
  removeCustomTrack: (id: string) => void
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
  stop: () => void
}

const MusicContext = createContext<MusicContextType | null>(null)

/* ── 内置音乐列表 ── */
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
  const [customMeta, setCustomMeta] = useState<MusicTrack[]>([]) // 元数据（url 为占位符，运行时从 IndexedDB 加载）
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)

  // ── 启动时：从 localStorage 加载元数据 + 从 IndexedDB 重建 Blob URL ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const saved = localStorage.getItem('custom-music-meta')
        if (!saved) { setReady(true); return }

        const meta: MusicTrack[] = JSON.parse(saved)
        // 为每首自定义音乐从 IndexedDB 重建 blob URL
        const restored: MusicTrack[] = []
        for (const m of meta) {
          const blobUrl = await loadMusicFile(m.id)
          if (blobUrl) {
            restored.push({ ...m, url: blobUrl })
          }
          // 如果 IndexedDB 中找不到文件（被清除），跳过该项
        }

        if (cancelled) return
        setCustomMeta(meta)
        setTracks(BUILT_IN_TRACKS.concat(restored))
      } catch { /* ignore */ }
      if (!cancelled) setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  // ── 当播放状态变化时，更新 body 属性（导航条发光效果）──
  useEffect(() => {
    document.body.setAttribute('data-music-playing', isPlaying ? 'true' : 'false')
    return () => {
      document.body.setAttribute('data-music-playing', 'false')
    }
  }, [isPlaying])

  // ── 音频事件监听 ──
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

  // ── 当 currentIndex 变化时，加载音乐 ──
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

  // ── 添加自定义音乐（接收 File[]，存入 IndexedDB）──
  const addCustomMusic = useCallback(async (files: File[]) => {
    const newMeta: MusicTrack[] = []
    const newTracks: MusicTrack[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('audio/')) continue

      const id = `custom-${Date.now()}-${i}`
      const blobUrl = URL.createObjectURL(file)
      const name = file.name.replace(/\.[^.]+$/, '')

      // 保存文件到 IndexedDB
      await saveMusicFile(id, file)

      newMeta.push({ id, name, artist: '本地上传', url: blobUrl, type: 'custom' })
      newTracks.push({ id, name, artist: '本地上传', url: blobUrl, type: 'custom' })
    }

    if (newMeta.length === 0) return

    const updatedMeta = [...customMeta, ...newMeta]
    setCustomMeta(updatedMeta)
    setTracks((prev) => [...prev, ...newTracks])
    localStorage.setItem('custom-music-meta', JSON.stringify(updatedMeta))
  }, [customMeta])

  // ── 删除自定义音乐 ──
  const removeCustomTrack = useCallback((id: string) => {
    // 从 IndexedDB 删除文件
    deleteMusicFile(id).catch(() => {})

    // 从状态中移除
    setCustomMeta((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      localStorage.setItem('custom-music-meta', JSON.stringify(updated))
      return updated
    })

    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      // 如果当前正在播放被删除的曲目，停掉
      const idx = prev.findIndex((t) => t.id === id)
      if (idx >= 0 && idx === currentIndex) {
        audioRef.current?.pause()
        setCurrentIndex(-1)
      } else if (idx >= 0 && idx < currentIndex) {
        // 删除的项在当前播放项之前，索引需要调整
        setCurrentIndex((ci) => Math.max(0, ci - 1))
      }
      return updated
    })
  }, [currentIndex])

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

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [])

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
      tracks, addCustomMusic, removeCustomTrack,
      currentIndex, isPlaying, currentTime, duration,
      play, pause, togglePlay, prevTrack, nextTrack, seek, stop,
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
