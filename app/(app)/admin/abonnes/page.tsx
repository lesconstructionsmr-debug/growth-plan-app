'use client'

import { useState, useEffect } from 'react'
import {
  Crown, TrendingUp, Users, DollarSign, AlertCircle,
  CheckCircle2, Clock, XCircle, Search, ExternalLink, Loader2,
} from 'lucide-react'
import { formatCadNoDecimals } from '@/lib/format'

type StatutAbo = 'active' | 'trialing' | 'past_due' | 'canceled'

interface Abonne {
  id: string
  nom: string
  email: string
  plan: 'mensuel' | 'annuel'
  statut: StatutAbo
  debut: string
  prochain_paiement: string | null
  montant: number
  stripe_customer_id: string
}

const STATUT_CFG: Record<StatutAbo, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:   { label: 'Actif',        color: 'var(--green)',  bg: 'var(--green)18',  icon: CheckCircle2 },
  trialing: { label: 'Essai gratuit',color: 'var(--blue)',   bg: 'var(--blue)18',   icon: Clock        },
  past_due: { label: 'Paiement dû',  color: 'var(--red)',    bg: 'var(--red)18',    icon: AlertCircle  },
  canceled: { label: 'Annulé',       color: 'var(--txt-3)',  bg: 'var(--bg-3)',     icon: XCircle      },
}

const fmt = formatCadNoDecimals

export default function AdminAbonnesPage() {
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState<StatutAbo | 'tous'>('tous')
  const [abonnes, setAbonnes] = useState<Abonne[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/abonnes')
      .then(r => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then(data => {
        if (Array.isArray(data)) setAbonnes(data)
      })
      .catch(() => {
        setAbonnes([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const actifs    = abonnes.filter(a => a.statut === 'active')
  const essais    = abonnes.filter(a => a.statut === 'trialing')
  const retards   = abonnes.filter(a => a.statut === 'past_due')

  // MRR : mensuel actif + annuel/12
  const mrr = actifs.reduce((sum, a) => sum + (a.plan === 'annuel' ? a.montant / 12 : a.montant), 0)
  const arr  = mrr * 12

  const filtered = abonnes.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = a.nom.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    const matchFiltre = filtre === 'tous' || a.statut === filtre
    return matchSearch && matchFiltre
  })

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Crown size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Abonnés SaaS</h1>
          <span style={{ fontSize: '11px', color: 'var(--txt-3)', background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px' }}>
            {abonnes.length} comptes
          </span>
          {retards.length > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--red)', background: 'var(--red)12', borderRadius: '5px', padding: '2px 7px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={10} /> {retards.length} en retard
            </span>
          )}
        </div>
        <a
          href="https://dashboard.stripe.com/customers"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px',
            padding: '7px 12px', fontSize: '11px', color: 'var(--txt-2)', textDecoration: 'none',
          }}
        >
          <ExternalLink size={12} /> Stripe Dashboard
        </a>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'MRR', value: fmt(mrr), icon: DollarSign, color: 'var(--gold)',   sub: 'Revenus mensuels récurrents' },
          { label: 'ARR', value: fmt(arr), icon: TrendingUp,  color: 'var(--green)',  sub: 'Revenus annuels projetés'    },
          { label: 'Actifs', value: actifs.length.toString(), icon: CheckCircle2, color: 'var(--green)', sub: `${essais.length} en essai gratuit` },
          { label: 'En retard', value: retards.length.toString(), icon: AlertCircle, color: 'var(--red)', sub: `${fmt(retards.reduce((s, a) => s + a.montant, 0))} à collecter` },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon size={14} color={k.color} />
                <span style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em' }}>{k.label}</span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: k.color, marginBottom: '4px' }}>{k.value}</div>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{k.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '7px 12px', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <Search size={13} color="var(--txt-3)" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un abonné…"
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', flex: 1, fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['tous', 'active', 'trialing', 'past_due', 'canceled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFiltre(s)}
              style={{
                padding: '6px 12px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer',
                border: '0.5px solid var(--line)',
                background: filtre === s ? 'var(--gold)' : 'var(--bg-1)',
                color: filtre === s ? '#0A0A0A' : 'var(--txt-2)',
                fontWeight: filtre === s ? 700 : 400,
              }}
            >
              {s === 'tous' ? 'Tous' : STATUT_CFG[s as StatutAbo].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 100px 110px 130px 100px', padding: '10px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
          {['ENTREPRISE', 'COURRIEL', 'PLAN', 'MONTANT', 'STATUT', 'PROCHAIN'].map(h => (
            <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Loader2 size={16} className="animate-spin" /> Chargement des abonnés…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', fontSize: '13px', color: 'var(--txt-3)' }}>
            Aucun abonné trouvé
          </div>
        ) : (
          filtered.map((a, i) => {
            const cfg = STATUT_CFG[a.statut]
            const Icon = cfg.icon
            return (
              <div key={a.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 100px 110px 130px 100px',
                padding: '12px 18px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
                background: a.statut === 'past_due' ? 'var(--red)05' : 'transparent',
              }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{a.nom}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>
                    Depuis {new Date(a.debut).toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{a.email}</div>
                <div>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '5px',
                    background: a.plan === 'annuel' ? 'var(--gold)20' : 'var(--blue)15',
                    color: a.plan === 'annuel' ? 'var(--gold-2)' : 'var(--blue)',
                  }}>
                    {a.plan === 'annuel' ? 'Annuel' : 'Mensuel'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>
                  {fmt(a.plan === 'annuel' ? a.montant : a.montant)}
                  <span style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 400 }}>
                    {a.plan === 'annuel' ? '/an' : '/mois'}
                  </span>
                </div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '5px', background: cfg.bg, color: cfg.color }}>
                    <Icon size={10} /> {cfg.label}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
                  {a.prochain_paiement
                    ? new Date(a.prochain_paiement).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
                    : '—'}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Lien Stripe */}
      <div style={{ fontSize: '11px', color: 'var(--txt-3)', textAlign: 'center' }}>
        Données en temps réel disponibles dans{' '}
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-2)' }}>
          Stripe Dashboard →
        </a>
        {' '}· Pour activer la sync en temps réel : connecter la route webhook Stripe.
      </div>

    </div>
  )
}

