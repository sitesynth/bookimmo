import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

function loadLocalEnv() {
  const envPath = path.join(ROOT_DIR, 'backend', '.env')
  if (!fs.existsSync(envPath)) return

  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

function readConfig() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
  if (connectionString) {
    return {
      connectionString,
      ssl: { rejectUnauthorized: false },
    }
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'bookimmo_backend',
    user: process.env.DB_USER || 'bookimmo_backend',
    password: process.env.DB_PASSWORD || '',
    ssl: { rejectUnauthorized: false },
  }
}

function parseArgs(argv) {
  const result = {}

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current.startsWith('--')) continue
    const key = current.slice(2)
    const next = argv[index + 1]
    result[key] = next && !next.startsWith('--') ? next : true
    if (result[key] === next) index += 1
  }

  return result
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

async function ensureTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.cities (
      id TEXT PRIMARY KEY,
      country_code TEXT NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
      name TEXT NOT NULL,
      region TEXT,
      slug TEXT NOT NULL,
      population INTEGER,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (country_code, slug)
    );
  `)
}

async function importCountries(client, filePath) {
  const stream = fs.createReadStream(filePath, 'utf8')
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })
  let imported = 0

  for await (const line of rl) {
    if (!line || line.startsWith('#')) continue
    const parts = line.split('\t')
    const iso = String(parts[0] || '').trim().toUpperCase()
    const name = String(parts[4] || '').trim()
    const population = Number(parts[7] || 0)
    if (!iso || !name) continue

    const priority = population > 50_000_000 ? 100 : population > 10_000_000 ? 80 : 60

    await client.query(
      `INSERT INTO public.countries (code, name, priority)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE
         SET name = EXCLUDED.name,
             priority = EXCLUDED.priority,
             updated_at = NOW()`,
      [iso, name, priority],
    )
    imported += 1
  }

  return imported
}

async function importCities(client, filePath, minPopulation = 5000) {
  const stream = fs.createReadStream(filePath, 'utf8')
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })
  let imported = 0

  for await (const line of rl) {
    if (!line) continue
    const parts = line.split('\t')
    const geonameId = String(parts[0] || '').trim()
    const name = String(parts[2] || parts[1] || '').trim()
    const featureClass = String(parts[6] || '').trim()
    const featureCode = String(parts[7] || '').trim()
    const countryCode = String(parts[8] || '').trim().toUpperCase()
    const admin1 = String(parts[10] || '').trim()
    const population = Number(parts[14] || 0)

    if (!geonameId || !name || !countryCode) continue
    if (featureClass !== 'P') continue
    if (!featureCode.startsWith('PPL')) continue
    if (population < minPopulation) continue

    const cityId = `${countryCode.toLowerCase()}-${geonameId}`

    await client.query(
      `INSERT INTO public.cities (id, country_code, name, region, slug, population, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       ON CONFLICT (id) DO UPDATE
         SET country_code = EXCLUDED.country_code,
             name = EXCLUDED.name,
             region = EXCLUDED.region,
             slug = EXCLUDED.slug,
             population = EXCLUDED.population,
             is_active = TRUE,
             updated_at = NOW()`,
      [cityId, countryCode, name, admin1 || null, slugify(name), population || null],
    )
    imported += 1
  }

  return imported
}

async function main() {
  loadLocalEnv()
  const args = parseArgs(process.argv.slice(2))
  const countriesPath = args.countries ? path.resolve(ROOT_DIR, args.countries) : ''
  const citiesPath = args.cities ? path.resolve(ROOT_DIR, args.cities) : ''
  const minPopulation = Number(args['min-population'] || 5000)

  if (!countriesPath || !citiesPath) {
    console.error('Usage: node scripts/import-reference-data.mjs --countries data/countryInfo.txt --cities data/cities500.txt [--min-population 5000]')
    process.exit(1)
  }

  if (!fs.existsSync(countriesPath)) {
    console.error(`Countries file not found: ${countriesPath}`)
    process.exit(1)
  }

  if (!fs.existsSync(citiesPath)) {
    console.error(`Cities file not found: ${citiesPath}`)
    process.exit(1)
  }

  const client = new Client(readConfig())
  await client.connect()

  try {
    await ensureTables(client)
    const countryCount = await importCountries(client, countriesPath)
    const cityCount = await importCities(client, citiesPath, minPopulation)
    console.log(`Imported ${countryCount} countries and ${cityCount} cities.`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
