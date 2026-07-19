'use client'

import { useState, useEffect } from 'react'
import {
  Users, Plus, Search, Phone, Mail, ShieldCheck,
  Building2, Trash2, Edit3, X, Loader2, CheckCircle2,
  HardHat, FileText, Filter
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

export default function SousTraitantsPage() {
  const [items, setItems] = useState<SousTraitant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('tous')
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
            Suivi des partenaires, spécialités, licences RBQ et numéros de taxes
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
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

      {/* Liste */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement des sous-traitants…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <HardHat size={36} color="var(--txt-3)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)' }}>Aucun sous-traitant trouvé</div>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '4px' }}>Ajoutez vos sous-traitants pour suivre leurs travaux et facturations.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(st => (
            <div
              key={st.id}
              style={{
                background: 'var(--bg-1)', border: '0.5px solid var(--line)',
                borderRadius: '12px', padding: '18px 20px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)' }}>{st.nom}</div>
                    {st.entreprise && (
                      <div style={{ fontSize: '12px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Building2 size={12} /> {st.entreprise}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      background: 'var(--gold)18', border: '0.5px solid var(--gold)40',
                      color: 'var(--gold-2)', borderRadius: '12px', padding: '2px 10px',
                      fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                    }}
                  >
                    {st.specialite}
                  </span>
                </div>

                {/* Coordonnées & RBQ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px', fontSize: '12px', color: 'var(--txt-2)' }}>
                  {st.rbq_no && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)' }}>
                      <ShieldCheck size={14} /> RBQ : <strong>{st.rbq_no}</strong>
                    </div>
                  )}
                  {st.telephone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} color="var(--txt-3)" /> <a href={`tel:${st.telephone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{st.telephone}</a>
                    </div>
                  )}
                  {st.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={13} color="var(--txt-3)" /> <a href={`mailto:${st.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{st.email}</a>
                    </div>
                  )}
                  {(st.tps_no || st.tvq_no) && (
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>
                      Taxes : {st.tps_no || 'N/D'} | {st.tvq_no || 'N/D'}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '0.5px solid var(--line)' }}>
                <button
                  onClick={() => openEdit(st)}
                  style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'var(--txt-2)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={12} /> Modifier
                </button>
                <button
                  onClick={() => handleDelete(st.id)}
                  style={{ background: 'var(--red)12', border: '0.5px solid var(--red)30', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: 'var(--red)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    {SPECIALITES.filter(s => s !== 'tous').map(s => (
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>No TPS</label>
                  <input
                    type="text"
                    value={form.tps_no}
                    onChange={e => setForm({ ...form, tps_no: e.target.value })}
                    placeholder="123456789 RT 0001"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '4px' }}>No TVQ</label>
                  <input
                    type="text"
                    value={form.tvq_no}
                    onChange={e => setForm({ ...form, tvq_no: e.target.value })}
                    placeholder="1234567890 TQ 0001"
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
