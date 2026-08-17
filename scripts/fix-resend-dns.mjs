/**
 * Ajoute les DNS Resend manquants sur growth-plan.ca (zone Netlify) puis relance la vérif.
 * N'imprime jamais la clé Resend ni le token Netlify.
 */
import { execSync } from 'node:child_process'

const ACCOUNT_ID = '69decc28c8fee0814994356f'
const SITE_ID = '8992c6fd-5cbd-41a5-85bb-8b2e50d0842f'
const ZONE_ID = '69ded10894bd665d54b6c7a0'
const DOMAIN = 'growth-plan.ca'

function netlifyApi(method, data) {
  const out = execSync(`npx netlify api ${method} --data ${JSON.stringify(JSON.stringify(data))}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const iObj = out.indexOf('{')
  const iArr = out.indexOf('[')
  const start = [iObj, iArr].filter(i => i >= 0).sort((a, b) => a - b)[0]
  return JSON.parse(out.slice(start))
}

function hostnameFor(name) {
  const n = String(name || '').replace(/\.$/, '')
  if (!n) return DOMAIN
  if (n.endsWith(DOMAIN)) return n
  return `${n}.${DOMAIN}`
}

function txtValue(value) {
  return String(value || '').replace(/^"|"$/g, '')
}

const envVar = netlifyApi('getEnvVar', {
  account_id: ACCOUNT_ID,
  key: 'RESEND_API_KEY',
  site_id: SITE_ID,
})
const apiKey = envVar?.values?.[0]?.value || envVar?.value || ''
if (!apiKey || apiKey.length < 8) {
  console.log('RESEND_API_KEY absente sur Netlify (plan-growth). Impossible de lire les records Resend.')
  process.exit(1)
}

async function resend(path, opts = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.log('Resend HTTP', res.status, body?.message || body?.name || 'erreur')
    process.exit(1)
  }
  return body
}

const list = await resend('/domains')
const domains = list.data || list
const domain = (Array.isArray(domains) ? domains : []).find(d => d.name === DOMAIN)
if (!domain) {
  console.log('Domaine growth-plan.ca introuvable dans Resend.')
  process.exit(1)
}
console.log('Resend domaine:', domain.name, 'status=', domain.status, 'id=', domain.id)

const detail = await resend(`/domains/${domain.id}`)
const records = detail.records || []
console.log('Records Resend:', records.length)
for (const rec of records) {
  console.log(` - ${rec.type} ${rec.name} => ${String(rec.value).slice(0, 80)} [${rec.status}]`)
}

const existing = netlifyApi('getDnsRecords', { zone_id: ZONE_ID })
const have = new Set(
  (Array.isArray(existing) ? existing : existing.records || []).map(
    r => `${r.type}|${r.hostname}|${r.value}|${r.priority ?? ''}`,
  ),
)

let created = 0
for (const rec of records) {
  if (rec.record === 'Tracking') continue
  const hostname = hostnameFor(rec.name)
  const type = rec.type
  const value = type === 'TXT' ? txtValue(rec.value) : String(rec.value).replace(/\.$/, '')
  const priority = rec.priority ?? (type === 'MX' ? 10 : undefined)
  const key = `${type}|${hostname}|${value}|${priority ?? ''}`
  if ([...have].some(h => h.startsWith(`${type}|${hostname}|`))) {
    console.log('Déjà présent:', type, hostname)
    continue
  }
  const payload = {
    dns_zone_id: ZONE_ID,
    type,
    hostname,
    value,
    ttl: 3600,
  }
  if (priority != null) payload.priority = priority
  try {
    netlifyApi('createDnsRecord', payload)
    console.log('Ajouté:', type, hostname)
    created++
  } catch (err) {
    console.log('Échec ajout', type, hostname, String(err).slice(0, 200))
  }
}

const verify = await resend(`/domains/${domain.id}/verify`, { method: 'POST' })
console.log('Vérif Relancée:', verify.id || domain.id, 'enregistrements créés=', created)
console.log('Attends 1–5 min, puis recharge resend.com/domains — ça doit passer à Verified / Pending.')
