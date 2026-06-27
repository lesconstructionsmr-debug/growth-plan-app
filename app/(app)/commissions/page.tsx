'use client'

import { useState, useEffect } from 'react'
import { PieChart, Plus, Search, Loader2, X, CheckCircle2, Clock, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  a_recevoir: { label: 'À recevoir', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> },
  recu:       { label: 'Reçue',      color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={12} /> },
  annule:     { label: 'Annulée',    color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={12} /> },
}

interface Commission {
  id: string; company_id: string; dossier_id: string | null; preteur_id: string | null
  montant: number; statut: string; date_prevue: string | null; date_recue: string | null
  notes: string | null; created_at: string
  dossiers?: { numero: string; clients?: { nom: string } | null } | null
  preteurs?: { nom: string } | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(n)

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filterStatut, setFilterStatut] = useState<string | null>(null)
  const [showModal, setShowModal]     = useState(false)
  const [saving, setSaving]           = useState(false)
  const [form, setForm] = useState({ montant: '', statut: 'a_recevoir', date_prevue: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/commissions')
      const d = await r.json()
      setCommissions(Array.isArray(d) ? d : [])
    } catch { setCommissions([]) }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/commissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (r.ok) {
        setShowModal(false)
        setForm({ montant: '', statut: 'a_recevoir', date_prevue: '', notes: '' })
        await load()
      }
    } finally { setSaving(false) }
  }

  async function markRecu(id: string) {
    await fetch('/api/commissions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, statut: 'recu', date_recue: new Date().toISOString().split('T')[0] }),
    })
    await load()
  }

  const filtered = commissions.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.dossiers?.numero || '').toLowerCase().includes(q) ||
      (c.dossiers?.clients?.nom || '').toLowerCase().includes(q) ||
      (c.preteurs?.nom || '').toLowerCase().includes(q)
    const matchStatut = !filterStatut || c.statut === filterStatut
    return matchSearch && matchStatut
  })

  // Totaux
  const totalRecu      = commissions.filter(c => c.statut === 'recu').reduce((s, c) => s + c.montant, 0)
  const totalARecevoir = commissions.filter(c => c.statut === 'a_recevoir').reduce((s, c) => s + c.montant, 0)
  const totalAnnule    = commissions.filter(c => c.statut === 'annule').reduce((s, c) => s + c.montant, 0)

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '9px 12px', fontSize: '13px',
    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const labelSt: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '10px', color: 'var(--txt-3)' }}>
        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px' }}>Chargement…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 28px 80px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieChart size={20} color="var(--gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Commissions</h1>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0 }}>Suivi des revenus par dossier</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer' }}>
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total reçu', value: totalRecu, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'À recevoir', value: totalARecevoir, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Annulé',     value: totalAnnule, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: kpi.bg, border: `0.5px solid ${kpi.color}30`, borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: kpi.color, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: kpi.color }}>{fmt(kpi.value)}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
          <Search size={13} color="var(--txt-3)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ ...inputStyle, paddingLeft: '32px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setFilterStatut(null)}
            style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '7px', border: '0.5px solid var(--line)', background: !filterStatut ? 'var(--gold)' : 'var(--bg-2)', color: !filterStatut ? '#0A0A0A' : 'var(--txt-2)', cursor: 'pointer', fontWeight: 600 }}>
            Tout
          </button>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => setFilterStatut(k === filterStatut ? null : k)}
              style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '7px', border: `0.5px solid ${filterStatut === k ? v.color : 'var(--line)'}`, background: filterStatut === k ? v.bg : 'var(--bg-2)', color: filterStatut === k ? v.color : 'var(--txt-2)', cursor: 'pointer', fontWeight: 600 }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--txt-3)' }}>
          <PieChart size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ fontSize: '13px' }}>Aucune commission enregistrée.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--line)' }}>
                {['Dossier / Client', 'Prêteur', 'Montant', 'Statut', 'Date prévue', 'Date reçue', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)', textAlign: 'left', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const s = STATUT_CONFIG[c.statut] || STATUT_CONFIG.a_recevoir
                return (
                  <tr key={c.id} style={{ borderBottom: '0.5px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{c.dossiers?.clients?.nom || '—'}</div>
                      <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{c.dossiers?.numero || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--txt-2)' }}>{c.preteurs?.nom || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>{fmt(c.montant)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: '99px' }}>
                        {s.icon} {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--txt-3)' }}>{fmtDate(c.date_prevue)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--txt-3)' }}>{fmtDate(c.date_recue)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.statut === 'a_recevoir' && (
                        <button onClick={() => markRecu(c.id)}
                          style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.12)', border: '0.5px solid #10B98150', color: '#10B981', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          ✓ Marquer reçue
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Nouvelle commission</h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}><X size={18} /></button>
            </div>
            <div>
              <label style={labelSt}>Montant ($) *</label>
              <input required type="number" step="0.01" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} placeholder="1200.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelSt}>Statut</label>
              <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))} style={inputStyle}>
                {Object.entries(STATUT_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Date prévue</label>
              <input type="date" value={form.date_prevue} onChange={e => setForm(p => ({ ...p, date_prevue: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelSt}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Référence, numéro de paiement…" />
            </div>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#0A0A0A', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              {saving ? 'Enregistrement…' : 'Ajouter la commission'}
            </button>
          </form>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
