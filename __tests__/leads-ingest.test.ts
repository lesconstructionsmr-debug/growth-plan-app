import { describe, it, expect } from 'vitest'
import { parseGoogleLead, parseJsonLead, isGoogleLeadPayload } from '@/lib/leads/parse-ingest'

const SAMPLE = {
  lead_id: 'abc',
  campaign_id: 123,
  user_column_data: [
    { column_name: 'Full Name', string_value: 'Marie Tremblay' },
    { column_name: 'User Phone', string_value: '+15145550100' },
    { column_name: 'User Email', string_value: 'marie@example.com' },
  ],
  api_version: '1.0',
  form_id: 99,
  google_key: 'key-uuid',
  is_test: true,
}

describe('parse Google Ads lead form', () => {
  it('extrait nom, courriel, téléphone et marque le test', () => {
    const f = parseGoogleLead(SAMPLE, 'key-uuid')
    expect(f.nom).toBe('Marie Tremblay')
    expect(f.email).toBe('marie@example.com')
    expect(f.telephone).toBe('+15145550100')
    expect(f.source).toBe('Google Ads (test)')
    expect(f.isGoogle).toBe(true)
    expect(f.token).toBe('key-uuid')
  })

  it('accepte Google_key majuscule et le jeton dans l\'URL', () => {
    const f = parseGoogleLead({ ...SAMPLE, google_key: undefined, Google_key: 'from-body' }, 'from-url')
    expect(f.googleKey).toBe('from-body')
    expect(f.token).toBe('from-url')
  })

  it('détecte un payload Google', () => {
    expect(isGoogleLeadPayload(SAMPLE)).toBe(true)
    expect(isGoogleLeadPayload({ nom: 'x' })).toBe(false)
  })
})

describe('parseJsonLead', () => {
  it('garde le formulaire site', () => {
    const f = parseJsonLead({ nom: 'Luc', email: 'luc@x.ca', telephone: '514' }, 't1')
    expect(f.source).toBe('Formulaire site web')
    expect(f.isGoogle).toBe(false)
  })
})
