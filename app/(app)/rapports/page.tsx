'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { BarChart3, TrendingUp, Receipt, FileText, Hammer, Loader2, RefreshCw } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

const pct = (a: number, b: number) => b === 0 ? '—' : `${Math.round((a / b) * 100)}%`

interface Stats {
  // Factures
  facturesTotal: number
  facturesPaye: number
  facturesEnvoyees: number
  facturesEnRetard: number
  // Devis
  devisTotal: number
  devisApprouves: number
  devisBrouillon: number
  devisEnvoyes: number
  // Jobs
  jobsTotal: number
  jobsEnCours: number
  jobsTermines: number
  jobsBudgetTotal: number
  // Dépenses
  depensesTotal: number
  depensesCeMois: number
}

function getMonthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

export default function RapportsPage() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<'30' | '90' | '180' | '365'>('30')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const load = useCallback(async () => {
    setLoading(true)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - parseInt(periode))
    const cutoffStr = cutoff.toISOString().split('T')[0]
    const monthStart = getMonthStart()
    const now = new Date().toISOString()

    const [
      { data: factures },
      { data: devis },
      { data: jobs },
      { data: depenses },
      { data: depensesMois },
    ] = await Promise.all([
      supabase.from('factures').select('montant_ttc, statut, date_echeance'),
      supabase.from('devis').select('montant_ttc, statut'),
      supabase.from('jobs').select('budget, statut'),
      supabase.from('depenses').select('montant'),
      supabase.from('depenses').select('montant').gte('date_depense', monthStart),
    ])

    const f = factures || []
    const d = devis     || []
    const j = jobs      || []
    const dep = depenses || []
    const depM = depensesMois || []

    setStats({
      facturesTotal:    f.reduce((s, x) => s + (x.montant_ttc || 0), 0),
      facturesPaye:     f.filter(x => x.statut === 'payée').reduce((s, x) => s + (x.montant_ttc || 0), 0),
      facturesEnvoyees: f.filter(x => x.statut === 'envoyée').reduce((s, x) => s + (x.montant_ttc || 0), 0),
      facturesEnRetard: f.filter(x => x.statut === 'envoyée' && x.date_echeance && x.date_echeance < now).reduce((s, x) => s + (x.montant_ttc || 0), 0),
      devisTotal:     d.length,
      devisApprouves: d.filter(x => x.statut === 'approuvé').length,
      devisBrouillon: d.filter(x => x.statut === 'brouillon').length,
      devisEnvoyes:   d.filter(x => x.statut === 'envoyé').length,
      jobsTotal:      j.length,
      jobsEnCours:    j.filter(x => x.statut === 'en_cours').length,
      jobsTermines:   j.filter(x => x.statut === 'terminé').length,
      jobsBudgetTotal: j.reduce((s, x) => s + (x.budget || 0), 0),
      depensesTotal:   dep.reduce((s, x) => s + (x.montant || 0), 0),
      depensesCeMois:  depM.reduce((s, x) => s + (x.montant || 0), 0),
    })
    setLoading(false)
  }, [periode])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '10px', color: 'var(--txt-3)' }}>
      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '13px' }}>Chargement des rapports…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const s = stats!
  const margeGrossePct = s.facturesTotal > 0
    ? Math.round(((s.facturesTotal - s.depensesTotal) / s.facturesTotal) * 100)
    : 0

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '980px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Rapports</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {(['30', '90', '180', '365'] as const).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              style={{ padding: '6px 12px', borderRadius: '7px', border: '0.5px solid var(--line)', background: periode === p ? 'var(--bg-3)' : 'var(--bg-1)', color: periode === p ? 'var(--txt-1)' : 'var(--txt-3)', fontSize: '11px', cursor: 'pointer', fontWeight: periode === p ? 600 : 400 }}>
              {p === '30' ? '30 jours' : p === '90' ? '3 mois' : p === '180' ? '6 mois' : '12 mois'}
            </button>
          ))}
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', borderRadius: '7px', border: '0.5px solid var(--line)', background: 'var(--bg-1)', color: 'var(--txt-3)', fontSize: '11px', cursor: 'pointer' }}>
            <RefreshCw size={11} /> Actualiser
          </button>
        </div>
      </div>

      {/* KPI top */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Revenus (factures)',    value: fmt(s.facturesTotal),        color: 'var(--green)',  icon: TrendingUp },
          { label: 'Encaissé (payé)',        value: fmt(s.facturesPaye),         color: 'var(--gold)',   icon: Receipt    },
          { label: 'Dépenses totales',       value: fmt(s.depensesTotal),        color: 'var(--red)',    icon: Receipt    },
          { label: 'Marge brute estimée',    value: `${margeGrossePct}%`,        color: margeGrossePct >= 30 ? 'var(--green)' : 'var(--amber)', icon: BarChart3 },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '9.5px', color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</span>
                <Icon size={14} color={k.color} />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: k.color }}>{k.value}</div>
            </div>
          )
        })}
      </div>

      {/* Deux colonnes : Factures + Devis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Factures */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Receipt size={14} color="var(--gold)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Factures</span>
          </div>
          {[
            { label: 'Total émis',     value: fmt(s.facturesTotal),    color: 'var(--txt-1)', bar: 100 },
            { label: 'Encaissé',       value: fmt(s.facturesPaye),     color: 'var(--green)', bar: s.facturesTotal > 0 ? (s.facturesPaye / s.facturesTotal) * 100 : 0 },
            { label: 'En attente',     value: fmt(s.facturesEnvoyees), color: 'var(--amber)', bar: s.facturesTotal > 0 ? (s.facturesEnvoyees / s.facturesTotal) * 100 : 0 },
            { label: 'En retard',      value: fmt(s.facturesEnRetard), color: 'var(--red)',   bar: s.facturesTotal > 0 ? (s.facturesEnRetard / s.facturesTotal) * 100 : 0 },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--txt-3)', marginBottom: '3px' }}>
                <span>{r.label}</span><span style={{ color: r.color, fontWeight: 600 }}>{r.value}</span>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.bar}%`, background: r.color, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Devis */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={14} color="var(--gold)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Devis — Taux de conversion</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total devis', value: `${s.devisTotal}`, color: 'var(--txt-1)' },
              { label: 'Taux approbation', value: pct(s.devisApprouves, s.devisTotal), color: 'var(--green)' },
              { label: 'Approuvés', value: `${s.devisApprouves}`, color: 'var(--green)' },
              { label: 'Envoyés', value: `${s.devisEnvoyes}`, color: 'var(--amber)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
          {/* Bar visuelle conversion */}
          <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '5px' }}>Entonnoir devis</div>
          {[
            { label: 'Total', count: s.devisTotal, color: 'var(--txt-3)' },
            { label: 'Envoyés', count: s.devisEnvoyes, color: 'var(--amber)' },
            { label: 'Approuvés', count: s.devisApprouves, color: 'var(--green)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <div style={{ width: '60px', fontSize: '10px', color: 'var(--txt-3)' }}>{r.label}</div>
              <div style={{ flex: 1, height: '5px', background: 'var(--bg-3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.devisTotal > 0 ? (r.count / s.devisTotal) * 100 : 0}%`, background: r.color, borderRadius: '3px' }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: r.color, minWidth: '20px' }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chantiers + Dépenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Chantiers */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Hammer size={14} color="var(--gold)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Chantiers / Projets</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Total projets', value: `${s.jobsTotal}`,      color: 'var(--txt-1)' },
              { label: 'En cours',      value: `${s.jobsEnCours}`,    color: 'var(--blue)'  },
              { label: 'Terminés',      value: `${s.jobsTermines}`,   color: 'var(--green)' },
              { label: 'Budget total',  value: fmt(s.jobsBudgetTotal), color: 'var(--gold)'  },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dépenses */}
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Receipt size={14} color="var(--red)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Dépenses</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: 'Total dépenses',  value: fmt(s.depensesTotal),  color: 'var(--red)'   },
              { label: 'Ce mois-ci',      value: fmt(s.depensesCeMois), color: 'var(--amber)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '12px 14px' }}>
                <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
          {/* Marge */}
          <div style={{ background: margeGrossePct >= 30 ? 'rgba(92,184,122,0.08)' : 'rgba(212,150,12,0.08)', border: `0.5px solid ${margeGrossePct >= 30 ? 'rgba(92,184,122,0.3)' : 'rgba(212,150,12,0.3)'}`, borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '4px' }}>Marge brute estimée (revenus − dépenses)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: margeGrossePct >= 30 ? 'var(--green)' : 'var(--amber)' }}>
              {fmt(s.facturesTotal - s.depensesTotal)} <span style={{ fontSize: '13px' }}>({margeGrossePct}%)</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
