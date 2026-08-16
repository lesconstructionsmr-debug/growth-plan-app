'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, MapPin, Calendar, Clock,
  Edit3, FileText, Receipt, CheckCircle2,
  Navigation, Users, DollarSign, AlertCircle,
  FolderOpen, Plus, ExternalLink, Loader2,
} from 'lucide-react'
import {
  DOSSIER_KIND_COLORS,
  DOSSIER_KIND_LABELS,
  type DossierTimelineEvent,
} from '@/lib/jobs/dossier'

type StatutProjet = 'brouillon' | 'en_attente' | 'en_cours' | 'en_pause' | 'termine' | 'annule'

interface PointageRow {
  id: string
  date: string
  heure_debut: string
  heure_fin: string | null
  duree_minutes: number | null
  dans_rayon_debut: boolean
  dans_rayon_fin: boolean
  notes: string | null
  approuve: boolean
  profiles?: { full_name: string | null } | null
}

interface DevisRow {
  id: string
  numero: string
  titre: string | null
  statut: string | null
  montant_ttc: number | null
  created_at: string
}

interface FactureRow {
  id: string
  numero: string
  titre: string | null
  statut: string | null
  montant_ttc: number | null
  created_at: string
}

interface JobDoc {
  id: string
  type: string
  titre: string
  file_url: string | null
  created_at: string
}

interface DossierData {
  job: {
    id: string
    titre: string
    statut: string
    description: string | null
    adresse_chantier: string | null
    ville_chantier: string | null
    date_debut: string | null
    date_fin_prevue: string | null
    budget: number | null
    couleur: string | null
    rayon_pointage_metres: number | null
    clients?: { nom: string; email: string | null } | null
  } | null
  timeline: DossierTimelineEvent[]
  devis: DevisRow[]
  factures: FactureRow[]
  pointages: PointageRow[]
  documents: JobDoc[]
  stats: {
    totalHeures: number
    heuresApprouvees: number
    depensesTotal: number | null
    nbDevis: number
    nbFactures: number
    nbDocuments: number
  }
}

const STATUT_CFG: Record<StatutProjet, { label: string; color: string; bg: string }> = {
  brouillon:  { label: 'Brouillon',  color: 'var(--txt-3)',  bg: 'var(--bg-3)'     },
  en_attente: { label: 'En attente', color: 'var(--amber)',  bg: 'var(--amber)18'  },
  en_cours:   { label: 'En cours',   color: 'var(--gold-2)', bg: 'var(--gold-3)'   },
  en_pause:   { label: 'En pause',   color: 'var(--purple)', bg: 'var(--purple)18' },
  termine:    { label: 'Terminé',    color: 'var(--green)',  bg: 'var(--green)18'  },
  annule:     { label: 'Annulé',     color: 'var(--red)',    bg: 'var(--red)18'    },
}

const TABS = [
  { id: 'dossier',   label: 'Dossier'   },
  { id: 'apercu',    label: 'Aperçu'    },
  { id: 'pointage',  label: 'Pointage'  },
  { id: 'devis',     label: 'Devis'     },
  { id: 'factures',  label: 'Factures'  },
  { id: 'documents', label: 'Documents' },
]

