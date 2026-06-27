'use client'

import { useState, useEffect } from 'react'
import { Plus, FolderKanban, ChevronRight, Search, Filter, Loader2, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ── Pipeline phases ────────────────────────────────────────────────
const PHASES = [
  {
    id: 'prise_en_charge',
    label: 'Prise en charge',
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.1)',
    etiquettes: ['Nouveau lead', 'Qualification initiale', 'Mandat signé'],
  },
  {
    id: 'montage',
    label: 'Montage du dossier',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    etiquettes: ['Documents demandés', 'Documents reçus', 'Dossier complet'],
  },
  {
    id: 'soumission',
    label: 'Soumission',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    etiquettes: ['En analyse', 'Soumis aux prêteurs', 'Réponses reçues'],
  },
  {
    id: 'approbation',
    label: 'Approbation',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    etiquettes: ['Approbation conditionnelle', 'Conditions remplies', 'Approbation finale'],
  },
  {
    id: 'finalisation',
    label: 'Finalisation',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.1)',
    etiquettes: ['En notariat', 'Acte signé', 'Fonds débloqués', 'Commissionné', 'Fermé'],
  },
]

const TYPE_OPTIONS = [
  { value: 'achat',          label: 'Achat'          },
  { value: 'renouvellement', label: 'Renouvellement' },
  { value: 'refinancement',  label: 'Refinancement'  },
  { value: 'transfert',      label: 'Transfert'      },
]

interface Dossier {
  id: string
  numero: string
  phase: string
  etiquette: string
  type_transaction: string
  montant_pret: number | null
  commission_brute: number | null
  notes: string | null
  created_at: string
  clients?: { nom: string } | null
  preteurs?: { nom: string } | null
}

const fmt = (n: number | null) =>
  n != null ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n) : '—'

export default function DossiersPage() {
  const [dossiers, setDossiers]   = useState<Dossier[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [filterPhase, setFilterPhase] = useState<string | null>(null)

  // New dossier form
  const [form, setForm] = useState({
    client_nom: '', type_transaction: 'achat', montant_pret: '',
    phase: 'prise_en_charge', notes: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/dossiers')
      const data = await r.json()
      setDossiers(Array.isArray(data) ? data : [])
    } catch { setDossiers([]) }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        setShowModal(false)
        setForm({ client_nom: '', type_transaction: 'achat', montant_pret: '', phase: 'prise_en_charge', notes: '' })
        await load()
      }
    } finally { setSaving(false) }
  }

  const filtered = dossiers.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      d.numero.toLowerCase().includes(q) ||
      (d.clients?.nom || '').toLowerCase().includes(q) ||
      (d.etiquette || '').toLowerCase().includes(q)
    const matchPhase = !filterPhase || d.phase === filterPhase
    return matchSearch && matchPhase
  })

  const byPhase = (phaseId: string) => filtered.filter(d => d.phase === phaseId)

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '9px 12px', fontSize: '13px',
    color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '10px', color: 'var(--txt-3)' }}>
        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: '13px' }}>Chargement des dossiers…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── En-tête ── */}
      <div style={{ padding: '20px 28px 0', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-0)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderKanban size={18} color="var(--gold)" />
            </div>
            <div>
              <h1 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Dossiers</h1>
              <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0 }}>Pipeline hypothécaire · {dossiers.length} dossier{dossiers.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer' }}>
            <Plus size={14} /> Nouveau dossier
          </button>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '10px', paddingBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '340px' }}>
            <Search size={13} color="var(--txt-3)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un dossier…"
              style={{ ...inputStyle, paddingLeft: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setFilterPhase(null)}
              style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '7px', border: '0.5px solid var(--line)', background: !filterPhase ? 'var(--gold)' : 'var(--bg-2)', color: !filterPhase ? '#0A0A0A' : 'var(--txt-2)', cursor: 'pointer', fontWeight: 600 }}>
              Tout
            </button>
            {PHASES.map(p => (
              <button key={p.id} onClick={() => setFilterPhase(p.id === filterPhase ? null : p.id)}
                style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '7px', border: `0.5px solid ${filterPhase === p.id ? p.color : 'var(--line)'}`, background: filterPhase === p.id ? p.bg : 'var(--bg-2)', color: filterPhase === p.id ? p.color : 'var(--txt-2)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Kanban ── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: '0', padding: '20px 28px', alignItems: 'flex-start' }}>
        {PHASES.map(phase => {
          const cards = byPhase(phase.id)
          return (
            <div key={phase.id} style={{ minWidth: '260px', maxWidth: '260px', marginRight: '14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
              {/* Entête colonne */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: phase.bg, border: `0.5px solid ${phase.color}30`, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: phase.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: phase.color }}>{phase.label}</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: phase.color, background: `${phase.color}20`, padding: '1px 7px', borderRadius: '99px' }}>
                  {cards.length}
                </span>
              </div>

              {/* Cartes */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cards.length === 0 && (
                  <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--txt-3)', border: '0.5px dashed var(--line)', borderRadius: '8px' }}>
                    Aucun dossier
                  </div>
                )}
                {cards.map(d => (
                  <DossierCard key={d.id} dossier={d} phase={phase} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Modal nouveau dossier ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Nouveau dossier</h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Nom de l'emprunteur *</label>
              <input required value={form.client_nom} onChange={e => setForm(p => ({ ...p, client_nom: e.target.value }))}
                placeholder="Marie Tremblay" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Type de transaction</label>
                <select value={form.type_transaction} onChange={e => setForm(p => ({ ...p, type_transaction: e.target.value }))} style={{ ...inputStyle }}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Phase initiale</label>
                <select value={form.phase} onChange={e => setForm(p => ({ ...p, phase: e.target.value }))} style={{ ...inputStyle }}>
                  {PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Montant du prêt ($)</label>
              <input type="number" value={form.montant_pret} onChange={e => setForm(p => ({ ...p, montant_pret: e.target.value }))}
                placeholder="350000" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Informations supplémentaires…" rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>

            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#0A0A0A', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.8 : 1 }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              {saving ? 'Création…' : 'Créer le dossier'}
            </button>
          </form>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function DossierCard({ dossier: d, phase }: { dossier: Dossier; phase: typeof PHASES[0] }) {
  const typeBadge: Record<string, string> = {
    achat: 'Achat', renouvellement: 'Renouvellement', refinancement: 'Refinancement', transfert: 'Transfert',
  }

  return (
    <div style={{
      background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '9px',
      padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = phase.color + '60')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>
            {d.clients?.nom || 'Emprunteur inconnu'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{d.numero}</div>
        </div>
        <ChevronRight size={12} color="var(--txt-3)" />
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: phase.bg, color: phase.color, fontWeight: 600 }}>
          {d.etiquette?.replace(/_/g, ' ') || phase.etiquettes[0]}
        </span>
        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: 'var(--bg-2)', color: 'var(--txt-3)', border: '0.5px solid var(--line)' }}>
          {typeBadge[d.type_transaction] || d.type_transaction}
        </span>
      </div>

      {d.montant_pret && (
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>
          {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(d.montant_pret)}
        </div>
      )}

      {d.preteurs?.nom && (
        <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '4px' }}>
          🏦 {d.preteurs.nom}
        </div>
      )}
    </div>
  )
}
