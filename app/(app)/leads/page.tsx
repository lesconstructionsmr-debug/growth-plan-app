'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  TrendingUp, Plus, MessageCircle, FileText,
  Building2, User, Phone, Mail, Calendar,
  ChevronDown, MoreHorizontal, GripVertical, X, Loader2, ArrowRight
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

const COLONNES: { id: StatutPipeline; label: string; color: string; icon: React.ElementType }[] = [
  { id: 'nouveau',     label: 'Nouveau lead',  color: 'var(--txt-3)', icon: MessageCircle },
  { id: 'contacté',   label: 'Contacté',      color: 'var(--amber)', icon: FileText      },
  { id: 'qualifié',   label: 'Qualifié',      color: 'var(--blue)',  icon: FileText      },
  { id: 'proposition',label: 'Proposition',   color: 'var(--purple)',icon: Calendar      },
  { id: 'gagné',      label: 'Gagné ✓',       color: 'var(--green)', icon: Building2     },
  { id: 'perdu',      label: 'Perdu',         color: 'var(--red)',   icon: Building2     },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [source, setSource] = useState('site_web')
  const [valeurEstimee, setValeurEstimee] = useState('')
  const [notes, setNotes] = useState('')

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
        statut: l.statut as StatutPipeline,
        priorite: 'normale' as const,
      })))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (!profile?.company_id) throw new Error('Entreprise introuvable')

      const { error } = await supabase
        .from('leads')
        .insert({
          company_id: profile.company_id,
          nom: nom.trim(),
          email: email.trim() || null,
          telephone: telephone.trim() || null,
          source: source || 'site_web',
          valeur_estimee: valeurEstimee ? parseFloat(valeurEstimee) : null,
          statut: 'nouveau',
          notes: notes.trim() || null,
        })

      if (error) throw error

      setNom('')
      setEmail('')
      setTelephone('')
      setSource('site_web')
      setValeurEstimee('')
      setNotes('')
      setShowModal(false)
      await loadLeads()
    } catch (err) {
      console.error('[handleAddLead]', err)
      alert('Erreur lors de l\'ajout du lead')
    } finally {
      setSaving(false)
    }
  }

  async function updateLeadStatus(leadId: string, newStatut: StatutPipeline) {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ statut: newStatut })
        .eq('id', leadId)

      if (error) throw error
      await loadLeads()
    } catch (err) {
      console.error('[updateLeadStatus]', err)
      alert('Erreur lors du déplacement du lead')
    }
  }

  const totalPipeline = leads.reduce((s, l) => s + (l.montant_estime ?? 0), 0)

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={18} color="var(--gold)" />
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--txt-1)', margin: 0 }}>Pipeline CRM</h1>
          <span style={{
            fontSize: '11px', color: 'var(--txt-3)',
            background: 'var(--bg-3)', borderRadius: '5px', padding: '2px 7px',
          }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </span>
          {totalPipeline > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--gold-2)', fontWeight: 600 }}>
              · {totalPipeline.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--gold)', borderRadius: '8px', padding: '8px 14px',
            fontSize: '12px', fontWeight: 600, color: '#0A0A0A', border: 'none', cursor: 'pointer',
          }}
        >
          <Plus size={13} /> Nouveau lead
        </button>
      </div>

      {/* Kanban — scroll horizontal */}
      {loading && leads.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '8px', color: 'var(--txt-3)' }}>
          <Loader2 size={16} className="animate-spin" />
          Chargement du pipeline...
        </div>
      ) : (
        <div style={{
          display: 'flex', gap: '12px', overflowX: 'auto',
          paddingBottom: '12px', flex: 1,
        }}>
          {COLONNES.map(col => {
            const colLeads = leads.filter(l => l.statut === col.id)
            const totalCol = colLeads.reduce((s, l) => s + (l.montant_estime ?? 0), 0)

            return (
              <div key={col.id} style={{ width: '250px', minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Header colonne */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', background: 'var(--bg-1)', border: '0.5px solid var(--line)',
                  borderRadius: '8px', borderTop: `2px solid ${col.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)' }}>{col.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--txt-3)', background: 'var(--bg-3)', borderRadius: '4px', padding: '1px 5px' }}>
                      {colLeads.length}
                    </span>
                  </div>
                </div>

                {/* Total colonne */}
                {totalCol > 0 && (
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', textAlign: 'center' }}>
                    {totalCol.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                  </div>
                )}

                {/* Cards list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
                  {colLeads.map(lead => (
                    <div key={lead.id} style={{
                      background: 'var(--bg-1)', border: '0.5px solid var(--line)',
                      borderRadius: '9px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--txt-1)' }}>{lead.nom}</div>
                          {lead.entreprise && (
                            <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginTop: '2px', background: 'var(--bg-3)', padding: '1px 4px', borderRadius: '4px', display: 'inline-block' }}>
                              {lead.entreprise}
                            </div>
                          )}
                        </div>
                      </div>

                      {(lead.telephone || lead.email) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {lead.telephone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--txt-3)' }}>
                              <Phone size={9} /> {lead.telephone}
                            </div>
                          )}
                          {lead.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: 'var(--txt-3)' }}>
                              <Mail size={9} /> {lead.email}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        {lead.montant_estime ? (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)' }}>
                            {lead.montant_estime.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>—</span>
                        )}
                        <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>
                          {new Date(lead.date_creation).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {/* Status changer dropdown/button */}
                      <div style={{ borderTop: '0.5px solid var(--line)', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '9px', color: 'var(--txt-3)' }}>Changer d'étape :</span>
                        <select
                          value={lead.statut}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as StatutPipeline)}
                          style={{
                            background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '5px',
                            fontSize: '9px', color: 'var(--txt-2)', padding: '2px 4px', outline: 'none'
                          }}
                        >
                          {COLONNES.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div style={{ border: '1px dashed var(--line)', borderRadius: '9px', padding: '24px 12px', textAlign: 'center', fontSize: '10px', color: 'var(--txt-3)' }}>
                      Aucun lead
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL AJOUT LEAD */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <form onSubmit={handleAddLead} style={{
            background: 'var(--bg-1)', border: '0.5px solid var(--line)',
            borderRadius: '12px', width: '100%', maxWidth: '440px', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Créer un nouveau lead</span>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Nom du contact *</label>
                <input
                  type="text" required value={nom} onChange={e => setNom(e.target.value)}
                  placeholder="Jean Tremblay"
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Téléphone</label>
                  <input
                    type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                    placeholder="514-555-0100"
                    style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Courriel</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="jean@exemple.com"
                    style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Source / Canal</label>
                  <select
                    value={source} onChange={e => setSource(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  >
                    <option value="site_web">Site Web</option>
                    <option value="google">Google</option>
                    <option value="facebook">Facebook Ads</option>
                    <option value="référence">Référence</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Valeur estimée ($ CAD)</label>
                  <input
                    type="number" value={valeurEstimee} onChange={e => setValeurEstimee(e.target.value)}
                    placeholder="5000"
                    style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Notes de qualification</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Projet de peinture résidentielle..." rows={3}
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '9px 12px', fontSize: '12px', color: 'var(--txt-1)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '0.5px solid var(--line)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer' }}>Annuler</button>
              <button type="submit" disabled={saving} style={{ background: 'var(--gold)', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {saving ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
