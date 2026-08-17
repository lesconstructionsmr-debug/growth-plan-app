'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { Loader2, RefreshCw, Target } from 'lucide-react'
import { normalizeStatut } from '@/lib/status'
import {
  CHANNELS, EMPTY_BUDGETS, cac, classifySource, startOfMonth,
  type Channel, type MarketingBudgets,
} from '@/lib/leads/acquisition'
import FunnelStudioPanel from './funnel-studio-panel'
import QualifierPanel from './qualifier-panel'

type LeadLite = {
  id: string
  nom: string
  source: string | null
  statut: string
  valeur_estimee: number | null
  created_at: string
}

const money = (n: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

export default function AcquisitionPage() {
  const [onglet, setOnglet] = useState<'tableau' | 'brancher' | 'qualifier'>('tableau')
  const [loading, setLoading] = useState(true)
  const [savingBudget, setSavingBudget] = useState(false)
  const [leads, setLeads] = useState<LeadLite[]>([])
  const [devisTotal, setDevisTotal] = useState(0)
  const [devisApprouves, setDevisApprouves] = useState(0)
  const [jobsActifs, setJobsActifs] = useState(0)
  const [budgets, setBudgets] = useState<MarketingBudgets>(EMPTY_BUDGETS)
  const [persisted, setPersisted] = useState(true)

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: leadRows }, { data: devis }, { data: jobs }, mkt] = await Promise.all([
        supabase.from('leads').select('id, nom, source, statut, valeur_estimee, created_at').order('created_at', { ascending: false }),
        supabase.from('devis').select('statut'),
        supabase.from('jobs').select('statut'),
        fetch('/api/company/marketing').then(r => r.json()).catch(() => null),
      ])
      setLeads((leadRows ?? []) as LeadLite[])
      const d = devis || []
      setDevisTotal(d.length)
      setDevisApprouves(d.filter(x => ['converti', 'approuve'].includes(normalizeStatut(x.statut, 'brouillon'))).length)
      setJobsActifs((jobs || []).filter(x => x.statut === 'en_cours').length)
      if (mkt?.budgets) setBudgets({ ...EMPTY_BUDGETS, ...mkt.budgets })
      if (mkt && mkt.persisted === false) {
        const local = localStorage.getItem('erp_marketing_budgets')
        if (local) setBudgets({ ...EMPTY_BUDGETS, ...JSON.parse(local) })
        setPersisted(false)
      } else {
        setPersisted(true)
      }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { load() }, [load])

  const monthStart = startOfMonth()
  const thisMonth = leads.filter(l => l.created_at >= monthStart)
  const qualifies = leads.filter(x => ['qualifié', 'qualifie', 'proposition', 'gagné', 'gagne'].includes(x.statut))
  const pipeline = leads.reduce((s, l) => s + (Number(l.valeur_estimee) || 0), 0)

  const byChannel = useMemo(() => {
    const counts: Record<Channel, number> = { google: 0, meta: 0, site: 0, autre: 0 }
    const monthCounts: Record<Channel, number> = { google: 0, meta: 0, site: 0, autre: 0 }
    for (const l of leads) {
      const ch = classifySource(l.source)
      counts[ch] += 1
      if (l.created_at >= monthStart) monthCounts[ch] += 1
    }
    return { counts, monthCounts }
  }, [leads, monthStart])

  const spend = CHANNELS.reduce((s, c) => s + (budgets[c.id] || 0), 0)
  const monthLeads = thisMonth.length
  const avgCac = cac(spend, monthLeads)

  async function saveBudget(id: Channel, value: string) {
    const next = { ...budgets, [id]: Math.max(0, Math.round(Number(value) || 0)) }
    setBudgets(next)
    setSavingBudget(true)
    try {
      const res = await fetch('/api/company/marketing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgets: next }),
      })
      const data = await res.json()
      if (data.persisted === false) {
        localStorage.setItem('erp_marketing_budgets', JSON.stringify(next))
        setPersisted(false)
      } else {
        setPersisted(true)
      }
    } finally {
      setSavingBudget(false)
    }
  }

  const box: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px',
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Acquisition</h1>
        </div>
        <button
          type="button"
          onClick={load}
          style={{
            background: 'none', border: '0.5px solid var(--line)', borderRadius: '6px',
            padding: '6px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <RefreshCw size={11} /> Rafraîchir
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', borderBottom: '0.5px solid var(--line)', paddingBottom: '1px', flexWrap: 'wrap' }}>
        {[
          { id: 'tableau' as const, label: 'Tableau' },
          { id: 'brancher' as const, label: 'Brancher site & pubs' },
          { id: 'qualifier' as const, label: 'Qualifier' },
        ].map(o => (
          <button
            key={o.id}
            type="button"
            onClick={() => setOnglet(o.id)}
            style={{
              background: 'none', border: 'none',
              borderBottom: onglet === o.id ? '2px solid var(--gold)' : '2px solid transparent',
              color: onglet === o.id ? 'var(--gold-2)' : 'var(--txt-3)',
              padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'brancher' && <FunnelStudioPanel />}
      {onglet === 'qualifier' && <QualifierPanel />}

      {onglet === 'tableau' && (
        loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: 'var(--txt-3)' }}>
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              <Kpi label="Demandes ce mois" value={String(monthLeads)} />
              <Kpi label="Pipeline estimé" value={money(pipeline)} />
              <Kpi label="Coût / demande" value={avgCac == null ? '—' : money(avgCac)} hint="Budget du mois ÷ demandes du mois" />
              <Kpi label="Devis signés" value={String(devisApprouves)} />
            </div>

            {!persisted && (
              <div style={{ fontSize: '12px', color: 'var(--txt-3)', ...box }}>
                Les budgets restent sur cet appareil jusqu&apos;à ce que la colonne SQL soit ajoutée (migration 0012).
              </div>
            )}

            <div style={box}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>
                Par canal — demandes réelles + ton budget
              </div>
              <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '0 0 14px' }}>
                Le statut vient des leads dans le CRM, pas d&apos;une case à cocher.
                {savingBudget ? ' Enregistrement…' : ''}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {CHANNELS.map(ch => {
                  const n = byChannel.monthCounts[ch.id]
                  const all = byChannel.counts[ch.id]
                  const cost = cac(budgets[ch.id], n)
                  const live = all > 0
                  return (
                    <div key={ch.id} style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{ch.label}</span>
                        <span style={{
                          fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
                          background: live ? 'rgba(34,197,94,0.12)' : 'var(--bg-3)',
                          color: live ? 'var(--green)' : 'var(--txt-3)',
                        }}>
                          {live ? 'Reçoit des demandes' : 'En attente'}
                        </span>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)' }}>{n}</div>
                      <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginBottom: '10px' }}>ce mois · {all} au total</div>
                      <label style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Budget mensuel ($)</label>
                      <input
                        type="number"
                        min={0}
                        value={budgets[ch.id] || ''}
                        onChange={e => setBudgets(b => ({ ...b, [ch.id]: Math.max(0, Number(e.target.value) || 0) }))}
                        onBlur={e => saveBudget(ch.id, e.target.value)}
                        placeholder="0"
                        style={{
                          width: '100%', marginTop: '4px', background: 'var(--bg-1)', border: '0.5px solid var(--line)',
                          borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none',
                        }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginTop: '8px' }}>
                        Coût / demande : {cost == null ? '—' : money(cost)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={box}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', margin: '0 0 16px' }}>Entonnoir CRM</h3>
              {[
                { label: 'Prospects', val: leads.length },
                { label: 'Qualifiés', val: qualifies.length },
                { label: 'Devis', val: devisTotal },
                { label: 'Signés', val: devisApprouves },
                { label: 'Chantiers en cours', val: jobsActifs },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '140px', fontSize: '11px', color: 'var(--txt-2)' }}>{item.label}</div>
                  <div style={{ flex: 1, height: '8px', background: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(2, leads.length ? (item.val / Math.max(1, leads.length)) * 100 : 0)}%`,
                      background: 'var(--gold)', height: '100%',
                    }} />
                  </div>
                  <div style={{ width: '36px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{item.val}</div>
                </div>
              ))}
            </div>

            <div style={box}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Dernières demandes</h3>
                <Link href="/leads" style={{ fontSize: '12px', color: 'var(--gold-2)', textDecoration: 'none' }}>Tout voir</Link>
              </div>
              {leads.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>
                  Rien encore. Branche le site ou Google Ads, puis rafraîchis.
                </p>
              ) : leads.slice(0, 8).map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderTop: '0.5px solid var(--line)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--txt-1)', fontWeight: 600 }}>{l.nom}</span>
                  <span style={{ color: 'var(--txt-3)' }}>{l.source || 'manuel'}</span>
                  <span style={{ color: 'var(--txt-2)' }}>{l.statut}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '14px 16px' }}>
      <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)' }}>{value}</div>
      {hint && <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}
