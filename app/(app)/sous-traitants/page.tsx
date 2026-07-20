'use client'

import { useState, useEffect } from 'react'
import {
  Users, Plus, Search, Phone, Mail, ShieldCheck,
  Building2, Trash2, Edit3, X, Loader2, CheckCircle2,
  HardHat, FileText, Filter, CheckSquare, Square
} from 'lucide-react'

interface SousTraitant {
  id: string
  nom: string
  entreprise: string | null
  telephone: string | null
  email: string | null
  rbq_no: string | null
  tps_no: string | null
  tvq_no: string | null
  specialite: string
  statut: 'actif' | 'inactif'
  notes: string | null
  created_at: string
}

const SPECIALITES = [
  'tous',
  'général',
  'électricité',
  'plomberie',
  'peinture',
  'menuiserie',
  'maçonnerie',
  'ventilation',
]

const SPECIALITES_OPTIONS = [
  'général',
  'électricité',
  'plomberie',
  'peinture',
  'menuiserie',
  'maçonnerie',
  'ventilation',
]

export default function SousTraitantsPage() {
  const [items, setItems] = useState<SousTraitant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('tous')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<SousTraitant | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    nom: '',
    entreprise: '',
    telephone: '',
    email: '',
    rbq_no: '',
    tps_no: '',
    tvq_no: '',
    specialite: 'général',
    notes: '',
  })

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch('/api/sous-traitants')
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch {
      /* fallback */
    } finally {
      setLoading(false)
    }
  }

  // ── MODIFICATION EN LIGNE DIRECTE DANS LE TABLEAU ─────────────────────
  async function updateInlineField(id: string, field: string, value: any) {
    setItems(prev => prev.map(st => st.id === id ? { ...st, [field]: value || null } : st))

    try {
      const target = items.find(st => st.id === id)
      if (!target) return
      const updatedObj = { ...target, [field]: value || null }

      await fetch(`/api/sous-traitants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedObj),
      })
    } catch (e) {
      console.error('[updateInlineField]', e)
    }
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} sous-traitants sélectionnés ?`)) return
    for (const id of selectedIds) {
      await fetch(`/api/sous-traitants/${id}`, { method: 'DELETE' })
    }
    setSelectedIds([])
    fetchItems()
  }

  function openCreate() {
    setEditingItem(null)
    setForm({
      nom: '',
      entreprise: '',
      telephone: '',
      email: '',
      rbq_no: '',
      tps_no: '',
      tvq_no: '',
      specialite: 'général',
      notes: '',
    })
    setShowModal(true)
  }

  function openEdit(st: SousTraitant) {
    setEditingItem(st)
    setForm({
      nom: st.nom,
      entreprise: st.entreprise || '',
      telephone: st.telephone || '',
      email: st.email || '',
      rbq_no: st.rbq_no || '',
      tps_no: st.tps_no || '',
      tvq_no: st.tvq_no || '',
      specialite: st.specialite || 'général',
      notes: st.notes || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) return
    setSubmitting(true)
    try {
      const url = editingItem ? `/api/sous-traitants/${editingItem.id}` : '/api/sous-traitants'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowModal(false)
        fetchItems()
      } else {
        const err = await res.json()
        alert(err.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce sous-traitant ?')) return
    try {
      const res = await fetch(`/api/sous-traitants/${id}`, { method: 'DELETE' })
      if (res.ok) fetchItems()
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const filtered = items.filter(item => {
    const matchSpec = specFilter === 'tous' || item.specialite === specFilter
    const matchSearch =
      item.nom.toLowerCase().includes(search.toLowerCase()) ||
      (item.entreprise && item.entreprise.toLowerCase().includes(search.toLowerCase())) ||
      (item.rbq_no && item.rbq_no.includes(search))
    return matchSpec && matchSearch
  })

  const countActifs = items.filter(i => i.statut === 'actif').length
  const countRBQ = items.filter(i => !!i.rbq_no).length
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardHat size={22} color="var(--gold)" />
            Gestion des Sous-Traitants
          </div>
          <div style={{ fontSize: '13px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Suivi des partenaires, spécialités, licences RBQ et modification directe dans le tableau
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
          <Plus size={16} /> Nouveau sous-traitant
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Partenaires</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--txt-1)', marginTop: '4px' }}>{items.length}</div>
        </div>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut Actif</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--green)', marginTop: '4px' }}>{countActifs}</div>
        </div>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Licences RBQ Déclarées</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gold-2)', marginTop: '4px' }}>{countRBQ}</div>
        </div>
      </div>

      {/* Action en masse si sélection */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'var(--ga)', border: '1px solid var(--gold)',
          borderRadius: '10px', padding: '12px 18px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} />
            {selectedIds.length} sous-traitant(s) sélectionné(s)
          </div>
          <button
            onClick={handleBatchDelete}
            style={{ background: 'var(--red)20', border: '0.5px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={13} /> Supprimer la sélection
          </button>
        </div>
      )}

      {/* Barre de recherche et Filtres par spécialité */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={14} color="var(--txt-3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, entreprise, licence RBQ…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '8px', padding: '8px 12px 8px 34px',
              fontSize: '13px', color: 'var(--txt-1)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {SPECIALITES.map(spec => (
            <button
              key={spec}
              onClick={() => setSpecFilter(spec)}
              style={{
                background: specFilter === spec ? 'var(--gold)20' : 'var(--bg-2)',
                border: specFilter === spec ? '0.5px solid var(--gold)' : '0.5px solid var(--line)',
                color: specFilter === spec ? 'var(--gold-2)' : 'var(--txt-2)',
                borderRadius: '20px', padding: '5px 14px', fontSize: '12px',
                fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU AVEC ÉDITION EN LIGNE DIRECTE */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 140px 130px 80px', padding: '10px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setSelectedIds(allSelected ? [] : filtered.map(st => st.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: allSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          </div>
          {['NOM / CONTACT (ÉDITABLE)', 'ENTREPRISE (ÉDITABLE)', 'SPÉCIALITÉ (ÉDITABLE)', 'TÉLÉPHONE', 'LICENCE RBQ', 'ACTIONS'].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement des sous-traitants…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--bg-1)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
            <HardHat size={36} color="var(--txt-3)" style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)' }}>Aucun sous-traitant trouvé</div>
            <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '4px' }}>Ajoutez vos sous-traitants pour suivre leurs travaux.</div>
          </div>
        ) : (
          filtered.map((st, idx) => {
            const isSelected = selectedIds.includes(st.id)
            return (
              <div
                key={st.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 140px 130px 80px',
                  padding: '10px 18px', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
                  alignItems: 'center', background: isSelected ? 'var(--ga)' : 'transparent',
                }}
              >
                {/* Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setSelectedIds(prev => prev.includes(st.id) ? prev.filter(x => x !== st.id) : [...prev, st.id])} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </div>

                {/* 1. NOM EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={st.nom}
                    onBlur={e => e.target.value !== st.nom && updateInlineField(st.id, 'nom', e.target.value)}
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

                {/* 2. ENTREPRISE EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={st.entreprise || ''}
                    placeholder="Nom d'entreprise..."
                    onBlur={e => e.target.value !== (st.entreprise || '') && updateInlineField(st.id, 'entreprise', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '12px', color: 'var(--txt-2)', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 3. SPÉCIALITÉ EN DROPDOWN DIRECT */}
                <div>
                  <select
                    value={st.specialite || 'général'}
                    onChange={e => updateInlineField(st.id, 'specialite', e.target.value)}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      background: 'var(--gold)18',
                      color: 'var(--gold-2)',
                      border: '1px solid var(--gold)40',
                      borderRadius: '20px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {SPECIALITES_OPTIONS.map(spec => (
                      <option key={spec} value={spec} style={{ background: '#1F2937', color: '#F3F4F6' }}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. TÉLÉPHONE EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={st.telephone || ''}
                    placeholder="Téléphone..."
                    onBlur={e => e.target.value !== (st.telephone || '') && updateInlineField(st.id, 'telephone', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '12px', color: 'var(--txt-3)', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 5. LICENCE RBQ EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={st.rbq_no || ''}
                    placeholder="RBQ..."
                    onBlur={e => e.target.value !== (st.rbq_no || '') && updateInlineField(st.id, 'rbq_no', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '11px', fontWeight: 600, color: 'var(--green)', outline: 'none',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  <button
                    onClick={() => openEdit(st)}
                    title="Fiche détaillée"
                    style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 6px', cursor: 'pointer', color: 'var(--txt-2)' }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(st.id)}
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

      {/* Modal Création/Édition */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', width: '100%', maxWidth: '520px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)' }}>
                {editingItem ? 'Modifier le sous-traitant' : 'Nouveau sous-traitant'}
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--txt-3)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Nom / Contact *</label>
                  <input
                    required
                    type="text"
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Jean Tremblay"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Nom d'entreprise</label>
                  <input
                    type="text"
                    value={form.entreprise}
                    onChange={e => setForm({ ...form, entreprise: e.target.value })}
                    placeholder="Ex: Électricité Nova Inc."
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Spécialité</label>
                  <select
                    value={form.specialite}
                    onChange={e => setForm({ ...form, specialite: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  >
                    {SPECIALITES_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>No de Licence RBQ</label>
                  <input
                    type="text"
                    value={form.rbq_no}
                    onChange={e => setForm({ ...form, rbq_no: e.target.value })}
                    placeholder="Ex: 5678-1234-01"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Téléphone</label>
                  <input
                    type="text"
                    value={form.telephone}
                    onChange={e => setForm({ ...form, telephone: e.target.value })}
                    placeholder="(418) 555-0199"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Courriel</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@entreprise.com"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ background: 'var(--gold)', color: '#0A0A0A', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {editingItem ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
