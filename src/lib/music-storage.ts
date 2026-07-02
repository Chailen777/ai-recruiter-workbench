/**
 * IndexedDB 音乐文件存储
 *
 * 用于持久化本地上传的音乐文件，解决 URL.createObjectURL() 刷新后失效的问题
 */

const DB_NAME = 'ai-recruiter-music'
const DB_VERSION = 1
const STORE_NAME = 'audio-files'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 保存音乐文件到 IndexedDB */
export async function saveMusicFile(id: string, file: File): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.put({ id, file, name: file.name, type: file.type })

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 从 IndexedDB 读取音乐文件，返回 Blob URL */
export async function loadMusicFile(id: string): Promise<string | null> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => {
      const record = req.result
      if (record && record.file) {
        const url = URL.createObjectURL(record.file)
        resolve(url)
      } else {
        resolve(null)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

/** 删除音乐文件 */
export async function deleteMusicFile(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 检查文件是否存在 */
export async function musicFileExists(id: string): Promise<boolean> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => resolve(!!req.result)
    req.onerror = () => reject(req.error)
  })
}
