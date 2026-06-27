'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Building2, Save, MapPin, Calendar, Loader2 } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-2)', border: '0.5px solid var(--line)',
  borderRadius: '7px', padding: '8px 10px',
  fontSize: '12px', color: 'var(--txt-1)', outline: 'none', width: '100%',
  fontFamily: 'inherit', boxSizing: 'border-box' as const,
}
const labelStyle: React.CSSProperties = {
  fontSize: '11px', color: 'var(--txt-3)', marginBottom: '4px', display: 'block',
}

interface ClientOption { id: string; nom: string }

export default function NouveauJobPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    titre: '', client_id: '', description: '',
    adresse: '', ville: '', code_postal: '', rayon_pointage: '200',
    date_debut: '', date_fin_prevue: '', budget: '', couleur: '#C9A84C',
  })

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.from('clients').select('id, nom').order('nom').then(({ data }) => {
      setClients(data ?? [])
    })
  }, [])

  async function handleSubmit() {
    if (!form.titre.trim()) { setError('Le titre est requis.'); return }
    if (!form.client_id) { setError('Sélectionnez un client.'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre:         form.titre,
          client_id:     form.client_id,
          description:   form.description || null,
          adresse:       form.adresse || null,
          ville:         form.ville || null,
          code_postal:   form.code_postal || null,
          rayon_pointage_metres: Number(form.rayon_pointage) || 200,
          date_debut:    form.date_debut || null,
          date_fin_prevue: form.date_fin_prevue || null,
          budget:        form.budget ? Number(form.budget) : null,
          couleur:       form.couleur,
          statut:        'en_attente',
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const job = await res.json()
      router.push(`/jobs/${job.id}`)
    } catch (err) {
      setError('Erreur lors de la création — réessayez.')
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="/jobs" style={{ color: 'var(--txt-3)', display: 'flex' }}><ArrowLeft size={16} /></a>
          <Building2 size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Nouveau job</h1>
        </div>
        <button onClick={handleSubmit} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
          fontSize: '12px', fontWeight: 600, color: '#0A0A0A', border: 'none',
          cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
        }}>
          {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={13} />}
          {saving ? 'Création…' : 'Créer le job'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid var(--red)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Titre du job *</label>
          <input value={form.titre} onChange={e => set('titre', e.target.value)} placeholder="Ex: Peinture intérieure — Résidence Tremblay" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Client *</label>
          <select value={form.client_id} onChange={e => set('client_id', e.target.value)} style={inputStyle}>
            <option value="">Sélectionner un client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Description</label>
          <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Détails du travail à réaliser..." style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <MapPin size={13} color="var(--gold)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-2)' }}>Chantier</span>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Adresse</label>
          <input value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="123 rue des Érables" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ville</label>
          <input value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Québec" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Code postal</label>
          <input value={form.code_postal} onChange={e => set('code_postal', e.target.value)} placeholder="G1R 2C7" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Rayon pointage GPS (m)</label>
          <input type="number" value={form.rayon_pointage} onChange={e => set('rayon_pointage', e.target.value)} min={50} max={2000} style={inputStyle} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Calendar size={13} color="var(--gold)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-2)' }}>Calendrier & budget</span>
        </div>
        <div>
          <label style={labelStyle}>Date de début</label>
          <input type="date" value={form.date_debut} onChange={e => set('date_debut', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Date de fin prévue</label>
          <input type="date" value={form.date_fin_prevue} onChange={e => set('date_fin_prevue', e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Budget estimé ($)</label>
          <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} min={0} step={100} placeholder="0.00" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Couleur (calendrier)</label>
          <input type="color" value={form.couleur} onChange={e => set('couleur', e.target.value)} style={{ ...inputStyle, height: '36px', padding: '2px 6px', cursor: 'pointer' }} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
