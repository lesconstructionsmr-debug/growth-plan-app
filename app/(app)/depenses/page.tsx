'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Receipt, Plus, Search, Loader2, X, Wallet } from 'lucide-react'

const CATEGORIES = ['Matériaux', 'Équipement', 'Sous-traitant', 'Transport', 'Hébergement', 'Autre']

const CAT_STYLE: Record<string, { color: string; bg: string }> = {
  'Matériaux':    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  'Équipement':   { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
  'Sous-traitant':{ color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
  'Transport':    { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  'Hébergement':  { color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  'Autre':        { color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
}

interface Depense {
  id: string
  description: string
  montant: number
  categorie: string | null
  date_depense: string
  job_id: string | null
  jobs?: { titre: string } | null
}

interface Job { id: string; titre: string }

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [jobs, setJobs]         = useState<Job[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm] = useState({
    description: '', montant: '', categorie: 'Matériaux',
    date_depense: new Date().toISOString().split('T')[0], job_id: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: dep }, { data: jobsData }] = await Promise.all([
      supabase
        .from('depenses')
        .select('id, description, montant, categorie, date_depense, job_id, jobs(titre)')
        .order('date_depense', { ascending: false }),
      supabase.from('jobs').select('id, titre').order('titre'),
    ])
    setDepenses(dep || [])
    setJobs(jobsData || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
    if (!profile?.company_id) { setSaving(false); return }

    await supabase.from('depenses').insert({
      company_id:   profile.company_id,
      description:  form.description,
      montant:      parseFloat(form.montant),
      categorie:    form.categorie,
      date_depense: form.date_depense,
      job_id:       form.job_id || null,
    })
    setShowModal(false)
    setForm({ description: '', montant: '', categorie: 'Matériaux', date_depense: new Date().toISOString().split('T')[0], job_id: '' })
    setSaving(false)
    await load()
  }

  const { start, end } = getMonthRange()
  const ceMois    = depenses.filter(d => d.date_depense >= start && d.date_depense <= end)
  const totalMois = ceMois.reduce((s, d) => s + d.montant, 0)
  const totalAll  = depenses.reduce((s, d) => s + d.montant, 0)

  const catTotals = CATEGORIES.map(c => ({
    cat: c,
    total: depenses.filter(d => d.categorie === c).reduce((s, d) => s + d.montant, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const filtered = depenses.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.description.toLowerCase().includes(q) ||
      (d.jobs?.titre || '').toLowerCase().includes(q) ||
      (d.categorie || '').toLowerCase().includes(q)
    const matchCat = !catFilter || d.categorie === catFilter
    return matchSearch && matchCat
  })

  const inputSt: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '9px 12px', fontSize: '13px',
    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelSt: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '10px', color: 'var(--txt-3)' }}>
      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '13px' }}>Chargement…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wallet size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Dépenses</h1>
          <span style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '20px', padding: '2px 8px', fontSize: '11px', color: 'var(--txt-3)' }}>
            {filtered.length}
          </span>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, color: '#0A0A0A', cursor: 'pointer' }}>
          <Plus size={14} /> Nouvelle dépense
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Ce mois-ci',    value: fmt(totalMois), color: 'var(--red)' },
          { label: 'Total cumulé',  value: fmt(totalAll),  color: 'var(--txt-1)' },
          { label: 'Nb dépenses',   value: `${depenses.length}`, color: 'var(--txt-1)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Répartition par catégorie */}
      {catTotals.length > 0 && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Répartition par catégorie</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {catTotals.map(({ cat, total }) => {
              const st = CAT_STYLE[cat] || CAT_STYLE['Autre']
              return (
                <button key={cat} onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', border: `0.5px solid ${catFilter === cat ? st.color : 'var(--line)'}`, background: catFilter === cat ? st.bg : 'var(--bg-2)', cursor: 'pointer' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: st.color }}>{cat}</span>
                  <span style={{ fontSize: '10px', color: catFilter === cat ? st.color : 'var(--txt-3)' }}>{fmt(total)}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Recherche */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)' }} />
        <input type="text" placeholder="Rechercher une dépense..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px 8px 32px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 120px', padding: '10px 16px', borderBottom: '0.5px solid var(--line)' }}>
          {['DESCRIPTION / PROJET', 'CATÉGORIE', 'DATE', 'MONTANT'].map(h => (
            <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Receipt size={32} color="var(--txt-3)" strokeWidth={1} style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '13px', color: 'var(--txt-3)', marginBottom: '8px' }}>
              {depenses.length === 0 ? 'Aucune dépense pour l\'instant' : 'Aucun résultat'}
            </div>
            {depenses.length === 0 && (
              <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>
                + Enregistrer la première dépense
              </button>
            )}
          </div>
        ) : filtered.map((d, i) => {
          const st = CAT_STYLE[d.categorie || 'Autre'] || CAT_STYLE['Autre']
          return (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 120px', padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '0.5px solid var(--line)' : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{d.description}</div>
                {d.jobs?.titre && <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>🔨 {d.jobs.titre}</div>}
              </div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: st.color, background: st.bg, padding: '2px 8px', borderRadius: '20px' }}>
                  {d.categorie || 'Autre'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{fmtDate(d.date_depense)}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--red)' }}>{fmt(d.montant)}</div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Nouvelle dépense</h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}><X size={18} /></button>
            </div>
            <div>
              <label style={labelSt}>Description *</label>
              <input required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Armoires cuisine Tremblay" style={inputSt} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Montant ($) *</label>
                <input required type="number" step="0.01" min="0" value={form.montant}
                  onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} placeholder="0.00" style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Date</label>
                <input type="date" value={form.date_depense}
                  onChange={e => setForm(p => ({ ...p, date_depense: e.target.value }))} style={inputSt} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} style={inputSt}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Chantier (optionnel)</label>
                <select value={form.job_id} onChange={e => setForm(p => ({ ...p, job_id: e.target.value }))} style={inputSt}>
                  <option value="">— Aucun —</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.titre}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#0A0A0A', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              {saving ? 'Enregistrement…' : 'Ajouter la dépense'}
            </button>
          </form>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
