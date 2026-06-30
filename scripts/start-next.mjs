import { createServer } from 'node:http'
import next from 'next'

const hostname = '127.0.0.1'
const port = Number(process.env.PORT ?? 3000)
const dev = process.env.NODE_ENV !== 'production'

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

await app.prepare()

const server = createServer((req, res) => {
  handle(req, res)
}).listen(port, hostname, () => {
  console.log(`AI超级猎头工作台已启动: http://${hostname}:${port}`)
})

server.keepAliveTimeout = 65000
setInterval(() => {}, 60_000)
