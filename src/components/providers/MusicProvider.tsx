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
  folderId: string  // 所属文件夹
}

export type MusicFolder = {
  id: string
  name: string
}

export type LoopMode = 'none' | 'one' | 'all'

type MusicContextType = {
  tracks: MusicTrack[]
  folders: MusicFolder[]
  addCustomMusic: (files: File[]) => Promise<void>
  removeCustomTrack: (id: string) => void
  addFolder: (name: string) => void
  removeFolder: (id: string) => void
  renameFolder: (id: string, name: string) => void
  moveTrackToFolder: (trackId: string, folderId: string) => void
  currentIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  loopMode: LoopMode
  setLoopMode: (mode: LoopMode) => void
  play: (index?: number) => void
  pause: () => void
  togglePlay: () => void
  prevTrack: () => void
  nextTrack: () => void
  seek: (time: number) => void
  stop: () => void
}

const MusicContext = createContext<MusicContextType | null>(null)

const DEFAULT_FOLDER_ID = 'default'
const DEFAULT_FOLDERS: MusicFolder[] = [
  { id: DEFAULT_FOLDER_ID, name: '我的音乐' },
]

// ═══ 系统不再内置音乐，全部由用户自己上传 ═══
const BUILT_IN_TRACKS: MusicTrack[] = []

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const loopModeRef = useRef<LoopMode>('all') // 用 ref 避免闭包陈旧问题
  const [tracks, setTracks] = useState<MusicTrack[]>(BUILT_IN_TRACKS)
  const [folders, setFolders] = useState<MusicFolder[]>(DEFAULT_FOLDERS)
  const [customMeta, setCustomMeta] = useState<MusicTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loopMode, _setLoopMode] = useState<LoopMode>('all')
  const [ready, setReady] = useState(false)

  const setLoopMode = useCallback((mode: LoopMode) => {
    loopModeRef.current = mode
    _setLoopMode(mode)
  }, [])

  // ── 启动时：从 localStorage 加载元数据 + 从 IndexedDB 重建 Blob URL ──
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const saved = localStorage.getItem('custom-music-meta')
        const savedFolders = localStorage.getItem('custom-music-folders')

        if (savedFolders) {
          const f: MusicFolder[] = JSON.parse(savedFolders)
          setFolders(f.length > 0 ? f : DEFAULT_FOLDERS)
        }

        if (!saved) { setReady(true); return }

        const meta: MusicTrack[] = JSON.parse(saved)
        const restored: MusicTrack[] = []
        for (const m of meta) {
          const blobUrl = await loadMusicFile(m.id)
          if (blobUrl) {
            restored.push({ ...m, url: blobUrl, folderId: m.folderId || DEFAULT_FOLDER_ID })
          }
        }

        if (cancelled) return
        setCustomMeta(meta)
        setTracks(BUILT_IN_TRACKS.concat(restored))
      } catch { /* ignore */ }
      if (!cancelled) setReady(true)
    })()
    return () => { cancelled = true }
  }, [])

  // ── 播放状态变化 → body 发光属性 ──
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
    const onEnded = () => {
      const mode = loopModeRef.current
      if (mode === 'one') {
        // 单曲循环
        if (audio) {
          audio.currentTime = 0
          audio.play().catch(() => {})
        }
      } else if (mode === 'all') {
        // 列表循环 → 下一首
        setCurrentIndex((prev) => {
          const tracks = BUILT_IN_TRACKS.concat(customMeta as any) // 需要当前 tracks
          if (tracks.length === 0) return prev
          return prev < tracks.length - 1 ? prev + 1 : 0
        })
      }
      // 'none' → 停止
    }

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

  // ── currentIndex 变化时加载音源 ──
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

  // ── 添加自定义音乐 ──
  const addCustomMusic = useCallback(async (files: File[]) => {
    const newMeta: MusicTrack[] = []
    const newTracks: MusicTrack[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('audio/')) continue

      const id = `custom-${Date.now()}-${i}`
      const blobUrl = URL.createObjectURL(file)
      const name = file.name.replace(/\.[^.]+$/, '')

      await saveMusicFile(id, file)

      newMeta.push({ id, name, artist: '本地上传', url: blobUrl, type: 'custom', folderId: DEFAULT_FOLDER_ID })
      newTracks.push({ id, name, artist: '本地上传', url: blobUrl, type: 'custom', folderId: DEFAULT_FOLDER_ID })
    }

    if (newMeta.length === 0) return

    const updatedMeta = [...customMeta, ...newMeta]
    setCustomMeta(updatedMeta)
    setTracks((prev) => [...prev, ...newTracks])
    localStorage.setItem('custom-music-meta', JSON.stringify(updatedMeta))
  }, [customMeta])

  // ── 删除自定义音乐 ──
  const removeCustomTrack = useCallback((id: string) => {
    deleteMusicFile(id).catch(() => {})

    setCustomMeta((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      localStorage.setItem('custom-music-meta', JSON.stringify(updated))
      return updated
    })

    setTracks((prev) => {
      const updated = prev.filter((t) => t.id !== id)
      const idx = prev.findIndex((t) => t.id === id)
      if (idx >= 0 && idx === currentIndex) {
        audioRef.current?.pause()
        setCurrentIndex(-1)
      }
      return updated
    })
  }, [currentIndex])

  // ── 文件夹操作 ──
  const addFolder = useCallback((name: string) => {
    setFolders((prev) => {
      const updated = [...prev, { id: `folder-${Date.now()}`, name }]
      localStorage.setItem('custom-music-folders', JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeFolder = useCallback((id: string) => {
    if (id === DEFAULT_FOLDER_ID) return // 不能删除默认文件夹
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      localStorage.setItem('custom-music-folders', JSON.stringify(updated))
      return updated
    })
    // 把该文件夹里的音乐移到默认文件夹
    setTracks((prev) => prev.map((t) => (t.folderId === id ? { ...t, folderId: DEFAULT_FOLDER_ID } : t)))
    setCustomMeta((prev) => {
      const updated = prev.map((t) => (t.folderId === id ? { ...t, folderId: DEFAULT_FOLDER_ID } : t))
      localStorage.setItem('custom-music-meta', JSON.stringify(updated))
      return updated
    })
  }, [])

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, name } : f))
      localStorage.setItem('custom-music-folders', JSON.stringify(updated))
      return updated
    })
  }, [])

  const moveTrackToFolder = useCallback((trackId: string, folderId: string) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, folderId } : t)))
    setCustomMeta((prev) => {
      const updated = prev.map((t) => (t.id === trackId ? { ...t, folderId } : t))
      localStorage.setItem('custom-music-meta', JSON.stringify(updated))
      return updated
    })
  }, [])

  // ── 播放控制 ──
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
    setIsPlaying(false)
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
      tracks, folders, addCustomMusic, removeCustomTrack,
      addFolder, removeFolder, renameFolder, moveTrackToFolder,
      currentIndex, isPlaying, currentTime, duration,
      loopMode, setLoopMode,
      play, pause, togglePlay, prevTrack, nextTrack, seek, stop,
    }}>
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
