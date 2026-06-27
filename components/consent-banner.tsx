'use client'

import { useState, useEffect } from 'react'
import { Shield, X } from 'lucide-react'
import Link from 'next/link'

const CONSENT_KEY = 'erp_consent_v1'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Affiche la bannière seulement si le consentement n'a pas encore été donné
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
    setVisible(false)
  }

  function decline() {
    // En cas de refus, on enregistre quand même pour ne plus afficher la bannière
    // mais on n'active aucun traçage optionnel
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--bg-1, #1A1A1A)', borderTop: '0.5px solid rgba(201,168,76,0.3)',
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
    }}>
      <Shield size={16} color="#C9A84C" style={{ flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: '260px' }}>
        <span style={{ fontSize: '12px', color: 'var(--txt-1, #E5E5E5)', lineHeight: 1.5 }}>
          Nous utilisons des témoins essentiels pour maintenir votre session de connexion.
          Aucune donnée n'est partagée à des fins publicitaires.{' '}
          <Link href="/politique-confidentialite" style={{ color: '#C9A84C', textDecoration: 'underline' }}>
            Politique de confidentialité (Loi 25)
          </Link>
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            background: 'none', border: '0.5px solid rgba(255,255,255,0.2)',
            borderRadius: '7px', padding: '7px 14px',
            fontSize: '11px', color: 'var(--txt-3, #888)', cursor: 'pointer',
          }}
        >
          Refuser
        </button>
        <button
          onClick={accept}
          style={{
            background: '#C9A84C', border: 'none',
            borderRadius: '7px', padding: '7px 16px',
            fontSize: '11px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer',
          }}
        >
          Accepter
        </button>
      </div>

      <button
        onClick={decline}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3, #888)', flexShrink: 0 }}
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  )
}
