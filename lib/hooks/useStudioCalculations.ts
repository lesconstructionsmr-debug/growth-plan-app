import { useMemo } from 'react'

export interface StudioLigneItem {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
  cout_unitaire: number
  total_ligne: number
  total_cout: number
  marge_pourcentage: number
}

export interface StudioCalculationResult {
  sousTotalVente: number
  coutTotal: number
  profitNet: number
  margeGlobalePct: number
  rabaisMontant: number
  baseTaxable: number
  tps: number
  tvq: number
  totalTtc: number
  totalPaye: number
  soldeRestant: number
}

export function calculateStudioTotals(
  lignes: StudioLigneItem[],
  rabaisValeur: number = 0,
  rabaisType: 'pourcentage' | 'montant' = 'montant',
  appliquerTps: boolean = true,
  appliquerTvq: boolean = true,
  acomptesPayes: number = 0
): StudioCalculationResult {
  let sousTotalVente = 0
  let coutTotal = 0

  for (const ligne of lignes) {
    const q = Number(ligne.quantite) || 0
    const p = Number(ligne.prix_unitaire) || 0
    const c = Number(ligne.cout_unitaire) || 0

    sousTotalVente += q * p
    coutTotal += q * c
  }

  const profitNet = sousTotalVente - coutTotal
  const margeGlobalePct = sousTotalVente > 0 ? (profitNet / sousTotalVente) * 100 : 0

  let rabaisMontant = 0
  if (rabaisType === 'pourcentage') {
    const pct = Math.min(100, Math.max(0, Number(rabaisValeur) || 0))
    rabaisMontant = (sousTotalVente * pct) / 100
  } else {
    rabaisMontant = Math.min(sousTotalVente, Math.max(0, Number(rabaisValeur) || 0))
  }

  const baseTaxable = Math.max(0, sousTotalVente - rabaisMontant)
  const tps = appliquerTps ? baseTaxable * 0.05 : 0
  const tvq = appliquerTvq ? baseTaxable * 0.09975 : 0
  const totalTtc = baseTaxable + tps + tvq

  const totalPaye = Math.max(0, Number(acomptesPayes) || 0)
  const soldeRestant = Math.max(0, totalTtc - totalPaye)

  return {
    sousTotalVente,
    coutTotal,
    profitNet,
    margeGlobalePct,
    rabaisMontant,
    baseTaxable,
    tps,
    tvq,
    totalTtc,
    totalPaye,
    soldeRestant,
  }
}

export function useStudioCalculations(
  lignes: StudioLigneItem[],
  rabaisValeur: number = 0,
  rabaisType: 'pourcentage' | 'montant' = 'montant',
  appliquerTps: boolean = true,
  appliquerTvq: boolean = true,
  acomptesPayes: number = 0
): StudioCalculationResult {
  return useMemo(
    () => calculateStudioTotals(lignes, rabaisValeur, rabaisType, appliquerTps, appliquerTvq, acomptesPayes),
    [lignes, rabaisValeur, rabaisType, appliquerTps, appliquerTvq, acomptesPayes]
  )
}
