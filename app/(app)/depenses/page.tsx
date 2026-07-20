'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Receipt, Plus, Search, Loader2, X, Wallet, Check, Trash2, CheckSquare, Square, Edit2 } from 'lucide-react'

const DEFAULT_CATEGORIES = [
  'Matériaux',
  'Équipement',
  'Sous-traitant',
  'Transport',
  'Hébergement',
  'Dépense Fixe',
  'Budget Personnel',
  'Autre',
]

const CAT_STYLE: Record<string, { color: string; bg: string }> = {
  'Matériaux':        { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
  'Équipement':       { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)'  },
  'Sous-traitant':    { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)'  },
  'Transport':        { color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  'Hébergement':      { color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
  'Dépense Fixe':     { color: '#EF4444', bg: 'rgba(239,68,68,0.15)'   },
  'Budget Personnel': { color: '#EC4899', bg: 'rgba(236,72,153,0.15)'  },
  'Autre':            { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
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

const labelSt: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }
const inputSt: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [jobs, setJobs]         = useState<Job[]>([])
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [catFilter, setCatFilter] = useState<string | null>(null)
  
  // Sélection multiple
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modal création / édition
  const [showModal, setShowModal] = useState(false)
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null)
  const [saving, setSaving]     = useState(false)
  const [form, setForm] = useState({
    description: '', montant: '', categorie: 'Matériaux',
    date_depense: new Date().toISOString().split('T')[0], job_id: '',
  })

  // Nouvelles catégories sur mesure
  const [showCatManager, setShowCatManager] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')

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
    const loadedDepenses = (dep as unknown as Depense[]) || []
    setDepenses(loadedDepenses)
    setJobs(jobsData || [])

    const customCats = Array.from(new Set(loadedDepenses.map(d => d.categorie).filter(Boolean) as string[]))
    setCategoriesList(Array.from(new Set([...DEFAULT_CATEGORIES, ...customCats])))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── MODIFICATION EN LIGNE DIRECTE DANS LE TABLEAU ─────────────────────
  async function updateInlineField(id: string, field: 'description' | 'montant' | 'categorie', value: any) {
    setDepenses(prev => prev.map(d => {
      if (d.id !== id) return d
      if (field === 'montant') return { ...d, montant: parseFloat(value) || 0 }
      return { ...d, [field]: value }
    }))

    const valToSave = field === 'montant' ? parseFloat(value) || 0 : value
    await supabase.from('depenses').update({ [field]: valToSave }).eq('id', id)
  }

  // ── ACTION EN MASSE SUR SÉLECTION MULTIPLE ──────────────────────────
  async function handleBatchCategoryChange(newCat: string) {
    if (selectedIds.length === 0) return
    setDepenses(prev => prev.map(d => selectedIds.includes(d.id) ? { ...d, categorie: newCat } : d))
    await supabase.from('depenses').update({ categorie: newCat }).in('id', selectedIds)
    setSelectedIds([])
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} dépenses sélectionnées ?`)) return
    setDepenses(prev => prev.filter(d => !selectedIds.includes(d.id)))
    await supabase.from('depenses').delete().in('id', selectedIds)
    setSelectedIds([])
  }

  function toggleSelectAll(filteredList: Depense[]) {
    if (selectedIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredList.map(d => d.id))
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Modal Handlers
  function openCreate() {
    setEditingDepense(null)
    setForm({
      description: '',
      montant: '',
      categorie: categoriesList[0] || 'Matériaux',
      date_depense: new Date().toISOString().split('T')[0],
      job_id: '',
    })
    setShowModal(true)
  }

  function openEdit(d: Depense) {
    setEditingDepense(d)
    setForm({
      description: d.description,
      montant: String(d.montant),
      categorie: d.categorie || 'Matériaux',
      date_depense: d.date_depense,
      job_id: d.job_id || '',
    })
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    if (editingDepense) {
      await supabase.from('depenses').update({
        description:  form.description,
        montant:      parseFloat(form.montant),
        categorie:    form.categorie,
        date_depense: form.date_depense,
        job_id:       form.job_id || null,
      }).eq('id', editingDepense.id)
    } else {
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
    }

    setShowModal(false)
    setSaving(false)
    await load()
  }

  async function handleDeleteSingle(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cette dépense ?')) return
    await supabase.from('depenses').delete().eq('id', id)
    setShowModal(false)
    await load()
  }

  function handleAddCustomCategory() {
    if (!newCatInput.trim()) return
    const trimmed = newCatInput.trim()
    if (!categoriesList.includes(trimmed)) {
      setCategoriesList(prev => [...prev, trimmed])
    }
    setForm(prev => ({ ...prev, categorie: trimmed }))
    setNewCatInput('')
    setShowCatManager(false)
  }

  // Filtrage
  const filtered = depenses.filter(d => {
    const matchCat = catFilter ? d.categorie === catFilter : true
    const matchSearch = search ? d.description.toLowerCase().includes(search.toLowerCase()) : true
    return matchCat && matchSearch
  })

  // Statistiques
  const totalMois = depenses.reduce((sum, d) => sum + Number(d.montant), 0)
  const countMois = depenses.length

  const catTotals = categoriesList.map(c => ({
    cat: c,
    total: depenses.filter(d => d.categorie === c).reduce((sum, d) => sum + Number(d.montant), 0),
  })).filter(x => x.total > 0)

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  return (
    <div style={{ padding: '24px', maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={20} color="var(--gold)" /> Dépenses
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Modifiez directement le nom, le montant ou la catégorie de n'importe quel item de la liste
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
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>

      {/* KPIs & Filtres */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total des Dépenses</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--red)', marginTop: '4px' }}>{fmt(totalMois)}</div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>{countMois} transactions enregistrées</div>
        </div>

        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Filtres par Catégorie</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCatFilter(null)}
              style={{
                background: catFilter === null ? 'var(--gold)20' : 'var(--bg-2)',
                border: catFilter === null ? '0.5px solid var(--gold)' : '0.5px solid var(--line)',
                color: catFilter === null ? 'var(--gold-2)' : 'var(--txt-2)',
                borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Toutes ({fmt(totalMois)})
            </button>
            {catTotals.map(ct => {
              const st = CAT_STYLE[ct.cat] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' }
              const active = catFilter === ct.cat
              return (
                <button
                  key={ct.cat}
                  onClick={() => setCatFilter(active ? null : ct.cat)}
                  style={{
                    background: active ? st.bg : 'var(--bg-2)',
                    border: active ? `0.5px solid ${st.color}` : '0.5px solid var(--line)',
                    color: active ? st.color : 'var(--txt-2)',
                    borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <span>{ct.cat}</span>
                  <span style={{ color: st.color, fontWeight: 700 }}>{fmt(ct.total)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Barre d'action groupée si éléments sélectionnés */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'var(--ga)', border: '1px solid var(--gold)',
          borderRadius: '10px', padding: '12px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} />
            {selectedIds.length} dépense(s) sélectionnée(s)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>Changer catégorie vers :</span>
              <select
                onChange={e => e.target.value && handleBatchCategoryChange(e.target.value)}
                defaultValue=""
                style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', color: 'var(--txt-1)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', outline: 'none' }}
              >
                <option value="" disabled>— Choisir une catégorie —</option>
                {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={handleBatchDelete}
              style={{ background: 'var(--red)20', border: '0.5px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={13} /> Supprimer la sélection
            </button>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)' }} />
        <input
          type="text"
          placeholder="Rechercher une dépense par description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: '8px', padding: '9px 12px 9px 34px',
            fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* TABLE DES DÉPENSES AVEC ÉDITION DIRECTE SUR CHAQUE CELLULE */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 180px 130px 130px 60px', padding: '10px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => toggleSelectAll(filtered)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: allSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          </div>
          {['DESCRIPTION / NOM (ÉDITABLE)', 'CATÉGORIE (ÉDITABLE)', 'DATE', 'MONTANT ($ ÉDITABLE)', ''].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em', textAlign: h.includes('MONTANT') ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Receipt size={32} color="var(--txt-3)" strokeWidth={1} style={{ marginBottom: '12px' }} />
            <div style={{ fontSize: '13px', color: 'var(--txt-3)', marginBottom: '8px' }}>
              {depenses.length === 0 ? 'Aucune dépense enregistrée' : 'Aucun résultat correspondant'}
            </div>
            {depenses.length === 0 && (
              <button onClick={openCreate} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>
                + Enregistrer la première dépense
              </button>
            )}
          </div>
        ) : (
          filtered.map((d, i) => {
            const currentCat = d.categorie || 'Autre'
            const st = CAT_STYLE[currentCat] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' }
            const isSelected = selectedIds.includes(d.id)

            return (
              <div
                key={d.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 180px 130px 130px 60px',
                  padding: '10px 18px', borderBottom: i < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
                  alignItems: 'center', background: isSelected ? 'var(--ga)' : 'transparent',
                  transition: 'background 0.1s',
                }}
              >
                {/* Case à cocher */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => toggleSelectOne(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </div>

                {/* 1. NOM / DESCRIPTION EN Saisie DIRECTE */}
                <div style={{ paddingRight: '12px' }}>
                  <input
                    type="text"
                    defaultValue={d.description}
                    onBlur={e => e.target.value !== d.description && updateInlineField(d.id, 'description', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'transparent', border: '1px solid transparent',
                      borderRadius: '6px', padding: '4px 6px',
                      fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                  {d.jobs?.titre && <div style={{ fontSize: '11px', color: 'var(--txt-3)', paddingLeft: '6px' }}>🔨 {d.jobs.titre}</div>}
                </div>

                {/* 2. CATÉGORIE EN DROPDOWN DIRECT */}
                <div>
                  <select
                    value={currentCat}
                    onChange={e => updateInlineField(d.id, 'categorie', e.target.value)}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      background: st.bg,
                      color: st.color,
                      border: `1px solid ${st.color}50`,
                      borderRadius: '20px',
                      padding: '5px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c} style={{ background: '#1F2937', color: '#F3F4F6' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. DATE */}
                <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
                  {fmtDate(d.date_depense)}
                </div>

                {/* 4. MONTANT EN Saisie DIRECTE */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={d.montant}
                    onBlur={e => parseFloat(e.target.value) !== d.montant && updateInlineField(d.id, 'montant', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    style={{
                      width: '90px', boxSizing: 'border-box',
                      background: 'transparent', border: '1px solid transparent',
                      borderRadius: '6px', padding: '4px 6px',
                      fontSize: '13px', fontWeight: 700, color: 'var(--red)',
                      textAlign: 'right', outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.background = 'var(--bg-2)', e.target.style.borderColor = 'var(--gold)')}
                    onBlurCapture={e => (e.target.style.background = 'transparent', e.target.style.borderColor = 'transparent')}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  <button
                    onClick={() => openEdit(d)}
                    title="Ouvrir la fiche complète"
                    style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 6px', cursor: 'pointer', color: 'var(--txt-2)' }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteSingle(d.id)}
                    title="Supprimer"
                    style={{ background: 'var(--red)15', border: '0.5px solid var(--red)30', borderRadius: '6px', padding: '5px 6px', cursor: 'pointer', color: 'var(--red)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Création & Modification complète */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <form
            onSubmit={handleSave}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>
                {editingDepense ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}><X size={18} /></button>
            </div>

            <div>
              <label style={labelSt}>Description *</label>
              <input
                required
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Loyer, Épicerie, Matériaux peinture..."
                style={inputSt}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Montant ($) *</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.montant}
                  onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
                  placeholder="0.00"
                  style={inputSt}
                />
              </div>
              <div>
                <label style={labelSt}>Date</label>
                <input
                  type="date"
                  value={form.date_depense}
                  onChange={e => setForm(p => ({ ...p, date_depense: e.target.value }))}
                  style={inputSt}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={labelSt}>Catégorie</label>
                  <button
                    type="button"
                    onClick={() => setShowCatManager(v => !v)}
                    style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Nouvelle catégorie
                  </button>
                </div>
                <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} style={inputSt}>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
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

            {/* Formulaire d'ajout de nouvelle catégorie sur mesure */}
            {showCatManager && (
              <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  placeholder="Nom de la nouvelle catégorie..."
                  style={{ flex: 1, background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: 'var(--txt-1)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  style={{ background: 'var(--gold)', color: '#0A0A0A', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Ajouter
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {editingDepense && (
                <button
                  type="button"
                  onClick={() => handleDeleteSingle(editingDepense.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    background: 'rgba(239,68,68,0.1)', border: '0.5px solid var(--red)',
                    borderRadius: '9px', padding: '12px', fontSize: '13px', fontWeight: 600, color: 'var(--red)',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '12px',
                  fontSize: '13px', fontWeight: 700, color: '#0A0A0A', cursor: saving ? 'default' : 'pointer',
                }}
              >
                {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : editingDepense ? <Edit2 size={14} /> : <Plus size={14} />}
                {saving ? 'Enregistrement…' : editingDepense ? 'Enregistrer les modifications' : 'Ajouter la dépense'}
              </button>
            </div>
          </form>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
