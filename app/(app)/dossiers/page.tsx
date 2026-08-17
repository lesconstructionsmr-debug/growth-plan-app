'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FolderKanban, ChevronRight, Search, Loader2, X } from 'lucide-react'
import {
  PHASES,
  ETIQUETTES_PAR_PHASE,
  TYPE_TRANSACTION,
  etiquetteLabel,
  type PhaseId,
} from '@/lib/agence/constants'

export const dynamic = 'force-dynamic'

const PHASE_PALETTE: Record<string, { color: string; bg: string }> = {
  prise_en_charge: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  montage:         { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  soumission:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  approbation:     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  finalisation:    { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

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
  clients?: { nom: string } | { nom: string }[] | null
  preteurs?: { nom: string } | { nom: string }[] | null
}

interface PreteurOption {
  id: string
  nom: string
  actif?: boolean
}

function relNom(rel: { nom?: string } | { nom?: string }[] | null | undefined): string {
  if (!rel) return ''
  if (Array.isArray(rel)) return rel[0]?.nom ?? ''
  return rel.nom ?? ''
}

const fmt = (n: number | null) =>
  n != null ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n) : '—'

export default function DossiersPage() {
  const [dossiers, setDossiers]   = useState<Dossier[]>([])
  const [preteurs, setPreteurs]   = useState<PreteurOption[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')
  const [filterPhase, setFilterPhase] = useState<string | null>(null)

  const [form, setForm] = useState({
    client_nom: '', type_transaction: 'achat', montant_pret: '',
    preteur_id: '', notes: '',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [dRes, pRes] = await Promise.all([
        fetch('/api/dossiers'),
        fetch('/api/preteurs'),
      ])
      const dData = await dRes.json()
      const pData = await pRes.json()
      setDossiers(Array.isArray(dData) ? dData : [])
      setPreteurs(Array.isArray(pData) ? pData : [])
    } catch {
      setDossiers([])
      setPreteurs([])
    }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const r = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_nom: form.client_nom,
          type_transaction: form.type_transaction,
          montant_pret: form.montant_pret,
          preteur_id: form.preteur_id || null,
          notes: form.notes,
        }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setFormError(data.error || data.email_error || 'Impossible de créer le dossier.')
        return
      }
      setShowModal(false)
      setForm({ client_nom: '', type_transaction: 'achat', montant_pret: '', preteur_id: '', notes: '' })
      await load()
    } catch {
      setFormError('Erreur réseau. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  async function changePhase(dossierId: string, phase: string) {
    const phaseId = phase as PhaseId
    const etiquette = ETIQUETTES_PAR_PHASE[phaseId]?.[0]?.id ?? 'nouveau_lead'
    setDossiers(prev => prev.map(d => d.id === dossierId ? { ...d, phase, etiquette } : d))
    const r = await fetch(`/api/dossiers/${dossierId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase, etiquette }),
    })
    if (!r.ok) await load()
  }

  const filtered = dossiers.filter(d => {
    const q = search.toLowerCase()
    const nom = relNom(d.clients)
    const matchSearch = !q ||
      d.numero.toLowerCase().includes(q) ||
      nom.toLowerCase().includes(q) ||
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
            onClick={() => { setFormError(''); setShowModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer' }}>
            <Plus size={14} /> Nouveau dossier
          </button>
        </div>

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
            {PHASES.map(p => {
              const pal = PHASE_PALETTE[p.id]
              return (
                <button key={p.id} onClick={() => setFilterPhase(p.id === filterPhase ? null : p.id)}
                  style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '7px', border: `0.5px solid ${filterPhase === p.id ? pal.color : 'var(--line)'}`, background: filterPhase === p.id ? pal.bg : 'var(--bg-2)', color: filterPhase === p.id ? pal.color : 'var(--txt-2)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {dossiers.length === 0 && (
        <div style={{ margin: '16px 28px 0', padding: '14px 16px', background: 'var(--bg-1)', border: '0.5px dashed var(--line)', borderRadius: '10px', textAlign: 'center', fontSize: '13px', color: 'var(--txt-3)' }}>
          Aucun dossier pour le moment. Créez votre premier dossier hypothécaire.
        </div>
      )}

      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: '0', padding: '20px 28px', alignItems: 'flex-start' }}>
        {PHASES.map(phase => {
          const pal = PHASE_PALETTE[phase.id]
          const cards = byPhase(phase.id)
          return (
            <div key={phase.id} style={{ minWidth: '260px', maxWidth: '260px', marginRight: '14px', display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: pal.bg, border: `0.5px solid ${pal.color}30`, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pal.color }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: pal.color }}>{phase.label}</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, color: pal.color, background: `${pal.color}20`, padding: '1px 7px', borderRadius: '99px' }}>
                  {cards.length}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cards.length === 0 && (
                  <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: '11px', color: 'var(--txt-3)', border: '0.5px dashed var(--line)', borderRadius: '8px' }}>
                    Aucun dossier dans cette phase
                  </div>
                )}
                {cards.map(d => (
                  <DossierCard key={d.id} dossier={d} phaseId={phase.id} onPhaseChange={changePhase} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

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

            {formError && (
              <div style={{ fontSize: '11px', color: 'var(--red)', background: 'var(--red)12', border: '0.5px solid var(--red)', borderRadius: '7px', padding: '8px 12px', lineHeight: 1.5 }}>
                {formError}
              </div>
            )}

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Nom de l&apos;emprunteur *</label>
              <input required value={form.client_nom} onChange={e => setForm(p => ({ ...p, client_nom: e.target.value }))}
                placeholder="Marie Tremblay" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Type de transaction</label>
                <select value={form.type_transaction} onChange={e => setForm(p => ({ ...p, type_transaction: e.target.value }))} style={inputStyle}>
                  {TYPE_TRANSACTION.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Montant du prêt ($)</label>
                <input type="number" value={form.montant_pret} onChange={e => setForm(p => ({ ...p, montant_pret: e.target.value }))}
                  placeholder="350000" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>Prêteur (optionnel)</label>
              <select value={form.preteur_id} onChange={e => setForm(p => ({ ...p, preteur_id: e.target.value }))} style={inputStyle}>
                <option value="">Aucun prêteur</option>
                {preteurs.filter(p => p.actif !== false).map(p => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
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

function DossierCard({ dossier: d, phaseId, onPhaseChange }: {
  dossier: Dossier
  phaseId: string
  onPhaseChange: (id: string, phase: string) => void
}) {
  const pal = PHASE_PALETTE[phaseId] ?? PHASE_PALETTE.prise_en_charge
  const typeLabel = TYPE_TRANSACTION.find(t => t.id === d.type_transaction)?.label ?? d.type_transaction
  const nom = relNom(d.clients) || 'Emprunteur inconnu'
  const preteurNom = relNom(d.preteurs)

  return (
    <div style={{
      background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '9px',
      padding: '12px 14px', transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = pal.color + '60')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}>
      <Link href={`/dossiers/${d.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>
              {nom}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{d.numero}</div>
          </div>
          <ChevronRight size={12} color="var(--txt-3)" />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: pal.bg, color: pal.color, fontWeight: 600 }}>
            {etiquetteLabel(d.etiquette) || 'Nouveau lead'}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: 'var(--bg-2)', color: 'var(--txt-3)', border: '0.5px solid var(--line)' }}>
            {typeLabel}
          </span>
        </div>

        {d.montant_pret != null && (
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>
            {fmt(d.montant_pret)}
          </div>
        )}

        {preteurNom && (
          <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '4px' }}>
            {preteurNom}
          </div>
        )}
      </Link>

      <select
        value={d.phase}
        onChange={e => onPhaseChange(d.id, e.target.value)}
        onClick={e => e.stopPropagation()}
        title="Changer de phase"
        style={{
          marginTop: '8px', width: '100%', fontSize: '10px', fontWeight: 600,
          background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px',
          padding: '5px 8px', color: 'var(--txt-2)', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>
    </div>
  )
}
