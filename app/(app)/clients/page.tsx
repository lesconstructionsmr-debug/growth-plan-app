'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Users, Plus, Search, Building2, User, Phone, Mail,
  CheckCircle2, Clock, Archive, TrendingUp, Loader2,
  Trash2, CheckSquare, Square, Edit3
} from 'lucide-react'
import type { StatutClient } from '@/lib/types/models'

interface ClientRow {
  id: string
  nom: string
  type: 'particulier' | 'entreprise'
  statut: StatutClient
  email: string | null
  telephone: string | null
  ville: string | null
  nombre_projets: number
  total_facture: number
  cree_le: string
}

const STATUTS: { value: StatutClient; label: string; color: string }[] = [
  { value: 'prospect', label: 'Prospect',  color: 'var(--amber)' },
  { value: 'actif',    label: 'Actif',     color: 'var(--green)' },
  { value: 'inactif',  label: 'Inactif',   color: 'var(--txt-3)' },
  { value: 'archive',  label: 'Archivé',   color: 'var(--red)'   },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<string>('tous')
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadClients = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('id, nom, email, telephone, ville, created_at')
      .order('created_at', { ascending: false })

    setClients((data ?? []).map((c: any) => ({
      id: c.id,
      nom: c.nom,
      type: 'particulier',
      statut: 'actif',
      email: c.email ?? null,
      telephone: c.telephone ?? null,
      ville: c.ville ?? null,
      nombre_projets: 0,
      total_facture: 0,
      cree_le: c.created_at,
    })))
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadClients() }, [loadClients])

  // ── ÉDITION EN LIGNE DIRECTE SUR LE TABLEAU ─────────────────────
  async function updateInlineField(id: string, field: 'nom' | 'email' | 'telephone' | 'ville' | 'statut', value: any) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: value || null } : c))
    await supabase.from('clients').update({ [field]: value || null }).eq('id', id)
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return
    await supabase.from('clients').delete().eq('id', id)
    loadClients()
  }

  async function handleBatchDelete() {
    if (selectedIds.length === 0) return
    if (!confirm(`Voulez-vous vraiment supprimer les ${selectedIds.length} clients sélectionnés ?`)) return
    await supabase.from('clients').delete().in('id', selectedIds)
    setSelectedIds([])
    loadClients()
  }

  const filtered = clients.filter(c => {
    const matchSearch = c.nom.toLowerCase().includes(search.toLowerCase())
      || (c.email ?? '').toLowerCase().includes(search.toLowerCase())
      || (c.telephone ?? '').toLowerCase().includes(search.toLowerCase())
      || (c.ville ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatut = statutFilter === 'tous' || c.statut === statutFilter
    return matchSearch && matchStatut
  })

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} color="var(--gold)" /> Clients & Prospects
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Gestion des coordonnées clients et modification directe dans la liste
          </div>
        </div>
        <a
          href="/clients/nouveau"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', borderRadius: '8px', padding: '9px 16px',
            fontSize: '13px', fontWeight: 700, color: '#0A0A0A', textDecoration: 'none',
          }}
        >
          <Plus size={15} /> Nouveau client
        </a>
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
            {selectedIds.length} client(s) sélectionné(s)
          </div>
          <button
            onClick={handleBatchDelete}
            style={{ background: 'var(--red)20', border: '0.5px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={13} /> Supprimer la sélection
          </button>
        </div>
      )}

      {/* Recherche & Filtres */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={14} color="var(--txt-3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom, courriel, téléphone, ville…"
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

        <div style={{ display: 'flex', gap: '6px' }}>
          {['tous', 'prospect', 'actif', 'inactif', 'archive'].map(s => (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              style={{
                background: statutFilter === s ? 'var(--gold)20' : 'var(--bg-2)',
                border: statutFilter === s ? '0.5px solid var(--gold)' : '0.5px solid var(--line)',
                color: statutFilter === s ? 'var(--gold-2)' : 'var(--txt-2)',
                borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau avec ÉDITION EN LIGNE DIRECTE */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 200px 140px 120px 110px 60px', padding: '10px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setSelectedIds(allSelected ? [] : filtered.map(c => c.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: allSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
          </div>
          {['NOM (ÉDITABLE)', 'COURRIEL (ÉDITABLE)', 'TÉLÉPHONE (ÉDITABLE)', 'VILLE (ÉDITABLE)', 'STATUT (ÉDITABLE)', 'ACTIONS'].map((h, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px' }}>
            <Users size={32} color="var(--txt-3)" strokeWidth={1.2} />
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>Aucun client trouvé</p>
          </div>
        ) : (
          filtered.map((c, idx) => {
            const isSelected = selectedIds.includes(c.id)
            const stCfg = STATUTS.find(s => s.value === c.statut) || STATUTS[1]

            return (
              <div
                key={c.id}
                style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 200px 140px 120px 110px 60px',
                  padding: '10px 18px', borderBottom: idx < filtered.length - 1 ? '0.5px solid var(--line)' : 'none',
                  alignItems: 'center', background: isSelected ? 'var(--ga)' : 'transparent',
                }}
              >
                {/* Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button onClick={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--gold)' : 'var(--txt-3)' }}>
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </div>

                {/* 1. NOM EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={c.nom}
                    onBlur={e => e.target.value !== c.nom && updateInlineField(c.id, 'nom', e.target.value)}
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
                    defaultValue={c.email || ''}
                    placeholder="Ajouter email..."
                    onBlur={e => e.target.value !== (c.email || '') && updateInlineField(c.id, 'email', e.target.value)}
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
                    defaultValue={c.telephone || ''}
                    placeholder="Téléphone..."
                    onBlur={e => e.target.value !== (c.telephone || '') && updateInlineField(c.id, 'telephone', e.target.value)}
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

                {/* 4. VILLE EN SAISIE DIRECTE */}
                <div>
                  <input
                    type="text"
                    defaultValue={c.ville || ''}
                    placeholder="Ville..."
                    onBlur={e => e.target.value !== (c.ville || '') && updateInlineField(c.id, 'ville', e.target.value)}
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

                {/* 5. STATUT EN DROPDOWN DIRECT */}
                <div>
                  <select
                    value={c.statut}
                    onChange={e => updateInlineField(c.id, 'statut', e.target.value)}
                    style={{
                      appearance: 'none', WebkitAppearance: 'none',
                      background: `${stCfg.color}18`, color: stCfg.color,
                      border: `1px solid ${stCfg.color}40`,
                      borderRadius: '20px', padding: '4px 10px',
                      fontSize: '10px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {STATUTS.map(s => (
                      <option key={s.value} value={s.value} style={{ background: '#1F2937', color: '#F3F4F6' }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                  <a
                    href={`/clients/${c.id}`}
                    title="Voir fiche complète"
                    style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 6px', color: 'var(--txt-2)', display: 'inline-flex' }}
                  >
                    <Edit3 size={13} />
                  </a>
                  <button
                    onClick={() => handleDelete(c.id)}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
