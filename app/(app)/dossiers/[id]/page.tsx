'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, FolderKanban, FileText, PieChart,
  Plus, CheckCircle2, AlertCircle,
} from 'lucide-react'
import {
  PHASES,
  ETIQUETTES_PAR_PHASE,
  TYPE_TRANSACTION,
  DOCUMENT_TYPES,
  COMMISSION_STATUTS,
  phaseLabel,
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

interface PreteurOption {
  id: string
  nom: string
  actif?: boolean
}

interface DossierDoc {
  id: string
  type: string
  titre: string
  recu: boolean
  file_url: string | null
  notes: string | null
  created_at: string
}

interface CommissionRow {
  id: string
  montant: number
  statut: string
  date_prevue: string | null
  date_recue: string | null
  notes: string | null
}

interface DossierDetail {
  id: string
  numero: string
  phase: string
  etiquette: string
  type_transaction: string
  montant_pret: number | null
  taux: number | null
  taux_commission: number | null
  commission_brute: number | null
  preteur_id: string | null
  date_soumission: string | null
  date_approbation: string | null
  date_notariat: string | null
  date_cloture: string | null
  notes: string | null
  clients?: { nom?: string } | { nom?: string }[] | null
  preteurs?: { nom?: string } | { nom?: string }[] | null
  commissions?: CommissionRow[] | null
}

function relNom(rel: { nom?: string } | { nom?: string }[] | null | undefined): string {
  if (!rel) return ''
  if (Array.isArray(rel)) return rel[0]?.nom ?? ''
  return rel.nom ?? ''
}

function asDateInput(v: string | null | undefined): string {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function numStr(v: number | null | undefined): string {
  if (v == null) return ''
  return String(v)
}

const fmt = (n: number | null | undefined) =>
  n != null
    ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(Number(n))
    : '—'

const fmtMoney = (n: number | null | undefined) =>
  n != null
    ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(n))
    : '—'

const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function DossierFichePage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [dossier, setDossier] = useState<DossierDetail | null>(null)
  const [preteurs, setPreteurs] = useState<PreteurOption[]>([])
  const [docs, setDocs] = useState<DossierDoc[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [canCreateCommission, setCanCreateCommission] = useState(true)
  const [creatingCommission, setCreatingCommission] = useState(false)
  const [addingDoc, setAddingDoc] = useState(false)
  const [docForm, setDocForm] = useState({ type: 't4', titre: '' })

  const [form, setForm] = useState({
    phase: 'prise_en_charge',
    etiquette: 'nouveau_lead',
    type_transaction: 'achat',
    montant_pret: '',
    taux: '',
    taux_commission: '',
    commission_brute: '',
    preteur_id: '',
    date_soumission: '',
    date_approbation: '',
    date_notariat: '',
    date_cloture: '',
    notes: '',
  })

  const syncForm = useCallback((d: DossierDetail) => {
    setForm({
      phase: d.phase || 'prise_en_charge',
      etiquette: d.etiquette || 'nouveau_lead',
      type_transaction: d.type_transaction || 'achat',
      montant_pret: numStr(d.montant_pret),
      taux: numStr(d.taux),
      taux_commission: numStr(d.taux_commission),
      commission_brute: numStr(d.commission_brute),
      preteur_id: d.preteur_id || '',
      date_soumission: asDateInput(d.date_soumission),
      date_approbation: asDateInput(d.date_approbation),
      date_notariat: asDateInput(d.date_notariat),
      date_cloture: asDateInput(d.date_cloture),
      notes: d.notes || '',
    })
  }, [])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    try {
      const [dRes, pRes, docRes, meRes] = await Promise.all([
        fetch(`/api/dossiers/${id}`),
        fetch('/api/preteurs'),
        fetch(`/api/dossiers/${id}/documents`),
        fetch('/api/me'),
      ])
      if (dRes.status === 404) {
        setNotFound(true)
        setDossier(null)
        return
      }
      const data = await dRes.json()
      if (!dRes.ok) {
        setError(data.error || 'Impossible de charger le dossier.')
        if (dRes.status === 404) setNotFound(true)
        return
      }
      setDossier(data)
      syncForm(data)
      const pData = await pRes.json()
      setPreteurs(Array.isArray(pData) ? pData : [])
      const docData = await docRes.json()
      setDocs(Array.isArray(docData) ? docData : [])
      const me = await meRes.json().catch(() => ({}))
      if (me.role && me.role !== 'owner' && me.role !== 'admin') {
        setCanCreateCommission(false)
      }
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }, [id, syncForm])

  useEffect(() => { load() }, [load])

  async function patch(fields: Record<string, unknown>) {
    if (!id) return
    setSaving(true)
    setError('')
    try {
      const r = await fetch(`/api/dossiers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(data.error || 'Erreur lors de l’enregistrement')
        return
      }
      setDossier(prev => prev ? {
        ...prev,
        ...data,
        clients: prev.clients,
        preteurs: prev.preteurs,
        commissions: prev.commissions,
      } : data)
      syncForm(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  function onPhaseChange(phase: string) {
    const phaseId = phase as PhaseId
    const etiquette = ETIQUETTES_PAR_PHASE[phaseId]?.[0]?.id ?? 'nouveau_lead'
    setForm(f => ({ ...f, phase, etiquette }))
    patch({ phase, etiquette })
  }

  async function toggleDocRecu(doc: DossierDoc) {
    const next = !doc.recu
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, recu: next } : d))
    const r = await fetch(`/api/dossiers/${id}/documents`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, recu: next }),
    })
    if (!r.ok) {
      setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, recu: doc.recu } : d))
    }
  }

  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!docForm.titre.trim()) return
    setAddingDoc(true)
    setError('')
    try {
      const r = await fetch(`/api/dossiers/${id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: docForm.type, titre: docForm.titre.trim() }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(data.error || 'Impossible d’ajouter le document.')
        return
      }
      setDocForm({ type: 't4', titre: '' })
      setDocs(prev => [data, ...prev])
    } finally {
      setAddingDoc(false)
    }
  }

  async function handleCreateCommission() {
    if (!id || !dossier) return
    const montant = dossier.commission_brute
    if (montant == null) {
      setError('Saisissez d’abord le montant et le taux de commission.')
      return
    }
    setCreatingCommission(true)
    setError('')
    try {
      const r = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dossier_id: id,
          montant,
          preteur_id: dossier.preteur_id || undefined,
        }),
      })
      if (r.status === 403) {
        setCanCreateCommission(false)
        return
      }
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(data.error || 'Impossible de créer la commission.')
        return
      }
      setDossier(prev => prev ? {
        ...prev,
        commissions: [data, ...(prev.commissions ?? [])],
      } : prev)
    } finally {
      setCreatingCommission(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '9px 12px',
    fontSize: '13px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit',
  }
  const labelSt: React.CSSProperties = {
    fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)',
    display: 'block', marginBottom: '5px', letterSpacing: '0.04em',
  }
  const card: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderRadius: '10px', padding: '16px 18px',
  }

  const etiquettes = ETIQUETTES_PAR_PHASE[(form.phase as PhaseId)] ?? ETIQUETTES_PAR_PHASE.prise_en_charge
  const pal = PHASE_PALETTE[form.phase] ?? PHASE_PALETTE.prise_en_charge
  const commissions = Array.isArray(dossier?.commissions) ? dossier.commissions : []
  const emprunteur = relNom(dossier?.clients) || 'Emprunteur inconnu'
  const preteurNom = preteurs.find(p => p.id === (form.preteur_id || dossier?.preteur_id))?.nom || relNom(dossier?.preteurs)

  if (loading && !dossier) {
    return (
      <div style={{ padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--txt-3)' }}>
        <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
        Chargement du dossier…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (notFound || !dossier) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--txt-3)' }}>
        <FolderKanban size={28} color="var(--txt-3)" strokeWidth={1.4} style={{ marginBottom: '12px' }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>Dossier introuvable</div>
        <p style={{ fontSize: '12px', margin: '0 0 16px' }}>{error || 'Ce dossier n’existe pas ou vous n’y avez pas accès.'}</p>
        <Link href="/dossiers" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none' }}>← Retour aux dossiers</Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1000px' }}>

      <Link href="/dossiers" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
        <ArrowLeft size={13} /> Dossiers
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>{dossier.numero}</h1>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: pal.bg, color: pal.color }}>
              {phaseLabel(dossier.phase)}
            </span>
            {saving && <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Enregistrement…</span>}
            {saved && !saving && (
              <span style={{ fontSize: '11px', color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Enregistré
              </span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>{emprunteur}</div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '4px' }}>
            {etiquetteLabel(dossier.etiquette)}
            {preteurNom ? ` · ${preteurNom}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em' }}>MONTANT DU PRÊT</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{fmt(dossier.montant_pret)}</div>
        </div>
      </div>

      {error && (
        <div style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--red)12', border: '0.5px solid var(--red)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Commission brute', val: fmtMoney(dossier.commission_brute), color: 'var(--gold)' },
          { label: 'Taux', val: dossier.taux != null ? `${dossier.taux} %` : '—', color: 'var(--blue)' },
          { label: 'Type', val: TYPE_TRANSACTION.find(t => t.id === dossier.type_transaction)?.label ?? '—', color: 'var(--txt-1)' },
          { label: 'Prêteur', val: preteurNom || '—', color: 'var(--txt-1)' },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '8px' }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '16px' }}>Détails du dossier</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelSt}>PHASE</label>
            <select value={form.phase} onChange={e => onPhaseChange(e.target.value)} style={inputStyle}>
              {PHASES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>ÉTIQUETTE</label>
            <select
              value={form.etiquette}
              onChange={e => { const etiquette = e.target.value; setForm(f => ({ ...f, etiquette })); patch({ etiquette }) }}
              style={inputStyle}
            >
              {etiquettes.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>TYPE DE TRANSACTION</label>
            <select
              value={form.type_transaction}
              onChange={e => { const type_transaction = e.target.value; setForm(f => ({ ...f, type_transaction })); patch({ type_transaction }) }}
              style={inputStyle}
            >
              {TYPE_TRANSACTION.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>PRÊTEUR</label>
            <select
              value={form.preteur_id}
              onChange={e => { const preteur_id = e.target.value; setForm(f => ({ ...f, preteur_id })); patch({ preteur_id: preteur_id || null }) }}
              style={inputStyle}
            >
              <option value="">Aucun prêteur</option>
              {preteurs.map(p => <option key={p.id} value={p.id}>{p.nom}{p.actif === false ? ' (inactif)' : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>MONTANT DU PRÊT ($)</label>
            <input
              type="number"
              value={form.montant_pret}
              onChange={e => setForm(f => ({ ...f, montant_pret: e.target.value }))}
              onBlur={() => { if (form.montant_pret !== numStr(dossier.montant_pret)) patch({ montant_pret: form.montant_pret }) }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>TAUX HYPOTHÉCAIRE (%)</label>
            <input
              type="number"
              step="0.001"
              value={form.taux}
              onChange={e => setForm(f => ({ ...f, taux: e.target.value }))}
              onBlur={() => { if (form.taux !== numStr(dossier.taux)) patch({ taux: form.taux }) }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>TAUX DE COMMISSION</label>
            <input
              type="number"
              step="0.0001"
              value={form.taux_commission}
              onChange={e => setForm(f => ({ ...f, taux_commission: e.target.value }))}
              onBlur={() => { if (form.taux_commission !== numStr(dossier.taux_commission)) patch({ taux_commission: form.taux_commission }) }}
              placeholder="0.008"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>COMMISSION BRUTE ($)</label>
            <input
              type="number"
              value={form.commission_brute}
              readOnly
              title="Calculée automatiquement à partir du montant et du taux de commission"
              style={{ ...inputStyle, opacity: 0.85, cursor: 'default' }}
            />
          </div>
          <div>
            <label style={labelSt}>DATE DE SOUMISSION</label>
            <input
              type="date"
              value={form.date_soumission}
              onChange={e => setForm(f => ({ ...f, date_soumission: e.target.value }))}
              onBlur={() => { if (form.date_soumission !== asDateInput(dossier.date_soumission)) patch({ date_soumission: form.date_soumission || null }) }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>DATE D&apos;APPROBATION</label>
            <input
              type="date"
              value={form.date_approbation}
              onChange={e => setForm(f => ({ ...f, date_approbation: e.target.value }))}
              onBlur={() => { if (form.date_approbation !== asDateInput(dossier.date_approbation)) patch({ date_approbation: form.date_approbation || null }) }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>DATE DE NOTARIAT</label>
            <input
              type="date"
              value={form.date_notariat}
              onChange={e => setForm(f => ({ ...f, date_notariat: e.target.value }))}
              onBlur={() => { if (form.date_notariat !== asDateInput(dossier.date_notariat)) patch({ date_notariat: form.date_notariat || null }) }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelSt}>DATE DE CLÔTURE</label>
            <input
              type="date"
              value={form.date_cloture}
              onChange={e => setForm(f => ({ ...f, date_cloture: e.target.value }))}
              onBlur={() => { if (form.date_cloture !== asDateInput(dossier.date_cloture)) patch({ date_cloture: form.date_cloture || null }) }}
              style={inputStyle}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelSt}>NOTES</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              onBlur={() => { if (form.notes !== (dossier.notes || '')) patch({ notes: form.notes }) }}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Conditions, adresse de la propriété, suivi interne…"
            />
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <FileText size={16} color="var(--gold)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Documents</span>
        </div>

        <form onSubmit={handleAddDoc} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: '10px', alignItems: 'end', marginBottom: '16px' }}>
          <div>
            <label style={labelSt}>TYPE</label>
            <select value={docForm.type} onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
              {DOCUMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelSt}>TITRE</label>
            <input
              value={docForm.titre}
              onChange={e => setDocForm(p => ({ ...p, titre: e.target.value }))}
              placeholder="Avis de cotisation 2025"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={addingDoc || !docForm.titre.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '0.5px solid var(--gold)', borderRadius: '8px', padding: '9px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--gold)', cursor: 'pointer', height: '38px', fontFamily: 'inherit' }}
          >
            <Plus size={13} /> {addingDoc ? '…' : 'Ajouter'}
          </button>
        </form>

        {docs.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0, textAlign: 'center', padding: '20px 0' }}>
            Aucun document. Ajoutez les pièces du dossier (T4, relevés, mandat…).
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {docs.map(doc => {
              const typeLabel = DOCUMENT_TYPES.find(t => t.id === doc.type)?.label ?? doc.type
              return (
                <label
                  key={doc.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', background: doc.recu ? 'var(--ga)' : 'var(--bg-2)',
                    border: `0.5px solid ${doc.recu ? 'var(--gold-3)' : 'var(--line)'}`,
                    borderRadius: '8px', cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!doc.recu}
                    onChange={() => toggleDocRecu(doc)}
                    style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{doc.titre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{typeLabel} · {fmtDate(doc.created_at)}</div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: doc.recu ? 'var(--green)' : 'var(--txt-3)' }}>
                    {doc.recu ? 'Reçu' : 'En attente'}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={16} color="var(--gold)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Commissions</span>
          </div>
          {canCreateCommission && (
            <button
              onClick={handleCreateCommission}
              disabled={creatingCommission}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: creatingCommission ? 'default' : 'pointer' }}
            >
              {creatingCommission ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={13} />}
              Créer une commission
            </button>
          )}
        </div>

        {commissions.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0, textAlign: 'center', padding: '20px 0' }}>
            Aucune commission liée à ce dossier.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {commissions.map((c, i) => {
              const st = COMMISSION_STATUTS.find(s => s.id === c.statut)
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: i < commissions.length - 1 ? '0.5px solid var(--line)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>{fmtMoney(c.montant)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
                      Prévue {fmtDate(c.date_prevue)} {c.date_recue ? `· reçue ${fmtDate(c.date_recue)}` : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '99px', background: 'var(--bg-2)', color: 'var(--txt-2)', border: '0.5px solid var(--line)' }}>
                    {st?.label ?? c.statut}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
