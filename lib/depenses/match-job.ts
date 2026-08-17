export type JobHint = { id: string; titre: string; adresse?: string | null }

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Rattache un courriel/facture à un chantier si le titre (ou l'adresse) apparaît clairement. */
export function matchJob(jobs: JobHint[], haystack: string): JobHint | null {
  const hay = fold(haystack)
  if (!hay || jobs.length === 0) return null

  const scored = jobs
    .map(j => {
      const titre = fold(j.titre)
      const adresse = fold(j.adresse || '')
      let score = 0
      if (titre.length >= 4 && hay.includes(titre)) score = titre.length
      else if (adresse.length >= 8 && hay.includes(adresse)) score = adresse.length
      return { j, score }
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length === 0) return null
  if (scored.length > 1 && scored[0].score === scored[1].score) return null
  return scored[0].j
}

export function extractInboxKey(to: string): string | null {
  const addr = to.toLowerCase().trim()
  const m =
    addr.match(/depenses[_+-]?([a-z0-9]{8,16})@/) ||
    addr.match(/factures[_+-]?([a-z0-9]{8,16})@/)
  return m?.[1] ?? null
}

export function inboxAddress(key: string): string {
  const domain = process.env.EXPENSES_INBOUND_DOMAIN || 'inbound.growth-plan.ca'
  return `depenses-${key}@${domain}`
}
