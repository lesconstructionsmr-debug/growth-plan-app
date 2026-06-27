'use client'

import { useState, useEffect } from 'react'
import { Plus, Landmark, Search, Loader2, X, Phone, Mail, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  banque:    { label: 'Banque',      color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  caisse:    { label: 'Caisse pop.', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  prive:     { label: 'Privé',       color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  assureur:  { label: 'Assureur',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  autre:     { label: 'Autre',       color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
}

interface Preteur {
  id: string; company_id: string; nom: string; type: string
  contact_nom: string | null; contact_email: string | null; contact_tel: string | null
  notes: string | null; actif: boolean; created_at: string
}

export default function PreteursPage() {
  const [preteurs, setPreteurs]   = useState<Preteur[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({ nom: '', type: 'banque', contact_nom: '', contact_email: '', contact_tel: '', notes: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/preteurs')
      const d = await r.json()
      setPreteurs(Array.isArray(d) ? d : [])
    } catch { setPreteurs([]) }
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await fetch('/api/preteurs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (r.ok) {
        setShowModal(false)
        setForm({ nom: '', type: 'banque', contact_nom: '', contact_email: '', contact_tel: '', notes: '' })
        await load()
      }
    } finally { setSaving(false) }
  }

  async function toggleActif(id: string, actif: boolean) {
    await fetch('/api/preteurs', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, actif: !actif }),
    })
    await load()
  }

  const filtered = preteurs.filter(p => {
    const q = search.toLowerCase()
    return !q || p.nom.toLowerCase().includes(q) || (p.contact_nom || '').toLowerCase().includes(q)
  })

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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 28px 80px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Landmark size={20} color="var(--gold)" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Prêteurs</h1>
            <p style={{ fontSize: '11px', color: 'var(--txt-3)', margin: 0 }}>{preteurs.filter(p => p.actif).length} actif{preteurs.filter(p => p.actif).length !== 1 ? 's' : ''} · {preteurs.length} total</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer' }}>
          <Plus size={14} /> Ajouter un prêteur
        </button>
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '380px' }}>
        <Search size={13} color="var(--txt-3)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
          style={{ ...inputStyle, paddingLeft: '32px' }} />
      </div>

      {/* Grille */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--txt-3)' }}>
          <Landmark size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ fontSize: '13px' }}>Aucun prêteur. Ajoutez vos institutions partenaires.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filtered.map(p => {
            const t = TYPE_LABELS[p.type] || TYPE_LABELS.autre
            return (
              <div key={p.id} style={{ background: 'var(--bg-1)', border: `0.5px solid ${p.actif ? 'var(--line)' : 'var(--line)'}`, borderRadius: '12px', padding: '18px', opacity: p.actif ? 1 : 0.5, transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '5px' }}>{p.nom}</div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: t.color, background: t.bg, padding: '2px 8px', borderRadius: '99px' }}>{t.label}</span>
                  </div>
                  <button onClick={() => toggleActif(p.id, p.actif)}
                    title={p.actif ? 'Désactiver' : 'Activer'}
                    style={{ width: '22px', height: '22px', borderRadius: '50%', border: `0.5px solid ${p.actif ? 'var(--green)' : 'var(--line)'}`, background: p.actif ? 'rgba(16,185,129,0.15)' : 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {p.actif && <Check size={11} color="var(--green)" />}
                  </button>
                </div>

                {p.contact_nom && (
                  <div style={{ fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>👤 {p.contact_nom}</div>
                )}
                {p.contact_email && (
                  <a href={`mailto:${p.contact_email}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--txt-3)', textDecoration: 'none', marginBottom: '4px' }}>
                    <Mail size={11} /> {p.contact_email}
                  </a>
                )}
                {p.contact_tel && (
                  <a href={`tel:${p.contact_tel}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--txt-3)', textDecoration: 'none' }}>
                    <Phone size={11} /> {p.contact_tel}
                  </a>
                )}
                {p.notes && (
                  <div style={{ marginTop: '10px', padding: '8px 10px', background: 'var(--bg-2)', borderRadius: '6px', fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.5 }}>
                    {p.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowModal(false)}>
          <form onSubmit={handleCreate} onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Ajouter un prêteur</h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}><X size={18} /></button>
            </div>

            <div>
              <label style={labelSt}>Nom de l'institution *</label>
              <input required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex : Caisse Desjardins Québec" style={inputStyle} />
            </div>
            <div>
              <label style={labelSt}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelSt}>Contact (nom)</label>
                <input value={form.contact_nom} onChange={e => setForm(p => ({ ...p, contact_nom: e.target.value }))} placeholder="Sophie Lavoie" style={inputStyle} />
              </div>
              <div>
                <label style={labelSt}>Téléphone</label>
                <input value={form.contact_tel} onChange={e => setForm(p => ({ ...p, contact_tel: e.target.value }))} placeholder="418 555-0000" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelSt}>Email du contact</label>
              <input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="s.lavoie@caisse.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelSt}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} placeholder="Taux préférentiel, délais types…" />
            </div>
            <button type="submit" disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--gold)', border: 'none', borderRadius: '9px', padding: '12px', fontSize: '13px', fontWeight: 700, color: '#0A0A0A', cursor: saving ? 'default' : 'pointer' }}>
              {saving ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Plus size={14} />}
              {saving ? 'Enregistrement…' : 'Ajouter le prêteur'}
            </button>
          </form>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
