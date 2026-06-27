'use client'

import { useState } from 'react'
import { Zap, X, Crown, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none'

interface SubscriptionBannerProps {
  status: SubscriptionStatus
  trialDaysLeft?: number
}

export default function SubscriptionBanner({ status, trialDaysLeft = 0 }: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Abonnement actif → rien à afficher
  if (status === 'active') return null

  // Essai gratuit en cours
  if (status === 'trialing') {
    if (trialDaysLeft > 3) return null  // Pas urgent, pas de bannière
    return (
      <div style={{
        background: 'var(--ga)', borderBottom: '0.5px solid var(--gold-3)',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        fontSize: '12px',
      }}>
        <Crown size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, color: 'var(--txt-2)' }}>
          <strong style={{ color: 'var(--gold-2)' }}>
            {trialDaysLeft === 0 ? 'Votre essai gratuit expire aujourd\'hui' : `${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} d'essai restant${trialDaysLeft > 1 ? 's' : ''}`}
          </strong>
          {' — Abonnez-vous pour conserver l\'accès complet.'}
        </span>
        <Link href="/tarifs" style={{
          background: 'var(--gold)', color: '#0A0A0A', borderRadius: '7px',
          padding: '5px 14px', fontSize: '11px', fontWeight: 700, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
        }}>
          <Zap size={11} /> S'abonner — 175$/mois
        </Link>
        <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
    )
  }

  // Paiement en retard
  if (status === 'past_due') {
    return (
      <div style={{
        background: 'var(--red)10', borderBottom: '0.5px solid var(--red)',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        fontSize: '12px',
      }}>
        <AlertCircle size={14} color="var(--red)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, color: 'var(--txt-2)' }}>
          <strong style={{ color: 'var(--red)' }}>Problème de paiement</strong>
          {' — Mettez à jour votre paiement pour éviter la suspension du compte.'}
        </span>
        <button
          onClick={async () => {
            const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
            const { url } = await res.json()
            if (url) window.location.href = url
          }}
          style={{
            background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '7px',
            padding: '5px 14px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >
          Régler maintenant
        </button>
      </div>
    )
  }

  // Abonnement annulé
  if (status === 'canceled' || status === 'none') {
    return (
      <div style={{
        background: 'var(--bg-2)', borderBottom: '0.5px solid var(--line)',
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        fontSize: '12px',
      }}>
        <Zap size={14} color="var(--txt-3)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, color: 'var(--txt-3)' }}>
          Votre abonnement est inactif. Réabonnez-vous pour accéder à toutes les fonctionnalités.
        </span>
        <Link href="/tarifs" style={{
          background: 'var(--gold)', color: '#0A0A0A', borderRadius: '7px',
          padding: '5px 14px', fontSize: '11px', fontWeight: 700, textDecoration: 'none', flexShrink: 0,
        }}>
          Voir les tarifs
        </Link>
      </div>
    )
  }

  return null
}
