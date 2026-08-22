import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient()

    // 1. Fetch from 'platform_leads' (Landing Page ROI Audit Leads & SaaS prospects)
    const { data: platformData, error: platformErr } = await admin
      .from('platform_leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (platformErr) {
      console.warn('[GET /api/leads/list] platform_leads error:', platformErr.message)
    }

    // 2. Fetch from 'leads' (Company CRM leads)
    const { data: companyData, error: companyErr } = await admin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (companyErr) {
      console.warn('[GET /api/leads/list] leads error:', companyErr.message)
    }

    const rawPlatform = platformData ?? []
    const rawCompany = companyData ?? []

    const formatted: Array<{
      id: string
      nom: string
      entreprise?: string
      telephone?: string
      email?: string
      montant_estime?: number
      date_creation: string
      statut: string
      priorite: 'basse' | 'normale' | 'haute'
      notes?: string
    }> = [
      ...rawCompany.map((l: any) => ({
        id: l.id,
        nom: l.nom,
        entreprise: l.source || l.entreprise || undefined,
        telephone: l.telephone || undefined,
        email: l.email || undefined,
        montant_estime: l.valeur_estimee ? Number(l.valeur_estimee) : undefined,
        date_creation: l.created_at || new Date().toISOString(),
        statut: l.statut || 'nouveau',
        priorite: 'normale' as const,
        notes: l.notes || undefined,
      })),
      ...rawPlatform.map((l: any) => ({
        id: l.id,
        nom: l.entreprise && !l.nom.includes(`(${l.entreprise})`) ? `${l.nom} (${l.entreprise})` : l.nom,
        entreprise: l.entreprise || l.source || 'Landing Page — Audit ROI',
        telephone: l.telephone || undefined,
        email: l.email || undefined,
        montant_estime: undefined,
        date_creation: l.created_at || new Date().toISOString(),
        statut: l.statut || 'nouveau',
        priorite: 'normale' as const,
        notes: l.notes || undefined,
      })),
    ]

    // Trier par date de création décroissante (du plus récent au plus ancien)
    formatted.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())

    // Déduplication par ID ou Clé unique
    const seen = new Set<string>()
    const unique = []
    for (const item of formatted) {
      const key = item.id || `${item.nom}-${item.email || item.telephone}`.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(item)
      }
    }

    return NextResponse.json(unique)
  } catch (err) {
    console.error('[GET /api/leads/list]', err)
    return NextResponse.json([], { status: 500 })
  }
}
