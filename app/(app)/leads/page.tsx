'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, Plus, MessageCircle, FileText,
  Building2, User, Phone, Mail, Calendar,
  ChevronDown, MoreHorizontal, GripVertical, X, Loader2, ArrowRight,
  Trash2, CheckSquare, Square, Edit3, Search
} from 'lucide-react'

type StatutPipeline =
  | 'nouveau'
  | 'contacté'
  | 'qualifié'
  | 'proposition'
  | 'gagné'
  | 'perdu'

interface Lead {
  id: string
  nom: string
  entreprise?: string
  telephone?: string
  email?: string
  montant_estime?: number
  date_creation: string
  statut: StatutPipeline
  priorite: 'basse' | 'normale' | 'haute'
  tags?: string[]
}

const COLONNES: { id: StatutPipeline; label: string; color: string }[] = [
  { id: 'nouveau',     label: 'Nouveau',      color: 'var(--txt-3)' },
  { id: 'contacté',   label: 'Contacté',      color: 'var(--amber)' },
  { id: 'qualifié',   label: 'Qualifié',      color: 'var(--blue)'  },
  { id: 'proposition',label: 'Proposition',   color: 'var(--purple)' },
  { id: 'gagné',      label: 'Gagné ✓',       color: 'var(--green)' },
  { id: 'perdu',      label: 'Perdu',         color: 'var(--red)'   },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [valeurEstimee, setValeurEstimee] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('id, nom, email, telephone, valeur_estimee, statut, created_at, source')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[loadLeads]', error)
    } else {
      setLeads((data ?? []).map((l: any) => ({
        id: l.id,
        nom: l.nom,
        entreprise: l.source ?? undefined,
        telephone: l.telephone ?? undefined,
        email: l.email ?? undefined,
        montant_estime: l.valeur_estimee ? Number(l.valeur_estimee) : undefined,
        date_creation: l.created_at,
        statut: (l.statut || 'nouveau') as StatutPipeline,
        priorite: 'normale' as const,
      })))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadLeads() }, [loadLeads])

  // ── ÉDITION DIRECTE SUR LA CELLULE ─────────────────────────────
  async function updateInlineField(id: string, field: 'nom' | 'email' | 'telephone' | 'valeur_estimee' | 'statut', value: any) {
    setLeads(prev => prev.map(l => {
      if (l.id !== id) return l
      if (field === 'valeur_estimee') return { ...l, montant_estime: parseFloat(value) || undefined }
      return { ...l, [field]: value }
    }))

    const dbField = field === 'valeur_estimee' ? 'valeur_estimee' : field
    const valToSave = field === 'valeur_estimee' ? (parseFloat(value) || null) : (value || null)
    await supabase.from('leads').update({ [dbField]: valToSave }).eq('id', id)
  }

  function openCreate() {
    setEditingLead(null)
    setNom('')
    setEmail('')
    setTelephone('')
    setValeurEstimee('')
    setShowModal(true)
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setNom(lead.nom)
    setEmail(lead.email || '')
    setTelephone(lead.telephone || '')
    setValeurEstimee(lead.montant_estime ? String(lead.montant_estime) : '')
    setShowModal(true)
  }

  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setSaving(true)

    try {
      if (editingLead) {
        await supabase
          .from('leads')
          .update({
            nom: nom.trim(),
            email: email.trim() || null,
            telephone: telephone.trim() || null,
            valeur_estimee: valeurEstimee ? parseFloat(valeurEstimee) : null,
          })
          .eq('id', editingLead.id)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Non connecté')
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) throw new Error('Entreprise introuvable')

        await supabase
          .from('leads')
          .insert({
            company_id: profile.company_id,
            nom: nom.trim(),
            email: email.trim() || null,
            telephone: telephone.trim() || null,
            valeur_estimee: valeurEstimee ? parseFloat(valeurEstimee) : null,
            statut: 'nouveau',
          })
      }

      setShowModal(false)
      await loadLeads()
    } catch (err) {
      console.error('[handleSaveLead]', err)
      alert('Erreur lors de la sauvegarde du lead')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce lead ?')) return
    await supabase.from('leads').delete().eq('id', id)
    setShowModal(false)
    loadLeads()
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} leads sélectionnés ?`)) return
    await supabase.from('leads').delete().in('id', selectedIds)
    setSelectedIds([])
    loadLeads()
  }

  const filtered = leads.filter(l =>
    l.nom.toLowerCase().includes(search.toLowerCase())
    || (l.email ?? '').toLowerCase().includes(search.toLowerCase())
    || (l.telephone ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1150px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--gold)" /> Leads & CRM
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Pipeline d'opportunités commercial avec édition directe dans la liste
          </div>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', color: '#0A0A0A',
            border: 'none', borderRadius: '8px', padding: '9px 16px',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Nouveau lead
        </button>
      </div>

      {/* Barre d'action groupée si éléments sélectionnés */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'var(--ga)', border: '1px solid var(--gold)',
          borderRadius: '10px', padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} />
            {selectedIds.length} lead(s) sélectionné(s)
          </div>
          <button
            onClick={handleBatchDelete}
            style={{ background: 'var(--red)20', border: '0.5px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={13} /> Supprimer la sélection
          </button>
        </div>
      )}

      {/* Recherche */}
      <div style={{ position: 'relative', maxWidth: '360px' }}>
        <Search size={14} color="var(--txt-3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Rechercher un lead par nom, courriel, téléphone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: '8px', padding: '8px 12px 8px 34px',
            fontSize: '12px', color: 'var(--txt-1)', outline: 'none',
          }}
        />
      </div>

      {/* TABLEAU AVEC ÉDITION EN LIGNE DIRECTE */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 130px 130px 60px', padding: '10px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setSelectedIds(allSelected ? [] : filtered.map(l => l.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: allSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          </div>
          {['NOM / PROSPECT (ÉDITABLE)', 'COURRIEL (ÉDITABLE)', 'TÉLÉPHONE (ÉDITABLE)', 'VALEUR EST. ($ ÉDITABLE)', 'STATUT (ÉDITABLE)', 'ACTIONS'].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em', textAlign: h.includes('VALEUR') ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <TrendingUp size={32} color="var(--txt-3)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>Aucun lead pour l'instant</p>
          </div>
        ) : (
          filtered.map((l, idx) => {
            const isSelected = selectedIds.includes(l.id)
            const stCfg = COLONNES.find(c => c.id === l.statut) || COLONNES[0]

            return (
              <div
                key={l.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 130px 130px 60px',
                  padding: '10px 18px', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
                  alignItems: 'center', background: isSelected ? 'var(--ga)' : 'transparent',
                }}
              >
                {/* Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setSelectedIds(prev => prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id])} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </div>

                {/* 1. NOM EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={l.nom}
                    onBlur={e => e.target.value !== l.nom && updateInlineField(l.id, 'nom', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 2. COURRIEL EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="email"
                    defaultValue={l.email || ''}
                    placeholder="Ajouter email..."
                    onBlur={e => e.target.value !== (l.email || '') && updateInlineField(l.id, 'email', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '11px', color: 'var(--txt-3)', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 3. TÉLÉPHONE EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={l.telephone || ''}
                    placeholder="Téléphone..."
                    onBlur={e => e.target.value !== (l.telephone || '') && updateInlineField(l.id, 'telephone', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '11px', color: 'var(--txt-2)', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 4. VALEUR EN SAISIE DIRECTE */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    step="100"
                    defaultValue={l.montant_estime ?? ''}
                    placeholder="0"
                    onBlur={e => parseFloat(e.target.value) !== (l.montant_estime || 0) && updateInlineField(l.id, 'valeur_estimee', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '90px', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', textAlign: 'right', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 5. STATUT EN DROPDOWN DIRECT */}
                <div>
                  <select
                    value={l.statut}
                    onChange={e => updateInlineField(l.id, 'statut', e.target.value)}
                    style={{
                      appearance: 'none', WebkitAppearance: 'none',
                      background: `${stCfg.color}18`, color: stCfg.color,
                      border: `1px solid ${stCfg.color}40`,
                      borderRadius: '20px', padding: '4px 10px',
                      fontSize: '10px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {COLONNES.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#1F2937', color: '#F3F4F6' }}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  <button
                    onClick={() => openEdit(l)}
                    title="Fiche détaillée"
                    style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 6px', cursor: 'pointer', color: 'var(--txt-2)' }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
                    title="Supprimer"
                    style={{ background: 'var(--red)15', border: '0.5px solid var(--red)30', borderRadius: '6px', padding: '5px 6px', cursor: 'pointer', color: 'var(--red)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL AJOUT / ÉDITION COMPLÈTE */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <form
            onSubmit={handleSaveLead}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)' }}>
                {editingLead ? 'Modifier le lead' : 'Nouveau lead'}
              </div>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                <X size={16} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Nom complet *</label>
              <input
                required
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Ex: Paul Gagné"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Courriel</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="paul@exemple.com"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Téléphone</label>
                <input
                  type="text"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  placeholder="(514) 555-0188"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Valeur estimée ($)</label>
              <input
                type="number"
                step="100"
                value={valeurEstimee}
                onChange={e => setValeurEstimee(e.target.value)}
                placeholder="5000"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {editingLead && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingLead.id)}
                  style={{ background: 'var(--red)15', border: '0.5px solid var(--red)30', color: 'var(--red)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: 'var(--gold)', borderRadius: '8px', padding: '10px',
                  fontSize: '12px', fontWeight: 700, color: '#0A0A0A', border: 'none', cursor: 'pointer',
                }}
              >
                {saving && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {editingLead ? 'Enregistrer les modifications' : 'Ajouter le lead'}
              </button>
            </div>
          </form>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