const fmt = (n: number) => n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })
const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtDuree = (min: number) => `${Math.floor(min / 60)}h${(min % 60).toString().padStart(2, '0')}`

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState('dossier')
  const [isAdmin, setIsAdmin] = useState(true)
  const [loading, setLoading] = useState(true)
  const [dossier, setDossier] = useState<DossierData | null>(null)
  const [punching, setPunching] = useState(false)
  const [docForm, setDocForm] = useState({ titre: '', type: 'document', file_url: '' })
  const [addingDoc, setAddingDoc] = useState(false)

  const loadDossier = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/jobs/${id}/dossier`)
      if (res.ok) setDossier(await res.json())
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => setIsAdmin(d.role === 'owner' || d.role === 'admin'))
      .catch(() => {})
  }, [])

  useEffect(() => { loadDossier() }, [loadDossier])

  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter(t => ['dossier', 'apercu', 'pointage', 'documents'].includes(t.id))

  const projet = dossier?.job
  const pointages = dossier?.pointages ?? []
  const cfg = STATUT_CFG[(projet?.statut as StatutProjet) ?? 'en_attente'] ?? STATUT_CFG.en_attente

  async function toggleApprouver(pointageId: string, approuve: boolean) {
    await fetch(`/api/jobs/${id}/pointages`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointage_id: pointageId, approuve: !approuve }),
    })
    loadDossier()
  }

  async function handlePunch() {
    setPunching(true)
    try {
      const now = new Date()
      const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      await fetch(`/api/jobs/${id}/pointages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heure_debut: heure, heure_fin: heure, notes: 'Punch rapide' }),
      })
      loadDossier()
    } finally {
      setPunching(false)
    }
  }

  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!docForm.titre.trim()) return
    setAddingDoc(true)
    try {
      await fetch(`/api/jobs/${id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docForm),
      })
      setDocForm({ titre: '', type: 'document', file_url: '' })
      loadDossier()
    } finally {
      setAddingDoc(false)
    }
  }

  const card: React.CSSProperties = { background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '16px 18px' }
  const btn2: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '7px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer', fontFamily: 'inherit' }

  if (loading && !dossier) {
    return (
      <div style={{ padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--txt-3)' }}>
        <Loader2 size={18} className="spin" /> Chargement du dossier…
      </div>
    )
  }

  if (!projet) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--txt-3)' }}>
        Chantier introuvable ou accès refusé.
      </div>
    )
  }

  const clientNom = (projet.clients as { nom?: string } | null)?.nom ?? '—'
  const stats = dossier?.stats

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1000px' }}>

      <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
        <ArrowLeft size={13} /> Jobs / Projets
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: projet.couleur ?? '#B8922A', marginTop: '6px', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>{projet.titre}</h1>
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={11} />{clientNom}</span>
              {projet.ville_chantier && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} />{projet.ville_chantier}</span>}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--gold)', margin: '6px 0 0', fontWeight: 500 }}>
              Un chantier, un dossier — plan → soumission → extra → facturation
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isAdmin && (
            <button onClick={handlePunch} disabled={punching} style={{ ...btn2, border: '0.5px solid var(--green)', color: 'var(--green)' }}>
              <Clock size={13} /> {punching ? 'Enregistrement…' : 'Punch'}
            </button>
          )}
          {isAdmin && <button style={btn2}><Edit3 size={13} /> Modifier</button>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { icon: DollarSign, label: 'Budget', val: projet.budget ? fmt(Number(projet.budget)) : '—', color: 'var(--gold)', hide: !isAdmin },
          { icon: FileText, label: 'Devis', val: String(stats?.nbDevis ?? 0), color: 'var(--blue)' },
          { icon: Receipt, label: 'Factures', val: String(stats?.nbFactures ?? 0), color: 'var(--green)', hide: !isAdmin },
          { icon: Clock, label: 'Heures', val: fmtDuree(stats?.totalHeures ?? 0), color: 'var(--blue)' },
        ].filter(s => !s.hide).map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Icon size={13} color={s.color} />
                <span style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</span>
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: s.color }}>{s.val}</div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '0.5px solid var(--line)', overflowX: 'auto' }}>
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap',
            color: tab === t.id ? 'var(--gold-2)' : 'var(--txt-3)',
            borderBottom: tab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
            fontWeight: tab === t.id ? 600 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Dossier — timeline unifiée */}
      {tab === 'dossier' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FolderOpen size={16} color="var(--gold)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Flux documentaire du chantier</span>
          </div>
          {(dossier?.timeline ?? []).length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Aucun événement pour l&apos;instant.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(dossier?.timeline ?? []).map((ev, i) => (
                <div key={ev.id} style={{ display: 'flex', gap: '14px', padding: '12px 0', borderBottom: i < (dossier?.timeline.length ?? 0) - 1 ? '0.5px solid var(--line)' : 'none' }}>
                  <div style={{ width: '10px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DOSSIER_KIND_COLORS[ev.kind], marginTop: '4px' }} />
                    {i < (dossier?.timeline.length ?? 0) - 1 && <div style={{ width: '1px', flex: 1, background: 'var(--line)', marginTop: '4px' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: DOSSIER_KIND_COLORS[ev.kind], letterSpacing: '0.04em' }}>
                        {DOSSIER_KIND_LABELS[ev.kind].toUpperCase()}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{fmtDate(ev.date)}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginTop: '2px' }}>{ev.titre}</div>
                    {ev.sousTitre && <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>{ev.sousTitre}</div>}
                    {ev.montant != null && isAdmin && (
                      <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600, marginTop: '4px' }}>{fmt(ev.montant)}</div>
                    )}
                    {ev.href && ev.kind !== 'document' && (
                      <Link href={ev.href} style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Voir <ExternalLink size={10} />
                      </Link>
                    )}
                    {ev.href && ev.kind === 'document' && (
                      <a href={ev.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Ouvrir <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aperçu */}
      {tab === 'apercu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={card}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '12px' }}>CHANTIER</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
              <MapPin size={14} color="var(--txt-3)" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 600 }}>{projet.adresse_chantier ?? '—'}</div>
                <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{projet.ville_chantier ?? ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={12} color="var(--txt-3)" />
              <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Rayon de pointage: {projet.rayon_pointage_metres ?? 200}m</span>
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '12px' }}>CALENDRIER</div>
            {projet.date_debut && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={13} color="var(--txt-3)" />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Début</div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{fmtDate(projet.date_debut)}</div>
                </div>
              </div>
            )}
            {projet.date_fin_prevue && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={13} color="var(--txt-3)" />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Fin prévue</div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{fmtDate(projet.date_fin_prevue)}</div>
                </div>
              </div>
            )}
          </div>
          {projet.description && (
            <div style={{ ...card, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>DESCRIPTION</div>
              <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>{projet.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Pointage */}
      {tab === 'pointage' && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Pointages du chantier</span>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
              {pointages.filter(p => p.approuve).length}/{pointages.length} approuvés
            </div>
          </div>
          {pointages.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)' }}>Aucun pointage enregistré.</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 100px 100px 80px 80px 1fr 100px', padding: '8px 18px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-2)' }}>
                {['EMPLOYÉ', 'DATE', 'DÉBUT', 'FIN', 'DURÉE', 'NOTES', 'STATUT'].map(h => (
                  <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {pointages.map((p, i) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '130px 100px 100px 80px 80px 1fr 100px',
                  padding: '11px 18px', alignItems: 'center',
                  borderBottom: i < pointages.length - 1 ? '0.5px solid var(--line)' : 'none',
                  background: p.approuve ? 'transparent' : 'var(--amber)06',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--txt-1)', fontWeight: 600 }}>{p.profiles?.full_name ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-2)' }}>{new Date(p.date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{p.heure_debut?.slice(0, 5)}</span>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.dans_rayon_debut ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{p.heure_fin?.slice(0, 5) ?? '—'}</span>
                    {p.heure_fin && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.dans_rayon_fin ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--txt-2)', fontWeight: 600 }}>{fmtDuree(p.duree_minutes ?? 0)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{p.notes ?? '—'}</div>
                  {isAdmin ? (
                    <button
                      onClick={() => toggleApprouver(p.id, p.approuve)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px', background: 'none',
                        border: `0.5px solid ${p.approuve ? 'var(--green)' : 'var(--amber)'}`,
                        borderRadius: '7px', padding: '4px 8px', fontSize: '10px', fontWeight: 600,
                        color: p.approuve ? 'var(--green)' : 'var(--amber)', cursor: 'pointer',
                      }}
                    >
                      {p.approuve ? <><CheckCircle2 size={11} /> Approuvé</> : <><AlertCircle size={11} /> Approuver</>}
                    </button>
                  ) : (
                    <span style={{ fontSize: '10px', color: p.approuve ? 'var(--green)' : 'var(--txt-3)' }}>
                      {p.approuve ? 'Approuvé' : 'En attente'}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
          <div style={{ padding: '12px 18px', borderTop: '0.5px solid var(--line)', background: 'var(--bg-2)', display: 'flex', gap: '24px' }}>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Total: <strong style={{ color: 'var(--txt-1)' }}>{fmtDuree(stats?.totalHeures ?? 0)}</strong></div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Approuvé: <strong style={{ color: 'var(--green)' }}>{fmtDuree(stats?.heuresApprouvees ?? 0)}</strong></div>
          </div>
        </div>
      )}

      {/* Devis */}
      {tab === 'devis' && isAdmin && (
        <div style={card}>
          {(dossier?.devis ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <FileText size={28} color="var(--txt-3)" strokeWidth={1} style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>Aucun devis lié à ce chantier.</div>
              <Link href={`/devis/nouveau?job_id=${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '12px', fontSize: '12px', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                + Créer un devis
              </Link>
            </div>
          ) : (
            (dossier?.devis ?? []).map(d => (
              <Link key={d.id} href={`/devis/${d.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid var(--line)', textDecoration: 'none' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{d.numero} — {d.titre ?? 'Sans titre'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{d.statut} · {fmtDate(d.created_at)}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)' }}>{d.montant_ttc != null ? fmt(Number(d.montant_ttc)) : '—'}</div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Factures */}
      {tab === 'factures' && isAdmin && (
        <div style={card}>
          {(dossier?.factures ?? []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <Receipt size={28} color="var(--txt-3)" strokeWidth={1} style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>Aucune facture liée à ce chantier.</div>
              <Link href="/factures/nouvelle" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '12px', fontSize: '12px', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>
                + Créer une facture
              </Link>
            </div>
          ) : (
            (dossier?.factures ?? []).map(f => (
              <Link key={f.id} href={`/factures/${f.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid var(--line)', textDecoration: 'none' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{f.numero} — {f.titre ?? 'Sans titre'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{f.statut} · {fmtDate(f.created_at)}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>{f.montant_ttc != null ? fmt(Number(f.montant_ttc)) : '—'}</div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isAdmin && (
            <form onSubmit={handleAddDoc} style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Titre</label>
                <input value={docForm.titre} onChange={e => setDocForm(p => ({ ...p, titre: e.target.value }))} placeholder="Plan cuisine v2" style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '8px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>Type</label>
                <select value={docForm.type} onChange={e => setDocForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '8px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontFamily: 'inherit' }}>
                  {['plan', 'photo', 'mesure', 'extra', 'document', 'autre'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--txt-3)', display: 'block', marginBottom: '4px' }}>URL du fichier</label>
                <input value={docForm.file_url} onChange={e => setDocForm(p => ({ ...p, file_url: e.target.value }))} placeholder="https://…" style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '8px', border: '0.5px solid var(--line)', background: 'var(--bg-2)', color: 'var(--txt-1)', fontFamily: 'inherit' }} />
              </div>
              <button type="submit" disabled={addingDoc} style={{ ...btn2, border: '0.5px solid var(--gold)', color: 'var(--gold)', height: '36px' }}>
                <Plus size={13} /> {addingDoc ? '…' : 'Ajouter'}
              </button>
            </form>
          )}
          <div style={card}>
            {(dossier?.documents ?? []).length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0, textAlign: 'center', padding: '24px' }}>Aucun document dans le dossier.</p>
            ) : (
              (dossier?.documents ?? []).map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{doc.titre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{doc.type} · {fmtDate(doc.created_at)}</div>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Ouvrir <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
