const CATEGORIES = [
  'Matériaux',
  'Équipement',
  'Sous-traitant',
  'Transport',
  'Hébergement',
  'Dépense Fixe',
  'Budget Personnel',
  'Autre',
] as const

export type ScanResult = {
  description: string
  montant: number
  date_depense: string
  categorie: string
  fournisseur: string
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function mapCategorie(raw: string): string {
  const s = raw.toLowerCase()
  if (s.includes('matéri') || s.includes('materi') || s.includes('fourniture') || s.includes('quincaill')) return 'Matériaux'
  if (s.includes('équip') || s.includes('equip') || s.includes('outil') || s.includes(' locat')) return 'Équipement'
  if (s.includes('sous-trait') || s.includes('soustrait') || s.includes('plomb') || s.includes('électri') || s.includes('electri')) return 'Sous-traitant'
  if (s.includes('transport') || s.includes('essence') || s.includes('carburant') || s.includes('uber') || s.includes('livraison')) return 'Transport'
  if (s.includes('hôtel') || s.includes('hotel') || s.includes('héberg') || s.includes('heberg')) return 'Hébergement'
  if (s.includes('fixe') || s.includes('assurance') || s.includes('loyer')) return 'Dépense Fixe'
  if (CATEGORIES.includes(raw as (typeof CATEGORIES)[number])) return raw
  return 'Autre'
}

export function parseScanJson(raw: string): ScanResult {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  let obj: Record<string, unknown> = {}
  try {
    obj = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) obj = JSON.parse(m[0]) as Record<string, unknown>
  }

  const montant = Number(String(obj.montant ?? obj.total ?? obj.amount ?? '0').replace(',', '.').replace(/[^\d.]/g, ''))
  const dateRaw = String(obj.date_depense ?? obj.date ?? '')
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : today()
  const fournisseur = String(obj.fournisseur ?? obj.vendor ?? '').trim()
  const desc = String(obj.description ?? '').trim() || (fournisseur ? `Facture ${fournisseur}` : 'Facture scannée')

  return {
    description: desc.slice(0, 200),
    montant: Number.isFinite(montant) && montant > 0 ? Math.round(montant * 100) / 100 : 0,
    date_depense: date,
    categorie: mapCategorie(String(obj.categorie ?? obj.category ?? 'Autre')),
    fournisseur,
  }
}

export const SCAN_PROMPT = `Lis cette photo de facture ou reçu (Québec / Canada).
Réponds UNIQUEMENT un JSON valide, sans markdown :
{"fournisseur":"","description":"","montant":0,"date_depense":"YYYY-MM-DD","categorie":""}
montant = total à payer (TTC si visible).
categorie = une seule parmi : Matériaux, Équipement, Sous-traitant, Transport, Hébergement, Dépense Fixe, Autre.
description = court (fournisseur + quoi), en français.`
