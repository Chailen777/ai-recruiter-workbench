/**
 * GitHub MD 同步模块
 *
 * Vercel serverless 环境无持久文件系统，因此通过 GitHub Contents API
 * 将笔记 MD 备份文件实时推送到仓库 data/notes/ 目录。
 *
 * 本地开发环境（无 GITHUB_TOKEN）时回退到本地文件系统写入。
 */

import { type NoteData, buildMdContent, fileName } from './notes-data-md'

// ── 配置 ─────────────────────────────────────────

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const REPO_OWNER = 'Chailen777'
const REPO_NAME = 'ai-recruiter-workbench'
const BRANCH = 'main'
const DATA_NOTES_PATH = 'data/notes'

/** 是否应该使用 GitHub API（线上环境且有 Token） */
const useGitHub = !!(GITHUB_TOKEN)

// ── GitHub API 基础请求 ─────────────────────────

async function githubRequest(urlPath: string, options: RequestInit = {}): Promise<Response> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${urlPath}`
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ai-recruiter-workbench',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// ── 辅助：通过 noteId 前缀查找 GitHub 上的文件 ──

async function findFileByNoteId(noteId: number): Promise<{ name: string; sha: string } | null> {
  const res = await githubRequest(DATA_NOTES_PATH)
  if (res.status === 404) return null
  if (!res.ok) {
    console.warn(`[github-md-sync] 读取目录失败: ${res.status}`)
    return null
  }
  const files: unknown = await res.json()
  if (!Array.isArray(files)) return null
  const prefix = `${noteId}-`
  const file = (files as Array<{ name: string; sha: string }>).find((f) => f.name.startsWith(prefix))
  if (!file) return null
  return { name: file.name, sha: file.sha }
}

// ── 写入 / 更新笔记 MD ──────────────────────────

/**
 * 将笔记写入 GitHub 仓库 data/notes/ 目录。
 * 如果存在同名文件（按 noteId 前缀匹配），则更新；否则新建。
 */
export async function githubWriteNoteMd(note: NoteData): Promise<void> {
  if (!useGitHub) {
    // 本地开发环境 → 写入本地文件系统
    try {
      const { writeNoteMd } = await import('./notes-data-md')
      await writeNoteMd(note)
    } catch (e) {
      console.warn('[github-md-sync] 本地写入失败:', e instanceof Error ? e.message : String(e))
    }
    return
  }

  const content = buildMdContent(note)
  const filename = fileName(note.id, note.content)
  const filePath = `${DATA_NOTES_PATH}/${filename}`

  // 查找旧文件（可能因内容变更导致文件名不同）
  const oldFile = await findFileByNoteId(note.id)

  try {
    // 如果存在旧文件且文件名不同，先删除旧的
    if (oldFile && oldFile.name !== filename) {
      await githubRequest(`${DATA_NOTES_PATH}/${oldFile.name}`, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `♻️ 笔记 #${note.id}: 文件名更新`,
          sha: oldFile.sha,
          branch: BRANCH,
        }),
      })
    }

    // 写入新文件
    const body: Record<string, unknown> = {
      message: `📝 笔记 #${note.id}: ${note.content.slice(0, 50).replace(/\n/g, ' ')}`,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch: BRANCH,
    }

    // 检查当前文件名是否已存在
    const existingRes = await githubRequest(filePath)
    if (existingRes.ok) {
      const existing = await existingRes.json() as { sha: string }
      body.sha = existing.sha
    }

    await githubRequest(filePath, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  } catch (e) {
    console.warn('[github-md-sync] GitHub 写入失败:', e instanceof Error ? e.message : String(e))
  }
}

// ── 删除笔记 MD ─────────────────────────────────

/**
 * 从 GitHub 仓库删除笔记对应的 MD 文件。
 * @param noteId  笔记 ID
 * @param content 笔记内容（用于构造文件名）
 */
export async function githubDeleteNoteMd(noteId: number): Promise<void> {
  if (!useGitHub) {
    // 本地开发环境 → 删除本地文件
    try {
      const { deleteNoteMd } = await import('./notes-data-md')
      await deleteNoteMd(noteId)
    } catch (e) {
      console.warn('[github-md-sync] 本地删除失败:', e instanceof Error ? e.message : String(e))
    }
    return
  }

  const oldFile = await findFileByNoteId(noteId)
  if (!oldFile) return // 文件不存在，无需操作

  try {
    await githubRequest(`${DATA_NOTES_PATH}/${oldFile.name}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: `🗑️ 删除笔记 #${noteId}`,
        sha: oldFile.sha,
        branch: BRANCH,
      }),
    })
  } catch (e) {
    console.warn('[github-md-sync] GitHub 删除失败:', e instanceof Error ? e.message : String(e))
  }
}
