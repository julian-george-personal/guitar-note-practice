import dotenv from 'dotenv'
dotenv.config({ path: './job/.env' })

import { createServer } from 'node:http'
import { handler } from '../job/src/index.js'

const PORT = 3001

createServer(async (req, res) => {
  let body = ''
  for await (const chunk of req) body += chunk

  const event = {
    body,
    requestContext: { http: { method: req.method ?? 'POST' } },
  } as any

  try {
    const result = await handler(event, {} as any, () => {}) as any
    Object.entries(result.headers ?? {}).forEach(([k, v]) => res.setHeader(k, v as string))
    res.writeHead(result.statusCode)
    res.end(result.body)
  } catch (err) {
    console.error(err)
    res.writeHead(500, { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain' })
    res.end(String(err))
  }
}).listen(PORT, () => console.log(`Lambda dev server → http://localhost:${PORT}`))
