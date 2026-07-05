import fs from 'node:fs'
import path from 'node:path'

let loaded = false

export function loadLocalEnv() {
  if (loaded) return
  loaded = true

  const envPath = path.join(process.cwd(), 'backend', '.env')
  if (!fs.existsSync(envPath)) return

  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}
