import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveCompanyIdFromSubscription } from '@/lib/stripe/subscription'
import { verifyStripeSignature } from '@/lib/stripe/webhook-signature'

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

  const supabase = createAdminClient()

  // ── 1. Vérification Idempotence de l'événement Stripe ──────────
  try {
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('event_id')
      .eq('event_id', event.id)
      .maybeSingle()

    if (existingEvent) {
      console.log(`[webhook] Événement déjà traité (idempotent skip): ${event.id}`)
      return NextResponse.json({ received: true, already_processed: true })
    }
  } catch (err) {
    console.warn('[webhook] Idempotency check warning:', err)
  }

  // ── 2. Traitement des événements ───────────────────────────────
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

    // Journalisation de l'événement traité pour l'idempotence
    try {
      await supabase.from('stripe_webhook_events').insert({ event_id: event.id })
    } catch (logErr) {
      console.warn('[webhook] Idempotency log notice:', logErr)
    }
  } catch (err) {
    console.error('[webhook] Erreur de traitement:', err)
    return NextResponse.json({ error: 'Erreur de traitement' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Handlers ──────────────────────────────────────────────────────

async function resolveCompanyId(
  supabase: ReturnType<typeof createAdminClient>,
  sub: StripeSubscription
): Promise<string | null> {
  let existingCompanyId: string | null = null
  if (sub.customer) {
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('company_id')
      .eq('stripe_customer_id', sub.customer)
      .maybeSingle()
    existingCompanyId = existing?.company_id ?? null
  }

  let emailCompanyId: string | null = null
  if (sub.customer_email) {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .ilike('email', sub.customer_email)
      .maybeSingle()
    emailCompanyId = company?.id ?? null
  }

  return resolveCompanyIdFromSubscription(sub, { existingCompanyId, emailCompanyId })
}

async function handleSubscriptionChange(sub: StripeSubscription) {
  const supabase = createAdminClient()
  const companyId = await resolveCompanyId(supabase, sub)

  if (!companyId) {
    throw new Error(`[webhook] company_id introuvable pour la souscription ${sub.id}`)
  }

  const plan = sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annuel' : 'mensuel'
  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date().toISOString()
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      company_id:             companyId,
      stripe_customer_id:     sub.customer,
      stripe_subscription_id: sub.id,
      status:                 sub.status,
      plan,
      current_period_end:     currentPeriodEnd,
      trial_end:              trialEnd,
    }, { onConflict: 'company_id' })

  if (error) {
    console.error(`[webhook] Erreur upsert subscription ${sub.id} (company: ${companyId}):`, error.message)
    throw new Error(`[webhook] mise à jour subscription ${sub.id}: ${error.message}`)
  }

  console.log(`[webhook] Abonnement synchronisé: ${sub.id} → ${sub.status} pour company_id: ${companyId}`)
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

interface StripeEvent {
  id: string
  type: string
  data: { object: Record<string, unknown> }
}
interface StripeSubscription {
  id: string; customer: string; status: string; trial_end: number | null
  current_period_end: number
  customer_email?: string | null
  items: { data: Array<{ price: { recurring: { interval: string } } }> }
  metadata?: Record<string, string>
}
interface StripeInvoice {
  customer: string; customer_email: string | null; amount_paid: number
}

export const runtime = 'nodejs'
