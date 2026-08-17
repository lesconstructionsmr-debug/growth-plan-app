export type Channel = 'google' | 'meta' | 'site' | 'autre'

export const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'google', label: 'Google Ads' },
  { id: 'meta', label: 'Meta / Instagram' },
  { id: 'site', label: 'Site web' },
  { id: 'autre', label: 'Autre / manuel' },
]

export type MarketingBudgets = Record<Channel, number>

export const EMPTY_BUDGETS: MarketingBudgets = { google: 0, meta: 0, site: 0, autre: 0 }

export function classifySource(source: string | null | undefined): Channel {
  const s = (source || '').toLowerCase()
  if (s.includes('google')) return 'google'
  if (s.includes('meta') || s.includes('facebook') || s.includes('instagram') || s.includes('insta')) return 'meta'
  if (
    s.includes('site') ||
    s.includes('formulaire') ||
    s.includes('landing') ||
    s.includes('audit') ||
    s.includes('web') ||
    s.includes('connexion')
  ) return 'site'
  return 'autre'
}

export function startOfMonth(d = new Date()): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

export function scoreLead(input: {
  typeProjet: 'reno' | 'commercial' | 'construction'
  budget: 'froid' | 'tiede' | 'chaud'
  delai: 'flexible' | 'moyen' | 'urgent'
}): { points: number; chaleur: 'Froid' | 'Tiède' | 'Chaud'; valeurEstimee: number } {
  let points = 0
  if (input.typeProjet === 'reno') points += 25
  if (input.typeProjet === 'commercial') points += 35
  if (input.typeProjet === 'construction') points += 40
  if (input.budget === 'tiede') points += 20
  if (input.budget === 'chaud') points += 40
  if (input.delai === 'moyen') points += 10
  if (input.delai === 'urgent') points += 20

  const chaleur = points >= 70 ? 'Chaud' : points >= 45 ? 'Tiède' : 'Froid'
  const valeurEstimee = input.budget === 'chaud' ? 55000 : input.budget === 'tiede' ? 25000 : 8000
  return { points, chaleur, valeurEstimee }
}

export function cac(budget: number, leads: number): number | null {
  if (!budget || !leads) return null
  return budget / leads
}
