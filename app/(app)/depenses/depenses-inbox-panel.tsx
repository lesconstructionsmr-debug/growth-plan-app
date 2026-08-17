'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCircle2, Mail } from 'lucide-react'
import { SETUP_FEE_CAD } from '@/lib/stripe/pricing'

export default function DepensesInboxPanel() {
  const [address, setAddress] = useState('')
  const [ready, setReady] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/company/expenses-inbox')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Erreur')
        setAddress(data.address || '')
        setReady(data.ready !== false)
        if (data.error) setError(data.error)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erreur'))
  }, [])

  const box: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderRadius: '12px', padding: '16px 18px',
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Mail size={16} color="var(--gold)" />
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>
          Courriels → Dépenses (pas d&apos;envoi)
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: '0 0 12px', lineHeight: 1.6 }}>
        Tu <strong>transfères</strong> les factures reçues (Home Depot, sous-traitant, fournisseur)
        vers cette adresse. Plan Growth lit la pièce jointe, crée la dépense, et rattache le
        <strong> chantier</strong> si le nom du projet est dans l&apos;objet ou le fichier.
        Rien n&apos;est envoyé. Inclus dans les {SETUP_FEE_CAD}&nbsp;$ d&apos;adhésion.
      </p>
      <ol style={{ margin: '0 0 12px', paddingLeft: '18px', fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.7 }}>
        <li>Gmail / Outlook : règle « Transférer les courriels Facture vers … »</li>
        <li>Ou donne cette adresse à ton fournisseur (réception seulement)</li>
        <li>Si le chantier n&apos;est pas trouvé → la dépense arrive dans « À rattacher »</li>
      </ol>
      {error && <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginBottom: '8px' }}>{error}</div>}
      {ready && address && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            readOnly
            value={address}
            onFocus={e => e.target.select()}
            style={{
              flex: 1, background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)',
              fontFamily: 'ui-monospace, monospace',
            }}
          />
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(address)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 600,
              color: 'var(--txt-1)', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      )}
    </div>
  )
}
