#!/usr/bin/env node
/**
 * Crée les produits/prix Stripe pour Plan Growth.
 *
 * Usage (PowerShell) :
 *   $env:STRIPE_SECRET_KEY="sk_live_..."   # ou sk_test_...
 *   node scripts/setup-stripe-catalog.mjs
 *
 * Copie ensuite les Price IDs affichés dans Netlify.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

loadEnvLocal()

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_KEY) {
  console.error('❌ STRIPE_SECRET_KEY manquant.')
  console.error('   PowerShell: $env:STRIPE_SECRET_KEY="sk_test_..."')
  console.error('   Puis: npm run stripe:setup')
  process.exit(1)
}

if (STRIPE_KEY.startsWith('whsec_')) {
  console.error('❌ Mauvaise clé : tu as mis le WEBHOOK SECRET (whsec_...).')
  console.error('   Il faut la SECRET KEY API (sk_test_... ou sk_live_...).')
  console.error('   Stripe → Developers → API keys → Secret key')
  console.error('   Le whsec_ va dans Netlify comme STRIPE_WEBHOOK_SECRET, pas ici.')
  process.exit(1)
}

if (!STRIPE_KEY.startsWith('sk_test_') && !STRIPE_KEY.startsWith('sk_live_')) {
  console.error('❌ Clé invalide : STRIPE_SECRET_KEY doit commencer par sk_test_ ou sk_live_')
  process.exit(1)
}

const isLive = STRIPE_KEY.startsWith('sk_live_')
console.log(`\n🔐 Mode Stripe: ${isLive ? 'LIVE ⚠️' : 'TEST'}\n`)

const CATALOG = [
  {
    envKey: 'STRIPE_PRICE_TIER_AUTONOME',
    productName: 'Plan Growth — AUTONOME',
    description: '1 à 2 utilisateurs · abonnement annuel 12 mois',
    unitAmount: 210000,
  },
  {
    envKey: 'STRIPE_PRICE_TIER_EQUIPE',
    productName: 'Plan Growth — ÉQUIPE',
    description: '3 à 10 utilisateurs · abonnement annuel 12 mois',
    unitAmount: 360000,
  },
  {
    envKey: 'STRIPE_PRICE_TIER_CROISSANCE',
    productName: 'Plan Growth — CROISSANCE',
    description: '11 à 20 utilisateurs · abonnement annuel 12 mois',
    unitAmount: 540000,
  },
  {
    envKey: 'STRIPE_PRICE_SETUP',
    productName: "Frais d'adhésion — site, Google Ads, Meta/Instagram",
    description: 'Branchement site web, Google Ads et Lead Ads Meta/Instagram au CRM (unique)',
    unitAmount: 50000,
    oneTime: true,
  },
]

async function stripe(path, body) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message ?? JSON.stringify(data))
  }
  return data
}

async function createProduct(name, description) {
  const body = new URLSearchParams({ name, description })
  return stripe('/products', body)
}

async function createPrice(productId, unitAmount, oneTime) {
  const body = new URLSearchParams({
    product: productId,
    currency: 'cad',
    unit_amount: String(unitAmount),
  })
  if (!oneTime) {
    body.set('recurring[interval]', 'year')
  }
  return stripe('/prices', body)
}

console.log('Création du catalogue Stripe…\n')
console.log('─'.repeat(60))

const netlifyVars = []

for (const item of CATALOG) {
  try {
    const product = await createProduct(item.productName, item.description)
    const price = await createPrice(product.id, item.unitAmount, item.oneTime)
    const amountCad = (item.unitAmount / 100).toLocaleString('fr-CA', { minimumFractionDigits: 2 })
    const type = item.oneTime ? 'unique' : 'annuel'

    console.log(`✅ ${item.productName}`)
    console.log(`   ${amountCad} $ CAD (${type})`)
    console.log(`   ${item.envKey}=${price.id}\n`)

    netlifyVars.push(`${item.envKey}=${price.id}`)
  } catch (err) {
    console.error(`❌ ${item.productName}: ${err.message}\n`)
  }
}

console.log('─'.repeat(60))
console.log('\n📋 Variables à coller dans Netlify :\n')
for (const line of netlifyVars) {
  console.log(line)
}
console.log('\nPuis redéploie le site.\n')
