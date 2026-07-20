'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
  Users, Plus, Search, User, Phone, Mail,
  MapPin, ChevronRight, Loader2, Trash2, CheckSquare, Square, ExternalLink
} from 'lucide-react'
import type { StatutClient } from '@/lib/types/models'
import { useLanguage } from '@/components/layout/language-provider'

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
  const router = useRouter()
  const { t } = useLanguage()
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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
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
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* En-tête Responsive Mobile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="var(--gold)" /> {t('Clients')}
          </h1>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            Cliquez sur n'importe quel client pour ouvrir sa fiche détaillée
          </div>
        </div>
        <Link
          href="/clients/nouveau"
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', borderRadius: '8px', padding: '10px 16px',
            fontSize: '13px', fontWeight: 700, color: '#0A0A0A', textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(212,175,55,0.2)', flexShrink: 0
          }}
        >
          <Plus size={16} /> Nouveau client
        </Link>
      </div>

      {/* Sélection en masse */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'var(--ga)', border: '1px solid var(--gold)',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} />
            {selectedIds.length} sélectionné(s)
          </div>
          <button
            onClick={handleBatchDelete}
            style={{ background: 'var(--red)20', border: '0.5px solid var(--red)', color: 'var(--red)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      )}

      {/* Recherche & Filtres Mobile Friendly */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="var(--txt-3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom, courriel, téléphone, ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-2)', border: '0.5px solid var(--line)',
              borderRadius: '10px', padding: '10px 12px 10px 38px',
              fontSize: '13px', color: 'var(--txt-1)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['tous', 'prospect', 'actif', 'inactif', 'archive'].map(s => (
            <button
              key={s}
              onClick={() => setStatutFilter(s)}
              style={{
                background: statutFilter === s ? 'var(--gold)20' : 'var(--bg-2)',
                border: statutFilter === s ? '0.5px solid var(--gold)' : '0.5px solid var(--line)',
                color: statutFilter === s ? 'var(--gold-2)' : 'var(--txt-2)',
                borderRadius: '20px', padding: '6px 14px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', textTransform: 'capitalize'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE MOBILE ET TABLEAU DESKTOP */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px', gap: '8px', color: 'var(--txt-3)', fontSize: '13px' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
          Chargement des clients…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '10px', background: 'var(--bg-1)', borderRadius: '12px', border: '0.5px solid var(--line)' }}>
          <Users size={36} color="var(--txt-3)" strokeWidth={1.2} />
          <p style={{ fontSize: '13px', color: 'var(--txt-3)', margin: 0 }}>Aucun client trouvé</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(c => {
            const isSelected = selectedIds.includes(c.id)
            const stCfg = STATUTS.find(s => s.value === c.statut) || STATUTS[1]

            return (
              <div
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                style={{
                  background: isSelected ? 'var(--ga)' : 'var(--bg-1)',
                  border: isSelected ? '1px solid var(--gold)' : '0.5px solid var(--line)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = isSelected ? 'var(--gold)' : 'var(--line)'}
              >
                {/* Checkbox + Client Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedIds(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isSelected ? 'var(--gold)' : 'var(--txt-3)', flexShrink: 0 }}
                  >
                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>

                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)', flexShrink: 0
                  }}>
                    {c.nom.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.nom}
                      </span>
                      <span style={{
                        fontSize: '9px', padding: '2px 8px', borderRadius: '12px',
                        background: `${stCfg.color}18`, color: stCfg.color, border: `1px solid ${stCfg.color}40`,
                        fontWeight: 600, textTransform: 'capitalize'
                      }}>
                        {stCfg.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '11px', color: 'var(--txt-3)', flexWrap: 'wrap' }}>
                      {c.telephone && (
                        <a
                          href={`tel:${c.telephone}`}
                          onClick={e => e.stopPropagation()}
                          style={{ color: 'var(--gold-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                        >
                          <Phone size={12} /> {c.telephone}
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          onClick={e => e.stopPropagation()}
                          style={{ color: 'var(--txt-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Mail size={12} /> {c.email}
                        </a>
                      )}
                      {c.ville && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} color="var(--txt-3)" /> {c.ville}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions & Fleche vers Fiche */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    title="Supprimer"
                    style={{ background: 'var(--red)15', border: '0.5px solid var(--red)30', borderRadius: '8px', padding: '7px 8px', cursor: 'pointer', color: 'var(--red)', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={14} />
                  </button>

                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold)'
                  }}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
