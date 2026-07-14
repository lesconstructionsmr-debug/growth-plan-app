'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  HardHat, Plus, Search, Loader2, X,
  CheckCircle2, XCircle, Mail, DollarSign
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
  const [saving, setSaving] = useState(false)

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setSaving(true)

    try {
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

      // Reset & close
      setNom('')
      setEmail('')
      setPoste('')
      setTauxHoraire('')
      setShowModal(false)
      await loadEmployes()
    } catch (err) {
      console.error('[handleAdd]', err)
      alert('Erreur lors de l\'ajout de l\'employé')
    } finally {
      setSaving(false)
    }
  }

  const filtered = employes.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase())
    || (e.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HardHat size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Employés</h1>
          <span style={{ fontSize: '11px', color: 'var(--txt-3)', background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px' }}>
            {loading ? '…' : employes.length}
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
            fontSize: '12px', fontWeight: 600, color: '#0A0A0A', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Ajouter un employé
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-1)', border: '0.5px solid var(--line)',
        borderRadius: '8px', padding: '7px 12px', maxWidth: '300px',
      }}>
        <Search size={13} color="var(--txt-3)" />
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', width: '100%' }}
        />
      </div>

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={16} className="animate-spin" />
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <HardHat size={32} color="var(--bg-4)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>Aucun employé pour l'instant</p>
          </div>
        ) : (
          filtered.map(e => {
            const initials = e.nom.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
            return (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px 16px', borderBottom: '0.5px solid var(--line)',
              }}>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)',
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{e.nom}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{e.email ?? '—'}</div>
                </div>
                {e.poste && (
                  <span style={{
                    fontSize: '10px', padding: '3px 8px', borderRadius: '5px',
                    background: 'rgba(74,143,212,0.12)', color: 'var(--blue)',
                  }}>
                    {e.poste}
                  </span>
                )}
                {e.taux_horaire && (
                  <span style={{ fontSize: '11px', color: 'var(--txt-2)', marginRight: '14px' }}>
                    {e.taux_horaire.toFixed(2)} $/h
                  </span>
                )}
                <span style={{ fontSize: '11px', color: e.actif ? 'var(--green)' : 'var(--red)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {e.actif ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {e.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL AJOUT */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <form onSubmit={handleAdd} style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '12px', width: '100%', maxWidth: '440px', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Ajouter un employé</span>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Nom complet *</label>
                <input
                  type="text" required value={nom} onChange={e => setNom(e.target.value)}
                  placeholder="Martin Bédard"
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Adresse courriel</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="martin@exemple.com"
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Poste</label>
                  <input
                    type="text" value={poste} onChange={e => setPoste(e.target.value)}
                    placeholder="Apprenti Peintre"
                    style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Taux horaire ($/h)</label>
                  <input
                    type="number" step="0.01" value={tauxHoraire} onChange={e => setTauxHoraire(e.target.value)}
                    placeholder="25.00"
                    style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '0.5px solid var(--line)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer' }}>Annuler</button>
              <button type="submit" disabled={saving} style={{ background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
