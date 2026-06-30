import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const homeUrl = 'http://127.0.0.1:3000/home'
const nextBin = join(root, 'node_modules', 'next', 'dist', 'bin', 'next')

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function isReady() {
  try {
    const response = await fetch(homeUrl, { cache: 'no-store' })
    return response.ok
  } catch {
    return false
  }
}

function openBrowser() {
  spawn('cmd', ['/c', 'start', '', homeUrl], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  }).unref()
}

async function main() {
  if (await isReady()) {
    openBrowser()
    return
  }

  if (!existsSync(nextBin)) {
    console.error('没有找到 Next.js，请先在项目目录运行 npm install。')
    process.exit(1)
  }

  const server = spawn(process.execPath, [nextBin, 'dev', '-H', '127.0.0.1', '-p', '3000'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  server.unref()

  for (let i = 0; i < 45; i += 1) {
    await wait(1000)
    if (await isReady()) {
      openBrowser()
      return
    }
  }

  console.error('服务启动超时，请稍后再打开 http://127.0.0.1:3000/home。')
  process.exit(1)
}

main()
