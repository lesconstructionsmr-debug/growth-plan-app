/** Décode le signing secret Stripe (préfixe whsec_ = base64). */
export function decodeStripeWebhookSecret(secret: string): Uint8Array {
  if (secret.startsWith('whsec_')) {
    return Uint8Array.from(Buffer.from(secret.slice('whsec_'.length), 'base64'))
  }
  return new TextEncoder().encode(secret)
}

export async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string
): Promise<{ id: string; type: string; data: { object: Record<string, unknown> } }> {
  const parts = header.split(',').reduce<Record<string, string>>((acc, part) => {
    const eq = part.indexOf('=')
    if (eq === -1) return acc
    acc[part.slice(0, eq).trim()] = part.slice(eq + 1).trim()
    return acc
  }, {})

  const timestamp = parts['t']
  const signature = parts['v1']
  if (!timestamp || !signature) throw new Error('En-tête stripe-signature malformé')

  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)
  if (age > 300) throw new Error('Webhook expiré (> 5 min)')

  const signed = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    decodeStripeWebhookSecret(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (expected !== signature) throw new Error('Signature invalide')

  return JSON.parse(payload)
}
