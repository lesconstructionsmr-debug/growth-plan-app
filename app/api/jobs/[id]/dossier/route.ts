import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api/auth'
import { requireJobAccess } from '@/lib/api/job-access'
import { isCompanyAdmin } from '@/lib/auth/permissions'
import { buildJobTimeline } from '@/lib/jobs/dossier'

export const dynamic = 'force-dynamic'

function normalizeProfile(
  profiles: { full_name: string | null } | { full_name: string | null }[] | null | undefined,
): { full_name: string | null } | null {
  if (!profiles) return null
  if (Array.isArray(profiles)) return profiles[0] ?? null
  return profiles
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { supabase, companyId, role } = await requireJobAccess(params.id)
    const includeFinancials = isCompanyAdmin(role)

    const [jobRes, devisRes, depensesRes, notesRes, docsRes, pointagesRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, clients(nom, email)')
        .eq('id', params.id)
        .single(),
      supabase
        .from('devis')
        .select('id, numero, titre, statut, montant_ttc, created_at, envoye_le, approuve_le')
        .eq('company_id', companyId)
        .eq('job_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('depenses')
        .select('id, description, montant, categorie, date_depense, created_at')
        .eq('company_id', companyId)
        .eq('job_id', params.id)
        .order('date_depense', { ascending: false }),
      supabase
        .from('notes')
        .select('id, type, contenu, created_at, profiles(full_name)')
        .eq('company_id', companyId)
        .eq('job_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('job_documents')
        .select('id, type, titre, file_url, created_at')
        .eq('company_id', companyId)
        .eq('job_id', params.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('pointages')
        .select('id, date, heure_debut, heure_fin, duree_minutes, dans_rayon_debut, dans_rayon_fin, notes, approuve, created_at, profiles(full_name)')
        .eq('company_id', companyId)
        .eq('job_id', params.id)
        .order('date', { ascending: false }),
    ])

    const devis = devisRes.data ?? []
    const devisIds = devis.map(d => d.id)

    const factureQueries = [
      supabase
        .from('factures')
        .select('id, numero, titre, statut, montant_ttc, created_at, date_paiement, devis_id, job_id')
        .eq('company_id', companyId)
        .eq('job_id', params.id),
    ]
    if (devisIds.length > 0) {
      factureQueries.push(
        supabase
          .from('factures')
          .select('id, numero, titre, statut, montant_ttc, created_at, date_paiement, devis_id, job_id')
          .eq('company_id', companyId)
          .in('devis_id', devisIds),
      )
    }

    const factureResults = await Promise.all(factureQueries)
    const factureMap = new Map<string, {
      id: string
      numero: string
      titre: string | null
      statut: string | null
      montant_ttc: number | null
      created_at: string
      date_paiement?: string | null
    }>()
    for (const res of factureResults) {
      for (const f of res.data ?? []) factureMap.set(f.id, f)
    }
    const factures = [...factureMap.values()].sort(
      (a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime(),
    )

    const pointages = (pointagesRes.data ?? []).map(p => ({
      ...p,
      profiles: normalizeProfile(p.profiles as { full_name: string | null } | { full_name: string | null }[] | null),
    }))
    const notes = (notesRes.data ?? []).map(n => ({
      ...n,
      profiles: normalizeProfile(n.profiles as { full_name: string | null } | { full_name: string | null }[] | null),
    }))
    const depenses = depensesRes.data ?? []
    const jobData = jobRes.data

    const timeline = buildJobTimeline(
      {
        jobCreatedAt: jobData?.created_at ?? new Date().toISOString(),
        jobTitre: jobData?.titre ?? 'Chantier',
        devis,
        factures,
        depenses,
        notes,
        documents: docsRes.data ?? [],
        pointages,
      },
      { includeFinancials },
    )

    const totalHeures = pointages.reduce((s, p) => s + (p.duree_minutes ?? 0), 0)
    const heuresApprouvees = pointages.filter(p => p.approuve).reduce((s, p) => s + (p.duree_minutes ?? 0), 0)
    const depensesTotal = depenses.reduce((s, d) => s + Number(d.montant), 0)

    return NextResponse.json({
      job: jobData,
      timeline,
      devis: includeFinancials ? devis : devis.map(d => ({ ...d, montant_ttc: null })),
      factures: includeFinancials ? factures : factures.map(f => ({ ...f, montant_ttc: null })),
      depenses: includeFinancials ? depenses : [],
      notes,
      documents: docsRes.data ?? [],
      pointages,
      stats: {
        totalHeures,
        heuresApprouvees,
        depensesTotal: includeFinancials ? depensesTotal : null,
        nbDevis: devis.length,
        nbFactures: factures.length,
        nbDocuments: (docsRes.data ?? []).length,
      },
    })
  } catch (err) {
    return apiError(err, '[GET /api/jobs/[id]/dossier]')
  }
}
