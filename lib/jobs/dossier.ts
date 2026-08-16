/** Types d'événements du flux documentaire chantier */
export type DossierEventKind =
  | 'job_created'
  | 'devis'
  | 'facture'
  | 'depense'
  | 'note'
  | 'document'
  | 'pointage'

export interface DossierTimelineEvent {
  id: string
  kind: DossierEventKind
  date: string
  titre: string
  sousTitre?: string
  montant?: number | null
  statut?: string | null
  href?: string | null
  meta?: Record<string, unknown>
}

export interface DossierRow {
  id: string
  kind: DossierEventKind
  date: string
  titre: string
  sousTitre?: string
  montant?: number | null
  statut?: string | null
  href?: string | null
  meta?: Record<string, unknown>
}

function toIso(d: string | null | undefined): string {
  if (!d) return new Date(0).toISOString()
  return new Date(d).toISOString()
}

/** Construit la timeline unifiée du dossier chantier, triée du plus récent au plus ancien. */
export function buildJobTimeline(
  input: {
    jobCreatedAt: string
    jobTitre: string
    devis?: Array<{
      id: string
      numero: string
      titre: string | null
      statut: string | null
      montant_ttc: number | null
      created_at: string
      envoye_le?: string | null
      approuve_le?: string | null
    }>
    factures?: Array<{
      id: string
      numero: string
      titre: string | null
      statut: string | null
      montant_ttc: number | null
      created_at: string
      date_paiement?: string | null
    }>
    depenses?: Array<{
      id: string
      description: string
      montant: number
      categorie: string | null
      date_depense: string
      created_at: string
    }>
    notes?: Array<{
      id: string
      type: string
      contenu: string
      created_at: string
      profiles?: { full_name: string | null } | null
    }>
    documents?: Array<{
      id: string
      type: string
      titre: string
      file_url: string | null
      created_at: string
    }>
    pointages?: Array<{
      id: string
      date: string
      duree_minutes: number | null
      approuve: boolean
      created_at: string
      profiles?: { full_name: string | null } | null
    }>
  },
  options?: { includeFinancials?: boolean },
): DossierTimelineEvent[] {
  const includeFinancials = options?.includeFinancials !== false
  const events: DossierTimelineEvent[] = []

  events.push({
    id: 'job-created',
    kind: 'job_created',
    date: toIso(input.jobCreatedAt),
    titre: 'Chantier créé',
    sousTitre: input.jobTitre,
  })

  for (const d of input.devis ?? []) {
    events.push({
      id: `devis-${d.id}`,
      kind: 'devis',
      date: toIso(d.approuve_le ?? d.envoye_le ?? d.created_at),
      titre: `Devis ${d.numero}`,
      sousTitre: d.titre ?? undefined,
      montant: includeFinancials ? Number(d.montant_ttc ?? 0) : null,
      statut: d.statut,
      href: `/devis/${d.id}`,
    })
  }

  for (const f of input.factures ?? []) {
    events.push({
      id: `facture-${f.id}`,
      kind: 'facture',
      date: toIso(f.date_paiement ?? f.created_at),
      titre: `Facture ${f.numero}`,
      sousTitre: f.titre ?? undefined,
      montant: includeFinancials ? Number(f.montant_ttc ?? 0) : null,
      statut: f.statut,
      href: `/factures/${f.id}`,
    })
  }

  for (const dep of input.depenses ?? []) {
    events.push({
      id: `depense-${dep.id}`,
      kind: 'depense',
      date: toIso(dep.date_depense ?? dep.created_at),
      titre: dep.description,
      sousTitre: dep.categorie ?? 'Dépense',
      montant: includeFinancials ? Number(dep.montant) : null,
    })
  }

  for (const n of input.notes ?? []) {
    const auteur = n.profiles?.full_name ?? 'Équipe'
    events.push({
      id: `note-${n.id}`,
      kind: 'note',
      date: toIso(n.created_at),
      titre: n.type === 'note' ? 'Note' : n.type,
      sousTitre: `${auteur} — ${n.contenu.slice(0, 80)}${n.contenu.length > 80 ? '…' : ''}`,
    })
  }

  for (const doc of input.documents ?? []) {
    events.push({
      id: `doc-${doc.id}`,
      kind: 'document',
      date: toIso(doc.created_at),
      titre: doc.titre,
      sousTitre: doc.type,
      href: doc.file_url,
    })
  }

  for (const p of input.pointages ?? []) {
    const nom = p.profiles?.full_name ?? 'Employé'
    const mins = p.duree_minutes ?? 0
    const h = Math.floor(mins / 60)
    const m = mins % 60
    events.push({
      id: `pointage-${p.id}`,
      kind: 'pointage',
      date: toIso(p.date ?? p.created_at),
      titre: `Pointage — ${nom}`,
      sousTitre: `${h}h${String(m).padStart(2, '0')}${p.approuve ? ' · approuvé' : ''}`,
    })
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const DOSSIER_KIND_LABELS: Record<DossierEventKind, string> = {
  job_created: 'Création',
  devis: 'Devis',
  facture: 'Facture',
  depense: 'Dépense',
  note: 'Note',
  document: 'Document',
  pointage: 'Pointage',
}

export const DOSSIER_KIND_COLORS: Record<DossierEventKind, string> = {
  job_created: 'var(--txt-3)',
  devis: 'var(--blue)',
  facture: 'var(--green)',
  depense: 'var(--amber)',
  note: 'var(--purple)',
  document: 'var(--gold)',
  pointage: 'var(--blue)',
}
