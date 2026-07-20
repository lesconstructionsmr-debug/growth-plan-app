'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  HardHat, Plus, Search, Loader2, X,
  CheckCircle2, XCircle, Mail, DollarSign,
  Edit3, Trash2, CheckSquare, Square
} from 'lucide-react'

interface EmployeRow {
  id: string
  nom: string
  email: string | null
  poste: string | null
  taux_horaire: number | null
  actif: boolean
}

export default function EmployesPage() {
  const [search, setSearch] = useState('')
  const [employes, setEmployes] = useState<EmployeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<EmployeRow | null>(null)
  const [saving, setSaving] = useState(false)

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Form states
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [poste, setPoste] = useState('')
  const [tauxHoraire, setTauxHoraire] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadEmployes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employes')
      .select('id, nom, email, poste, taux_horaire, statut')
      .order('nom', { ascending: true })

    if (error) {
      console.error('[loadEmployes]', error)
    } else {
      setEmployes((data ?? []).map((e: any) => ({
        id: e.id,
        nom: e.nom,
        email: e.email ?? null,
        poste: e.poste ?? null,
        taux_horaire: e.taux_horaire ? Number(e.taux_horaire) : null,
        actif: e.statut !== 'inactif',
      })))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadEmployes()
  }, [loadEmployes])

  // ── MODIFICATION EN LIGNE DIRECTE DANS LE TABLEAU ─────────────────────
  async function updateInlineField(id: string, field: 'nom' | 'email' | 'poste' | 'taux_horaire' | 'statut', value: any) {
    setEmployes(prev => prev.map(e => {
      if (e.id !== id) return e
      if (field === 'statut') return { ...e, actif: value === 'actif' }
      if (field === 'taux_horaire') return { ...e, taux_horaire: parseFloat(value) || null }
      return { ...e, [field]: value || null }
    }))

    const dbValue = field === 'statut'
      ? value
      : field === 'taux_horaire'
      ? (parseFloat(value) || null)
      : (value || null)

    await supabase.from('employes').update({ [field]: dbValue }).eq('id', id)
  }

  function openCreate() {
    setEditingItem(null)
    setNom('')
    setEmail('')
    setPoste('')
    setTauxHoraire('')
    setShowModal(true)
  }

  function openEdit(emp: EmployeRow) {
    setEditingItem(emp)
    setNom(emp.nom)
    setEmail(emp.email || '')
    setPoste(emp.poste || '')
    setTauxHoraire(emp.taux_horaire ? String(emp.taux_horaire) : '')
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setSaving(true)

    try {
      if (editingItem) {
        // Édition
        const { error } = await supabase
          .from('employes')
          .update({
            nom: nom.trim(),
            email: email.trim() || null,
            poste: poste.trim() || null,
            taux_horaire: tauxHoraire ? parseFloat(tauxHoraire) : null,
          })
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        // Création
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Utilisateur non connecté')
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
        if (!profile?.company_id) throw new Error('Entreprise introuvable')

        const { error } = await supabase
          .from('employes')
          .insert({
            company_id: profile.company_id,
            nom: nom.trim(),
            email: email.trim() || null,
            poste: poste.trim() || null,
            taux_horaire: tauxHoraire ? parseFloat(tauxHoraire) : null,
            statut: 'actif'
          })

        if (error) throw error
      }

      setShowModal(false)
      await loadEmployes()
    } catch (err) {
      console.error('[handleSave]', err)
      alert('Erreur lors de la sauvegarde de l\'employé')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet employé ?')) return
    await supabase.from('employes').delete().eq('id', id)
    setShowModal(false)
    await loadEmployes()
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} employés sélectionnés ?`)) return
    await supabase.from('employes').delete().in('id', selectedIds)
    setSelectedIds([])
    await loadEmployes()
  }

  const filtered = employes.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase())
    || (e.email ?? '').toLowerCase().includes(search.toLowerCase())
    || (e.poste ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1050px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardHat size={20} color="var(--gold)" /> Employés & Équipe
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Gestion de l'équipe, postes, taux horaires et édition directe dans la liste
          </div>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', borderRadius: '8px', padding: '9px 16px',
            fontSize: '13px', fontWeight: 700, color: '#0A0A0A', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={15} /> Ajouter un employé
        </button>
      </div>

      {/* Sélection en masse */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'var(--ga)', border: '1px solid var(--gold)',
          borderRadius: '10px', padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} />
            {selectedIds.length} employé(s) sélectionné(s)
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
          placeholder="Rechercher un employé par nom, poste..."
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

      {/* Tableau avec ÉDITION EN LIGNE DIRECTE */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 110px 80px', padding: '10px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setSelectedIds(allSelected ? [] : filtered.map(e => e.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: allSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          </div>
          {['NOM (ÉDITABLE)', 'COURRIEL', 'POSTE (ÉDITABLE)', 'TAUX $/H (ÉDITABLE)', 'ACTIONS'].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em', textAlign: h.includes('TAUX') ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <HardHat size={32} color="var(--txt-3)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>Aucun employé pour l'instant</p>
          </div>
        ) : (
          filtered.map((e, idx) => {
            const isSelected = selectedIds.includes(e.id)
            return (
              <div
                key={e.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 180px 140px 110px 80px',
                  padding: '10px 18px', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
                  alignItems: 'center', background: isSelected ? 'var(--ga)' : 'transparent',
                }}
              >
                {/* Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setSelectedIds(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </div>

                {/* 1. NOM EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={e.nom}
                    onBlur={evt => evt.target.value !== e.nom && updateInlineField(e.id, 'nom', evt.target.value)}
                    onKeyDown={evt => evt.key === 'Enter' && (evt.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', outline: 'none',
                    }}
                    onFocus={evt => (evt.target.style.background = 'var(--bg-2)', evt.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={evt => (evt.target.style.background = 'transparent', evt.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 2. COURRIEL EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="email"
                    defaultValue={e.email || ''}
                    placeholder="Ajouter email..."
                    onBlur={evt => evt.target.value !== (e.email || '') && updateInlineField(e.id, 'email', evt.target.value)}
                    onKeyDown={evt => evt.key === 'Enter' && (evt.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '11px', color: 'var(--txt-3)', outline: 'none',
                    }}
                    onFocus={evt => (evt.target.style.background = 'var(--bg-2)', evt.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={evt => (evt.target.style.background = 'transparent', evt.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 3. POSTE EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={e.poste || ''}
                    placeholder="Ajouter poste..."
                    onBlur={evt => evt.target.value !== (e.poste || '') && updateInlineField(e.id, 'poste', evt.target.value)}
                    onKeyDown={evt => evt.key === 'Enter' && (evt.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '11px', fontWeight: 600, color: 'var(--blue)', outline: 'none',
                    }}
                    onFocus={evt => (evt.target.style.background = 'var(--bg-2)', evt.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={evt => (evt.target.style.background = 'transparent', evt.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* 4. TAUX HORAIRE EN SAISIE DIRECTE */}
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                  <input
                    type="number"
                    step="0.50"
                    defaultValue={e.taux_horaire ?? ''}
                    placeholder="0.00"
                    onBlur={evt => parseFloat(evt.target.value) !== (e.taux_horaire || 0) && updateInlineField(e.id, 'taux_horaire', evt.target.value)}
                    onKeyDown={evt => evt.key === 'Enter' && (evt.target as HTMLInputElement).blur()}
                    style={{
                      width: '75px', boxSizing: 'border-box', background: 'transparent',
                      border: '1px solid transparent', borderRadius: '5px', padding: '3px 6px',
                      fontSize: '12px', fontWeight: 700, color: 'var(--txt-1)', textAlign: 'right', outline: 'none',
                    }}
                    onFocus={evt => (evt.target.style.background = 'var(--bg-2)', evt.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={evt => (evt.target.style.background = 'transparent', evt.target.style.borderColor = 'transparent')}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>$/h</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  <button
                    onClick={() => openEdit(e)}
                    title="Modifier dans la fiche"
                    style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 6px', cursor: 'pointer', color: 'var(--txt-2)' }}
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(e.id)}
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
            onSubmit={handleSave}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)' }}>
                {editingItem ? 'Modifier l\'employé' : 'Ajouter un employé'}
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
                placeholder="Ex: Jean Tremblay"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Courriel (optionnel)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jean@exemple.com"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Poste / Rôle</label>
                <input
                  type="text"
                  value={poste}
                  onChange={e => setPoste(e.target.value)}
                  placeholder="Ex: Peintre, Menuisier..."
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>Taux horaire ($/h)</label>
                <input
                  type="number"
                  step="0.50"
                  value={tauxHoraire}
                  onChange={e => setTauxHoraire(e.target.value)}
                  placeholder="25.00"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {editingItem && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingItem.id)}
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
                {editingItem ? 'Enregistrer les modifications' : 'Ajouter l\'employé'}
              </button>
            </div>
          </form>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
