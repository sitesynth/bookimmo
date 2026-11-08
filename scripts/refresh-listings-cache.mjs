import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { refreshListingsCache } from '../api/_lib/listings-refresh.js'
import { getPool } from '../api/_lib/db.js'

const lockPath = path.join(os.tmpdir(), 'bookimmo-listings-refresh.lock')

function acquireLock() {
  try {
    const fd = fs.openSync(lockPath, 'wx')
    fs.writeFileSync(fd, `${process.pid}\n`)
    fs.closeSync(fd)
    return true
  } catch (error) {
    if (error.code === 'EEXIST') return false
    throw error
  }
}

if (!acquireLock()) {
  console.log('listings_refresh_skipped=lock_exists')
  process.exit(0)
}

try {
  const result = await refreshListingsCache(48)
  console.log(JSON.stringify({ event: 'listings_refresh_completed', ...result }))
  if (result.imported === 0 && result.errors.length === 2) process.exitCode = 1
} catch (error) {
  console.error(JSON.stringify({ event: 'listings_refresh_failed', error: String(error) }))
  process.exitCode = 1
} finally {
  fs.rmSync(lockPath, { force: true })
  await getPool().end().catch(() => {})
}
