import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/stripe/webhook
// Reçoit les événements Stripe et met à jour les abonnements
// Configuré dans Stripe Dashboard → Developers → Webhooks
export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Config Stripe manquante' }, { status: 500 })
  }

  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  // Vérification de la signature Stripe (sans SDK — implémentation manuelle HMAC-SHA256)
  let event: StripeEvent
  try {
    event = await verifyStripeSignature(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  console.log('[webhook] received event', event.type, {
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  })

  // ── Traitement des événements ──────────────────────────────────
  try {
    switch (event.type) {

      // Abonnement créé ou réactivé → activer l'accès
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as StripeSubscription
        await handleSubscriptionChange(sub)
        break
      }

      // Abonnement annulé ou expiré → désactiver l'accès
      case 'customer.subscription.deleted': {
        const sub = event.data.object as unknown as StripeSubscription
        await handleSubscriptionDeleted(sub)
        break
      }

      // Paiement réussi → confirmer l'accès actif
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as unknown as StripeInvoice
        console.log(`[webhook] Paiement réussi pour ${invoice.customer_email} — ${invoice.amount_paid / 100}$`)
        break
      }

      // Paiement échoué → notifier le client
      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as StripeInvoice
        console.log(`[webhook] Paiement ÉCHOUÉ pour ${invoice.customer_email}`)
        // En prod : envoyer un email via Resend
        await notifyPaymentFailed(invoice)
        break
      }

      // Essai gratuit se termine dans 3 jours → rappel
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as unknown as StripeSubscription
        console.log(`[webhook] Essai se termine bientôt: ${sub.customer}`)
        await notifyTrialEnding(sub)
        break
      }

      default:
        console.log(`[webhook] Événement ignoré: ${event.type}`)
    }
  } catch (err) {
    console.error('[webhook] Erreur de traitement:', err)
    return NextResponse.json({ error: 'Erreur de traitement' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Handlers ──────────────────────────────────────────────────────

async function handleSubscriptionChange(sub: StripeSubscription) {
  // Client service-role : un webhook n'a pas de session utilisateur,
  // le client anon était bloqué par RLS → échec silencieux (S1.1)
  const supabase = createAdminClient()
  const { error } = await supabase.from('subscriptions').upsert({
    stripe_customer_id:     sub.customer,
    stripe_subscription_id: sub.id,
    status:                 sub.status,
    plan:                   sub.items.data[0]?.price?.recurring?.interval ?? 'month',
    current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
    trial_end:              sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
  }, { onConflict: 'stripe_customer_id' })

  // Erreur = throw → le handler renvoie 500 → Stripe réessaie (plus d'échec silencieux)
  if (error) throw new Error(`[webhook] upsert subscription ${sub.id}: ${error.message}`)
  console.log(`[webhook] Abonnement mis à jour: ${sub.id} → ${sub.status}`)
}

async function handleSubscriptionDeleted(sub: StripeSubscription) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('subscriptions').update({ status: 'canceled' })
    .eq('stripe_subscription_id', sub.id)

  if (error) throw new Error(`[webhook] annulation subscription ${sub.id}: ${error.message}`)
  console.log(`[webhook] Abonnement annulé: ${sub.id}`)
}

async function notifyPaymentFailed(invoice: StripeInvoice) {
  if (!process.env.RESEND_API_KEY || !invoice.customer_email) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from:    process.env.RESEND_FROM ?? 'notifications@votredomaine.com',
      to:      invoice.customer_email,
      subject: 'Problème de paiement — ERP Construction',
      html: `
        <p>Bonjour,</p>
        <p>Nous n'avons pas pu traiter votre paiement pour l'abonnement ERP Construction.</p>
        <p>Veuillez mettre à jour vos informations de paiement pour conserver l'accès :</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/portal">Mettre à jour le paiement →</a></p>
        <p>Si vous avez des questions, répondez à ce courriel.</p>
      `,
    }),
  })
}

async function notifyTrialEnding(sub: StripeSubscription) {
  if (!process.env.RESEND_API_KEY) return
  const supabase = createAdminClient()
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('companies(name, email)')
    .eq('stripe_subscription_id', sub.id)
    .single()
  const co = (subscription as any)?.companies
  if (!co?.email) return
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' }) : '—'
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'noreply@growth-plan.ca',
      to: co.email,
      subject: 'Votre essai gratuit se termine bientôt — Plan Growth ERP',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#B8922A">Votre essai gratuit se termine le ${trialEnd}</h2>
          <p>Bonjour ${co.name ?? 'équipe'},</p>
          <p>Votre période d'essai de <strong>Plan Growth ERP</strong> se termine dans 3 jours.</p>
          <p>Pour conserver l'accès à tous vos clients, devis et factures, activez votre abonnement maintenant.</p>
          <div style="margin:28px 0;text-align:center">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/tarifs"
               style="background:#B8922A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
              Activer mon abonnement →
            </a>
          </div>
          <p style="color:#888;font-size:12px">Si vous avez des questions, répondez simplement à ce courriel.</p>
        </div>
      `,
    }),
  }).catch(err => console.error('[webhook/trial_will_end] Resend:', err))
}

// ── Vérification signature Stripe (HMAC-SHA256 sans SDK) ──────────

interface StripeEvent {
  id: string
  type: string
  data: { object: Record<string, unknown> }
}
interface StripeSubscription {
  id: string; customer: string; status: string; trial_end: number | null
  current_period_end: number
  items: { data: Array<{ price: { recurring: { interval: string } } }> }
}
interface StripeInvoice {
  customer: string; customer_email: string | null; amount_paid: number
}

async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string
): Promise<StripeEvent> {
  const parts = header.split(',').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=')
    acc[k.trim()] = v?.trim() ?? ''
    return acc
  }, {})

  const timestamp = parts['t']
  const signature = parts['v1']

  if (!timestamp || !signature) throw new Error('En-tête stripe-signature malformé')

  // Vérifier que le timestamp n'est pas trop vieux (5 minutes)
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp)
  if (age > 300) throw new Error('Webhook expiré (> 5 min)')

  const signed  = `${timestamp}.${payload}`
  const key     = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))
  const expected = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (expected !== signature) throw new Error('Signature invalide')

  return JSON.parse(payload) as StripeEvent
}

// Désactiver le body parsing automatique de Next.js (on a besoin du raw body)
export const runtime = 'nodejs'
