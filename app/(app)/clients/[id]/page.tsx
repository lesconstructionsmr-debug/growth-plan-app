'use client'

import { useParams } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft, Building2, User, Phone, Mail,
  MapPin, FileText, Receipt, Building,
  Edit3, Plus, ChevronRight, CheckCircle2,
  Clock, TrendingUp, MessageSquare, Send,
  Paperclip, Image, Bot, AlertCircle, Loader2,
  StickyNote, Trash2, Check, ExternalLink
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
type NoteType = 'note' | 'appel' | 'specification' | 'document' | 'rappel'

interface NoteEntry {
  id: string
  type: NoteType
  contenu: string
  created_at: string
  auteur_id: string | null
  profiles?: { full_name: string | null }
}

const NOTE_TYPES: { id: NoteType; label: string; color: string; bg: string }[] = [
  { id: 'note',          label: 'Note',          color: 'var(--txt-2)',  bg: 'var(--bg-3)' },
  { id: 'appel',         label: 'Appel',          color: 'var(--green)',  bg: 'rgba(52,211,153,0.1)' },
  { id: 'specification', label: 'Spécification',  color: '#A78BFA',       bg: 'rgba(167,139,250,0.12)' },
  { id: 'document',      label: 'Document',       color: '#60A5FA',       bg: 'rgba(96,165,250,0.12)' },
  { id: 'rappel',        label: 'Rappel',         color: 'var(--gold)',   bg: 'var(--ga)' },
]

function fmtNoteDate(s: string) {
  const d = new Date(s)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000)     return 'À l\'instant'
  if (diff < 3600000)   return `${Math.floor(diff/60000)} min`
  if (diff < 86400000)  return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  return d.toLocaleDateString('fr-CA', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
}

const fmtCAD = (n: number) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

