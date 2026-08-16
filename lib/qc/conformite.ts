/** Calcul retenue de garantie légale (défaut 10 % au Québec — Loi sur les contrats de sous-traitance). */
export function calcRetenueGarantie(
  factureMontant: number,
  tauxRetenue = 0.10,
): { montantRetenu: number; montantNet: number } {
  const montant = Math.max(0, factureMontant)
  const taux = Math.min(Math.max(tauxRetenue, 0), 1)
  const montantRetenu = Math.round(montant * taux * 100) / 100
  return {
    montantRetenu,
    montantNet: Math.round((montant - montantRetenu) * 100) / 100,
  }
}

/** Métiers CCQ courants en construction au Québec */
export const CCQ_METIERS = [
  'Électricien',
  'Plombier',
  'Charpentier-menuisier',
  'Peintre',
  'Couvreur',
  'Céramiste',
  'Ferrailleur',
  'Opérateur de machinerie',
  'Manœuvre',
  'Autre',
] as const

export type CcqMetier = (typeof CCQ_METIERS)[number]

export const SEAO_STATUTS = [
  { value: 'a_soumettre', label: 'À soumettre' },
  { value: 'en_cours', label: 'En préparation' },
  { value: 'soumis', label: 'Soumis' },
  { value: 'gagne', label: 'Gagné' },
  { value: 'perdu', label: 'Perdu' },
  { value: 'annule', label: 'Annulé' },
] as const

export const RETENUE_STATUTS = [
  { value: 'active', label: 'Retenue active' },
  { value: 'partielle', label: 'Libération partielle' },
  { value: 'liberee', label: 'Libérée' },
] as const

export function formatCad(n: number): string {
  return n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
}
