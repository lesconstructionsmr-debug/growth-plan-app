import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// GET ou POST /api/cron/relances — Exécution automatique des relances aux 24h
export async function GET(req: NextRequest) {
  return handleRelancesAuto()
}

export async function POST(req: NextRequest) {
  return handleRelancesAuto()
}

async function handleRelancesAuto() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase URL / Key manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const ilYAHuitHeures = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const nowStr = new Date().toISOString().split('T')[0]

    let totalDevisRelances = 0
    let totalFacturesRelances = 0

    // 1. RELANCE AUTOMATIQUE 24H : Devis envoyés ou vus depuis plus de 24h sans réponse
    const { data: devisAEnlever } = await supabase
      .from('devis')
      .select('id, numero, titre, montant_ttc, portal_token, company_id, updated_at, clients(nom, email), companies(name)')
      .in('statut', ['envoye', 'vu'])
      .lt('updated_at', ilYAHuitHeures)
      .limit(50)

    if (devisAEnlever && devisAEnlever.length > 0) {
      for (const devis of devisAEnlever) {
        const clientEmail = (devis.clients as any)?.email
        const clientNom = (devis.clients as any)?.nom || 'Client'
        const companyName = (devis.companies as any)?.name || 'Notre Entreprise'

        if (clientEmail) {
          const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growth-plan.ca'}/portal/devis/${devis.portal_token}`
          const message = `Bonjour ${clientNom},\n\nNous nous permettons de vous relancer concernant le devis ${devis.numero} (${devis.titre}) d'un montant de ${devis.montant_ttc} $ TTC.\n\nVous pouvez le consulter et l'approuver directement en ligne ici : ${portalUrl}\n\nN'hésitez pas à nous contacter si vous avez la moindre question.\n\nCordialement,\n${companyName}`

          if (process.env.RESEND_API_KEY) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: process.env.RESEND_FROM || 'noreply@growth-plan.ca',
                  to: clientEmail,
                  subject: `[Rappel 24h] Devis ${devis.numero} — ${companyName}`,
                  text: message,
                }),
              })
            } catch (e) {
              console.error('[CRON Relance Devis] Erreur email:', e)
            }
          }

          // Historique
          await supabase.from('relances').insert({
            company_id: devis.company_id,
            devis_id: devis.id,
            canal: 'email',
            destinataire: clientEmail,
            message,
          })

          // Update timestamp pour ne pas relancer en boucle
          await supabase.from('devis').update({ updated_at: new Date().toISOString() }).eq('id', devis.id)
          totalDevisRelances++
        }
      }
    }

    // 2. RELANCE AUTOMATIQUE 24H : Factures impayées en retard
    const { data: facturesARelancer } = await supabase
      .from('factures')
      .select('id, numero, montant_ttc, date_echeance, company_id, updated_at, clients(nom, email), companies(name)')
      .in('statut', ['envoyee', 'vue', 'en_retard'])
      .lt('date_echeance', nowStr)
      .lt('updated_at', ilYAHuitHeures)
      .limit(50)

    if (facturesARelancer && facturesARelancer.length > 0) {
      for (const fac of facturesARelancer) {
        const clientEmail = (fac.clients as any)?.email
        const clientNom = (fac.clients as any)?.nom || 'Client'
        const companyName = (fac.companies as any)?.name || 'Notre Entreprise'

        if (clientEmail) {
          const message = `Bonjour ${clientNom},\n\nSauf erreur de notre part, la facture ${fac.numero} d'un montant de ${fac.montant_ttc} $ arrivait à échéance le ${fac.date_echeance}.\n\nMerci d'effectuer le règlement dans les meilleurs délais.\n\nCordialement,\n${companyName}`

          if (process.env.RESEND_API_KEY) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                  from: process.env.RESEND_FROM || 'noreply@growth-plan.ca',
                  to: clientEmail,
                  subject: `[Rappel Échéance] Facture ${fac.numero} — ${companyName}`,
                  text: message,
                }),
              })
            } catch (e) {
              console.error('[CRON Relance Factures] Erreur email:', e)
            }
          }

          await supabase.from('relances').insert({
            company_id: fac.company_id,
            facture_id: fac.id,
            canal: 'email',
            destinataire: clientEmail,
            message,
          })

          await supabase.from('factures').update({ updated_at: new Date().toISOString() }).eq('id', fac.id)
          totalFacturesRelances++
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      devisRelances: totalDevisRelances,
      facturesRelances: totalFacturesRelances,
    })
  } catch (err) {
    console.error('[CRON Relances]', err)
    return NextResponse.json({ error: 'Erreur lors du traitement du cron de relances' }, { status: 500 })
  }
}