// ── Journal panel ──────────────────────────────────────────────
function JournalPanel({ clientId }: { clientId: string }) {
  const [notes, setNotes]       = useState<NoteEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [contenu, setContenu]   = useState('')
  const [type, setType]         = useState<NoteType>('note')
  const [posting, setPosting]   = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/notes?client_id=${clientId}`)
      .then(r => r.json())
      .then(data => { setNotes(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [clientId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [notes])

  async function addNote() {
    if (!contenu.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, type, contenu: contenu.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const note = await res.json()
      setNotes(n => [...n, note])
      setContenu('')
    } catch {
      alert('Erreur lors de l\'ajout de la note')
    } finally {
      setPosting(false)
    }
  }

  async function deleteNote(id: string) {
    if (!confirm('Supprimer cette note ?')) return
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    setNotes(n => n.filter(x => x.id !== id))
  }

  const typeInfo = (t: NoteType) => NOTE_TYPES.find(x => x.id === t) ?? NOTE_TYPES[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div>Chargement du journal…</div>
          </div>
        )}
        {!loading && notes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px' }}>
            <StickyNote size={28} color="var(--txt-3)" strokeWidth={1.2} />
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '12px 0 0' }}>Aucune note pour ce client.<br/>Ajoutez votre premier appel, spécification ou note interne.</p>
          </div>
        )}
        {notes.map(note => {
          const ti = typeInfo(note.type)
          const auteur = note.profiles?.full_name ?? 'Vous'
          const initiales = auteur.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
          return (
            <div key={note.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '9px', position: 'relative' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold)' }}>{initiales}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{auteur}</span>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '6px', color: ti.color, background: ti.bg }}>
                    {ti.label}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--txt-3)', marginLeft: 'auto' }}>{fmtNoteDate(note.created_at)}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--txt-1)', margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{note.contenu}</p>
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: '2px', opacity: 0.5 }}
                title="Supprimer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '0', borderBottom: '0.5px solid var(--line)' }}>
          {NOTE_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              style={{
                flex: 1, padding: '8px 4px', fontSize: '11px', fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: type === t.id ? t.bg : 'transparent',
                color: type === t.id ? t.color : 'var(--txt-3)',
                borderBottom: type === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
          <textarea
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder="Écrire une note ou compte-rendu d'échange..."
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote() }}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--txt-1)', fontFamily: 'inherit', resize: 'none', minHeight: '72px', lineHeight: 1.6 }}
          />
          <button
            onClick={addNote}
            disabled={!contenu.trim() || posting}
            style={{ alignSelf: 'flex-end', width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: contenu.trim() && !posting ? 'var(--gold)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s', flexShrink: 0 }}
          >
            {posting ? <Loader2 size={13} color="var(--txt-3)" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} color={contenu.trim() ? '#0A0A0A' : 'var(--txt-3)'} />}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  de: 'moi' | 'client' | 'systeme'
  contenu: string
  date: Date
  lu: boolean
}

interface Client {
  id: string
  prenom: string
  nom: string
  entreprise?: string
  email: string
  telephone: string
  adresse: string
  ville: string
  province: string
  type: 'residential' | 'commercial'
  statut: 'actif' | 'inactif'
  valeur_totale: number
  nb_projets: number
  date_creation: string
}

const TABS = [
  { id: 'apercu',    label: 'Aperçu'    },
  { id: 'devis',     label: 'Devis'     },
  { id: 'factures',  label: 'Factures'  },
  { id: 'projets',   label: 'Chantiers' },
  { id: 'messages',  label: 'Chat / SMS' },
  { id: 'notes',     label: 'Notes & Journal' },
]

function ChatPanel({ client }: { client: Client }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', de: 'systeme', contenu: `Discussion ouverte avec ${client.prenom} ${client.nom} (${client.email})`, date: new Date(), lu: true }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!input.trim() || sending) return
    const msgText = input.trim()
    const msg: ChatMessage = { id: Date.now().toString(), de: 'moi', contenu: msgText, date: new Date(), lu: true }
    setMessages(m => [...m, msg])
    setInput('')
    setSending(true)

    // Envoi par courriel direct via API
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id, contenu: msgText }),
      })
    } catch {
      /* ignore */
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '520px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)' }}>{client.prenom[0]}{client.nom[0]}</span>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{client.prenom} {client.nom}</div>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{client.email}</div>
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
          Envoi direct par email
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '8px', flexDirection: msg.de === 'moi' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
            <div style={{ maxWidth: '75%' }}>
              <div style={{
                background: msg.de === 'moi' ? 'var(--ga)' : 'var(--bg-2)',
                border: `0.5px solid ${msg.de === 'moi' ? 'var(--gold-3)' : 'var(--line)'}`,
                borderRadius: msg.de === 'moi' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                padding: '9px 13px', fontSize: '12px', color: 'var(--txt-1)', lineHeight: 1.5,
              }}>
                {msg.contenu}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ padding: '12px 14px', borderTop: '0.5px solid var(--line)', background: 'var(--bg-1)' }}>
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Écrire un message direct à ${client.prenom}…`}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: input.trim() && !sending ? 'var(--gold)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={13} color={input.trim() && !sending ? '#0A0A0A' : 'var(--txt-3)'} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('apercu')
  const [client, setClient] = useState<Client | null>(null)
  const [clientLoading, setClientLoading] = useState(true)

  // Données liées
  const [devisList, setDevisList] = useState<any[]>([])
  const [facturesList, setFacturesList] = useState<any[]>([])
  const [jobsList, setJobsList] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadClientData = useCallback(async () => {
    if (!id) return
    setClientLoading(true)

    const [{ data: cData }, { data: devisData }, { data: facturesData }, { data: jobsData }] = await Promise.all([
      supabase.from('clients').select('id, nom, email, telephone, adresse, ville, province, created_at').eq('id', id).single(),
      supabase.from('devis').select('id, numero, titre, montant_ttc, statut, created_at').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('factures').select('id, numero, montant_ttc, statut, created_at').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('jobs').select('id, titre, budget, statut, created_at').eq('client_id', id).order('created_at', { ascending: false }),
    ])

    if (cData) {
      const parts = cData.nom.split(' ')
      const devisArr = devisData || []
      const facturesArr = facturesData || []
      const jobsArr = jobsData || []

      const totalValeur = facturesArr.reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

      setClient({
        id: cData.id,
        prenom: parts.slice(0, -1).join(' ') || cData.nom,
        nom: parts.length > 1 ? parts[parts.length - 1] : '',
        email: cData.email ?? '',
        telephone: cData.telephone ?? '',
        adresse: cData.adresse ?? '',
        ville: cData.ville ?? '',
        province: cData.province ?? 'QC',
        type: 'residential',
        statut: 'actif',
        valeur_totale: totalValeur,
        nb_projets: jobsArr.length,
        date_creation: cData.created_at?.split('T')[0] ?? '',
      })

      setDevisList(devisArr)
      setFacturesList(facturesArr)
      setJobsList(jobsArr)
    }

    setClientLoading(false)
  }, [id, supabase])

  useEffect(() => { loadClientData() }, [loadClientData])

  if (clientLoading && !client) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '8px', color: 'var(--txt-3)', fontSize: '13px' }}>
        <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement de la fiche client…
      </div>
    )
  }

  if (!client && !clientLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <a href="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={13} /> Retour aux clients
        </a>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
          <User size={32} color="var(--txt-3)" strokeWidth={1.2} />
          <p style={{ fontSize: '13px', color: 'var(--txt-3)', marginTop: '12px' }}>Client introuvable — ID: {id}</p>
        </div>
      </div>
    )
  }

  const c = client!

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Breadcrumb */}
      <a href="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
        <ArrowLeft size={13} /> Retour aux clients
      </a>

      {/* En-tête Fiche Client avec BOUTONS D'ACTION DIRECTS */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderTop: '3px solid var(--gold)', borderRadius: '12px', padding: '22px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold)' }}>{c.prenom[0]}{c.nom[0]}</span>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)' }}>{c.prenom} {c.nom}</div>
              {c.entreprise && <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>{c.entreprise}</div>}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: 'var(--green)', fontWeight: 700 }}>CLIENT ACTIF</span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-3)', color: 'var(--txt-3)' }}>{c.type === 'residential' ? 'Résidentiel' : 'Commercial'}</span>
              </div>
            </div>
          </div>

          {/* BARRE D'ACTIONS RAPIDES : NOUVEAU DEVIS / FACTURE / CHAT */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href={`/devis/nouveau?client_id=${c.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--gold)', color: '#0A0A0A',
                borderRadius: '8px', padding: '9px 14px', fontSize: '12px', fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Plus size={14} /> Nouveau devis
            </a>
            <a
              href={`/factures/nouvelle?client_id=${c.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--bg-2)', border: '1px solid var(--gold)',
                color: 'var(--gold-2)', borderRadius: '8px', padding: '9px 14px',
                fontSize: '12px', fontWeight: 700, textDecoration: 'none',
              }}
            >
              <Plus size={14} /> Nouvelle facture
            </a>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--bg-3)', border: '0.5px solid var(--line)',
                borderRadius: '8px', padding: '9px 14px', fontSize: '12px',
                color: 'var(--txt-1)', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <MessageSquare size={14} color="var(--gold)" /> Chat Client
            </button>
          </div>
        </div>

        {/* KPIs du Client */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '9px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Facturé</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gold-2)', marginTop: '2px' }}>{fmtCAD(c.valeur_totale)}</div>
          </div>
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '9px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Chantiers & Projets</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-1)', marginTop: '2px' }}>{c.nb_projets} projet(s)</div>
          </div>
          <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '9px', padding: '12px 16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Inscrit le</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-2)', marginTop: '4px' }}>{c.date_creation || 'Aujourd\'hui'}</div>
          </div>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-1)', borderRadius: '10px', padding: '4px', border: '0.5px solid var(--line)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '8px 12px', border: 'none', borderRadius: '7px',
              cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              background: activeTab === t.id ? 'var(--gold)20' : 'transparent',
              color: activeTab === t.id ? 'var(--gold-2)' : 'var(--txt-3)',
              borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'all 0.12s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu des Onglets */}

      {/* 1. APERÇU / INFOS */}
      {activeTab === 'apercu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--txt-2)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coordonnées & Informations</div>
            {[
              { icon: Mail,  label: 'Courriel',   value: c.email || 'Non renseigné' },
              { icon: Phone, label: 'Téléphone',  value: c.telephone || 'Non renseigné' },
              { icon: MapPin,label: 'Adresse',    value: c.adresse ? `${c.adresse}, ${c.ville} ${c.province}` : 'Non renseignée' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '0.5px solid var(--line)' }}>
                <r.icon size={14} color="var(--gold)" />
                <span style={{ fontSize: '11px', color: 'var(--txt-3)', minWidth: '80px' }}>{r.label}</span>
                <span style={{ fontSize: '12.5px', color: 'var(--txt-1)', fontWeight: 500 }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <Building2 size={32} color="var(--gold)" strokeWidth={1.2} />
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>Gestion intégrée du client</div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)', textAlign: 'center', maxWidth: '300px' }}>
              Créez des devis, factures ou discutez directement avec {c.prenom} via les onglets dédiés.
            </div>
          </div>
        </div>
      )}

      {/* 2. DEVIS DU CLIENT */}
      {activeTab === 'devis' && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Devis de {c.prenom} ({devisList.length})</h3>
            <a href={`/devis/nouveau?client_id=${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold)', color: '#0A0A0A', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
              <Plus size={12} /> Nouveau devis
            </a>
          </div>

          {devisList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--txt-3)', fontSize: '12px' }}>
              Aucun devis créé pour ce client pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {devisList.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{d.numero} — {d.titre}</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>Créé le {new Date(d.created_at).toLocaleDateString('fr-CA')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold-2)' }}>{fmtCAD(d.montant_ttc || 0)}</div>
                    <a href={`/devis/${d.id}`} style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: 'var(--txt-1)', textDecoration: 'none' }}>
                      Ouvrir →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. FACTURES DU CLIENT */}
      {activeTab === 'factures' && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Factures de {c.prenom} ({facturesList.length})</h3>
            <a href={`/factures/nouvelle?client_id=${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold)', color: '#0A0A0A', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
              <Plus size={12} /> Nouvelle facture
            </a>
          </div>

          {facturesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--txt-3)', fontSize: '12px' }}>
              Aucune facture émise pour ce client pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {facturesList.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{f.numero}</div>
                    <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>Émise le {new Date(f.created_at).toLocaleDateString('fr-CA')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>{fmtCAD(f.montant_ttc || 0)}</div>
                    <a href={`/factures/${f.id}`} style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: 'var(--txt-1)', textDecoration: 'none' }}>
                      Ouvrir →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. CHANTIERS / PROJETS DU CLIENT */}
      {activeTab === 'projets' && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '12px', overflow: 'hidden', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>Chantiers de {c.prenom} ({jobsList.length})</h3>
            <a href={`/jobs/nouveau?client_id=${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--gold)', color: '#0A0A0A', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, textDecoration: 'none' }}>
              <Plus size={12} /> Nouveau chantier
            </a>
          </div>

          {jobsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--txt-3)', fontSize: '12px' }}>
              Aucun chantier actif pour ce client pour le moment.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jobsList.map(j => (
                <div key={j.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '12px 16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>🔨 {j.titre}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-2)' }}>{fmtCAD(j.budget || 0)}</div>
                    <a href={`/jobs/${j.id}`} style={{ background: 'var(--bg-3)', border: '0.5px solid var(--line)', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', color: 'var(--txt-1)', textDecoration: 'none' }}>
                      Ouvrir →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. CHAT MESSAGERIE DU CLIENT */}
      {activeTab === 'messages' && (
        <ChatPanel client={c} />
      )}

      {/* 6. JOURNAL & NOTES DU CLIENT */}
      {activeTab === 'notes' && (
        <JournalPanel clientId={id as string} />
      )}
    </div>
  )
}
