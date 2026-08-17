import { useEffect, useState, useCallback } from 'react'

export interface UtmParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

const STORAGE_KEY = 'pg_utm_params'
const DRAFT_LEAD_KEY = 'pg_draft_lead_id'

export function getStoredUtms(): UtmParams {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function useUtmCapture(): UtmParams {
  const [utms, setUtms] = useState<UtmParams>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const urlParams = new URLSearchParams(window.location.search)

    const captured: UtmParams = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const) {
      const val = urlParams.get(key)
      if (val) captured[key] = val
    }

    if (Object.keys(captured).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured))
      setUtms(captured)
    } else {
      setUtms(getStoredUtms())
    }
  }, [])

  return utms
}

export async function sendLeadDraft(data: {
  email?: string
  telephone?: string
  nom?: string
  entreprise?: string
  besoin?: string
  taille_equipe?: string
}): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const utms = getStoredUtms()
  const existingId = sessionStorage.getItem(DRAFT_LEAD_KEY)

  try {
    const res = await fetch('/api/public/lead-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: existingId || undefined,
        ...utms,
        ...data,
      }),
    })

    if (!res.ok) return null
    const json = await res.json()
    if (json.lead_id) {
      sessionStorage.setItem(DRAFT_LEAD_KEY, json.lead_id)
      return json.lead_id
    }
  } catch (err) {
    console.warn('[UtmCapture] Error sending lead draft:', err)
  }
  return null
}
