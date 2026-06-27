import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

export const dynamic = 'force-dynamic'

// GET /api/reminders — liste des devis en attente >24h + factures en retard
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 400 })

  const il24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const aujourd = new Date().toISOString().split('T')[0]

  const [devisRes, facturesRes] = await Promise.all([
    supabase
      .from('devis')
      .select('id, numero, montant_ttc, updated_at, clients(nom, email)')
      .eq('company_id', profile.company_id)
      .in('statut', ['envoye', 'vu'])
      .lt('updated_at', il24h)
      .order('updated_at', { ascending: true }),
    supabase
      .from('factures')
      .select('id, numero, montant_ttc, date_echeance, clients(nom, email)')
      .eq('company_id', profile.company_id)
      .in('statut', ['envoyee', 'vue', 'partielle'])
      .lt('date_echeance', aujourd)
      .order('date_echeance', { ascending: true }),
  ])

  const devisReminders = (devisRes.data ?? []).map((d: any) => ({
    id: d.id,
    type: 'devis_24h' as const,
    reference: d.numero,
    client_nom: d.clients?.nom ?? '—',
    client_email: d.clients?.email ?? '',
    montant: Number(d.montant_ttc ?? 0),
    date_envoi: d.updated_at,
    heures_ecoulees: Math.floor((Date.now() - new Date(d.updated_at).getTime()) / 3600000),
    statut: 'en_attente' as const,
  }))

  const factureReminders = (facturesRes.data ?? []).map((f: any) => {
    const joursRetard = Math.floor((Date.now() - new Date(f.date_echeance).getTime()) / 86400000)
    return {
      id: f.id,
      type: 'facture_retard' as const,
      reference: f.numero,
      client_nom: f.clients?.nom ?? '—',
      client_email: f.clients?.email ?? '',
      montant: Number(f.montant_ttc ?? 0),
      date_envoi: f.date_echeance,
      heures_ecoulees: joursRetard * 24,
      statut: 'en_attente' as const,
    }
  })

  const reminders = [...devisReminders, ...factureReminders]

  return NextResponse.json({
    total: reminders.length,
    devis_en_attente: devisReminders.length,
    factures_retard: factureReminders.length,
    reminders,
  })
}

// POST /api/reminders — envoyer un rappel manuel
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 400 })

    const { id, type } = await request.json()
    if (!id || !type) return NextResponse.json({ error: 'id et type requis' }, { status: 400 })

    let clientEmail: string | null = null
    let clientNom = '—'
    let reference = ''
    let montant = 0
    let portalLink = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    if (type === 'devis_24h') {
      const { data: d } = await supabase
        .from('devis')
        .select('numero, montant_ttc, portal_token, clients(nom, email)')
        .eq('id', id).eq('company_id', profile.company_id).single()
      if (!d) return NextResponse.json({ error: 'Devis introuvable' }, { status: 404 })
      clientEmail = (d.clients as any)?.email ?? null
      clientNom   = (d.clients as any)?.nom ?? '—'
      reference   = d.numero
      montant     = Number(d.montant_ttc ?? 0)
      portalLink  = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/portal/devis/${d.portal_token}`
    } else {
      const { data: f } = await supabase
        .from('factures')
        .select('numero, montant_ttc, clients(nom, email)')
        .eq('id', id).eq('company_id', profile.company_id).single()
      if (!f) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
      clientEmail = (f.clients as any)?.email ?? null
      clientNom   = (f.clients as any)?.nom ?? '—'
      reference   = f.numero
      montant     = Number(f.montant_ttc ?? 0)
    }

    const montantStr = montant.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

    if (process.env.RESEND_API_KEY && clientEmail) {
      const subject = type === 'devis_24h'
        ? `Rappel — Votre devis ${reference} est en attente`
        : `Rappel de paiement — Facture ${reference}`

      const html = type === 'devis_24h'
        ? `<p>Bonjour ${clientNom.split(' ')[0]},</p>
           <p>Votre devis <strong>${reference}</strong> (${montantStr}) est toujours en attente de votre approbation.</p>
           <p><a href="${portalLink}" style="background:#B8922A;color:#fff;padding:10px 20px;border-radius:7px;text-decoration:none;font-weight:700">Voir et approuver →</a></p>`
        : `<p>Bonjour ${clientNom.split(' ')[0]},</p>
           <p>La facture <strong>${reference}</strong> (${montantStr}) est en attente de paiement.</p>
           <p>Merci de procéder au règlement dans les meilleurs délais.</p>`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? 'noreply@growth-plan.ca',
          to: clientEmail, subject, html,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        return NextResponse.json({ error: err.message ?? 'Erreur Resend' }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: `Rappel envoyé à ${clientEmail}`, email_sent: true })
    }

    console.log(`[RAPPEL SIMULÉ] → ${clientEmail} | ${reference}`)
    return NextResponse.json({ success: true, message: `[DEV] Rappel simulé. Ajoutez RESEND_API_KEY pour envoyer.`, email_sent: false, simulated: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
