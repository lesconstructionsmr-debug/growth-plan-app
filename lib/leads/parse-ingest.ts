/** Normalise un POST site web ou un webhook Google Ads Lead Form. */

export type IngestFields = {
  token: string
  nom: string
  email: string
  telephone: string
  source: string
  notes: string
  googleKey: string
  isGoogle: boolean
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function pickColumn(cols: unknown[], ...needles: string[]): string {
  for (const col of cols) {
    if (!col || typeof col !== 'object') continue
    const row = col as Record<string, unknown>
    const label = `${str(row.column_name)} ${str(row.column_id)}`.toLowerCase()
    if (needles.some(n => label.includes(n))) return str(row.string_value)
  }
  return ''
}

export function parseGoogleLead(body: Record<string, unknown>, urlToken: string): IngestFields {
  const cols = Array.isArray(body.user_column_data) ? body.user_column_data : []
  const googleKey = str(body.google_key ?? body.Google_key)
  const nom =
    pickColumn(cols, 'full name', 'full_name', 'nom complet', 'name', 'nom') ||
    [pickColumn(cols, 'first name', 'prénom', 'prenom'), pickColumn(cols, 'last name', 'nom de famille')]
      .filter(Boolean)
      .join(' ')
  const email = pickColumn(cols, 'email', 'e-mail', 'courriel', 'user email')
  const telephone = pickColumn(cols, 'phone', 'téléphone', 'telephone', 'tel', 'user phone')
  const test = body.is_test === true
  const campaign = str(body.campaign_id)
  const formId = str(body.form_id)
  const notes = [
    campaign && `Campagne ${campaign}`,
    formId && `Formulaire ${formId}`,
    str(body.gcl_id) && `gclid ${body.gcl_id}`,
    test && 'Donnée test Google Ads',
  ].filter(Boolean).join(' · ')

  return {
    token: urlToken || googleKey,
    nom,
    email,
    telephone,
    source: test ? 'Google Ads (test)' : 'Google Ads',
    notes,
    googleKey,
    isGoogle: true,
  }
}

export function isGoogleLeadPayload(body: Record<string, unknown>): boolean {
  return Array.isArray(body.user_column_data) || Boolean(body.google_key || body.Google_key)
}

export function parseJsonLead(body: Record<string, unknown>, urlToken: string): IngestFields {
  if (isGoogleLeadPayload(body)) return parseGoogleLead(body, urlToken)
  return {
    token: str(body.token) || urlToken,
    nom: str(body.nom ?? body.name),
    email: str(body.email),
    telephone: str(body.telephone ?? body.phone),
    source: str(body.source) || 'Formulaire site web',
    notes: str(body.notes),
    googleKey: '',
    isGoogle: false,
  }
}
