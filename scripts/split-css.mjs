import fs from 'fs'
import path from 'path'

const root = process.cwd()
const input = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8')

const markers = {
  polish: '/* V0.2 Design System Refactor: visual layer only */',
  components: '/* V0.2 Design System: UI Component Library */',
  dashboard: '/* Home SaaS Dashboard v2 */',
}

function between(str, start, end) {
  const s = str.indexOf(start)
  if (s === -1) return ''
  const e = end ? str.indexOf(end, s) : str.length
  return str.slice(s, e === -1 ? str.length : e)
}

function before(str, marker) {
  const i = str.indexOf(marker)
  return i === -1 ? str : str.slice(0, i)
}

const base = before(input, markers.polish)
const polish = between(input, markers.polish, markers.components)
const components = between(input, markers.components, markers.dashboard)
const dashboard = between(input, markers.dashboard, undefined)

const outDir = path.join(root, 'src/styles')
fs.mkdirSync(outDir, { recursive: true })

fs.writeFileSync(path.join(outDir, 'base.css'), base.trim() + '\n')
fs.writeFileSync(path.join(outDir, 'polish.css'), polish.trim() + '\n')
fs.writeFileSync(path.join(outDir, 'components.css'), components.trim() + '\n')
fs.writeFileSync(path.join(outDir, 'pages.css'), dashboard.trim() + '\n')

console.log('CSS split into src/styles/{base,polish,components,pages}.css')
