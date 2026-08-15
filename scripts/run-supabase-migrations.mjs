#!/usr/bin/env node
/**
 * Applique les migrations SQL Supabase via connexion Postgres directe.
 *
 * Requis dans .env.local (une des options) :
 *   DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
 *   — ou —
 *   SUPABASE_DB_PASSWORD=[mot de passe DB]  (+ NEXT_PUBLIC_SUPABASE_URL déjà présent)
 *
 * Usage : node scripts/run-supabase-migrations.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const password = process.env.SUPABASE_DB_PASSWORD
  if (!supabaseUrl || !password) return null

  const ref = supabaseUrl.replace('https://', '').split('.')[0]
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`
}

const MIGRATIONS = [
  'supabase/migrations/0005_portal_devis_rpc.sql',
  'supabase/migrations/0006_normalize_statuts.sql',
]

async function main() {
  loadEnvLocal()
  const databaseUrl = buildDatabaseUrl()

  if (!databaseUrl) {
    console.error(`
❌ Connexion Postgres manquante.

Ajoutez dans .env.local l'une de ces variables :

  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

  — ou —

  SUPABASE_DB_PASSWORD=[PASSWORD]

Mot de passe : Supabase Dashboard → Project Settings → Database → Database password
`)
    process.exit(1)
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✓ Connecté à Supabase Postgres\n')

  for (const rel of MIGRATIONS) {
    const file = resolve(root, rel)
    const sql = readFileSync(file, 'utf8')
    console.log(`→ Exécution ${rel}...`)
    await client.query(sql)
    console.log(`  ✓ OK\n`)
  }

  // Vérification rapide
  const { rows } = await client.query(`
    select proname from pg_proc
    where proname in ('portal_get_devis', 'portal_update_devis')
    order by proname
  `)
  console.log('Fonctions portail :', rows.map(r => r.proname).join(', ') || '(aucune — vérifier les erreurs)')

  await client.end()
  console.log('\n✅ Migrations 0005 + 0006 appliquées avec succès.')
}

main().catch(err => {
  console.error('\n❌ Échec migration:', err.message)
  process.exit(1)
})
