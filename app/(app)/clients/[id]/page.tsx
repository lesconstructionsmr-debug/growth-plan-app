'use client'

import { useParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft, Building2, User, Phone, Mail,
  MapPin, FileText, Receipt, Building,
  Edit3, Plus, ChevronRight, CheckCircle2,
  Clock, TrendingUp, MessageSquare, Send,
  Paperclip, Image, Bot, AlertCircle, Loader2,
  Phone as PhoneIcon, StickyNote, BookOpen, FileCheck, Bell, Trash2
} from 'lucide-react'

// ── Types notes ────────────────────────────────────────────────
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

// ── Journal panel ──────────────────────────────────────────────
function JournalPanel({ clientId }: { clientId: string }) {
  const [notes,    setNotes]    = useState<NoteEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [contenu,  setContenu]  = useState('')
  const [type,     setType]     = useState<NoteType>('note')
  const [posting,  setPosting]  = useState(false)
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

      {/* Fil du journal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--txt-3)', fontSize: '12px' }}>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div>Chargement du journal…</div>
          </div>
        )}
        {!loading && notes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px' }}>
            <StickyNote size={28} color="var(--bg-4)" strokeWidth={1.2} />
            <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: '12px 0 0' }}>Aucune note pour ce client.<br/>Ajoutez votre premier appel, spec ou note interne.</p>
          </div>
        )}
        {notes.map(note => {
          const ti = typeInfo(note.type)
          const auteur = note.profiles?.full_name ?? 'Vous'
          const initiales = auteur.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
          return (
            <div key={note.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '9px', position: 'relative' }}>
              {/* Avatar auteur */}
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

      {/* Formulaire ajout */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>
        {/* Sélecteur de type */}
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
        {/* Textarea */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
          <textarea
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder={
              type === 'appel'         ? 'Résumé de l\'appel — qui a été contacté, ce qui a été discuté…' :
              type === 'specification' ? 'Spécification technique ou préférence du client…' :
              type === 'document'      ? 'Document reçu ou envoyé — nommer le fichier et décrire…' :
              type === 'rappel'        ? 'Rappel à effectuer — date, action, responsable…' :
              'Note interne — visible uniquement par votre équipe…'
            }
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
        <div style={{ fontSize: '9px', color: 'var(--txt-3)', padding: '0 12px 8px', textAlign: 'right' }}>Ctrl+Entrée pour envoyer</div>
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
  type?: 'texte' | 'devis' | 'facture' | 'rappel'
  meta?: { numero?: string; montant?: number; lien?: string }
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

// ── Mock data ──────────────────────────────────────────────────
const MOCK_CLIENTS: Record<string, Client> = {
  '1': { id:'1', prenom:'Jean', nom:'Tremblay', email:'jean.tremblay@gmail.com', telephone:'514-555-0101', adresse:'245 av. des Pins', ville:'Montréal', province:'QC', type:'residential', statut:'actif', valeur_totale:43200, nb_projets:3, date_creation:'2025-03-12' },
  '2': { id:'2', prenom:'Marie', nom:'Gagnon', email:'marie.gagnon@outlook.com', telephone:'418-555-0234', adresse:'88 ch. des Quatre-Bourgeois', ville:'Québec', province:'QC', type:'residential', statut:'actif', valeur_totale:28500, nb_projets:2, date_creation:'2025-07-08' },
  '3': { id:'3', prenom:'Pierre', nom:'Bouchard', entreprise:'Immeubles PB inc.', email:'p.bouchard@immeublespb.com', telephone:'450-555-0388', adresse:'1200 boul. Industriel', ville:'Laval', province:'QC', type:'commercial', statut:'actif', valeur_totale:112000, nb_projets:5, date_creation:'2024-11-20' },
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id:'1', de:'systeme', contenu:'Fiche client créée', date: new Date('2026-06-10T09:00:00'), lu:true, type:'texte' },
  { id:'2', de:'systeme', contenu:'Devis DEV-2026-001 envoyé — Rénovation cuisine complète · 19 847 $', date: new Date('2026-06-10T10:15:00'), lu:true, type:'devis', meta:{ numero:'DEV-2026-001', montant:19847, lien:'/devis/1' } },
  { id:'3', de:'client', contenu:'Bonjour, merci pour le devis. Est-ce que le prix inclut l\'installation des comptoirs en quartz ?', date: new Date('2026-06-11T14:32:00'), lu:true },
  { id:'4', de:'moi', contenu:'Bonjour Jean ! Oui, l\'installation des comptoirs en quartz est incluse dans le poste "Comptoirs et dosseret" à la ligne 3 du devis. N\'hésitez pas si vous avez d\'autres questions !', date: new Date('2026-06-11T16:05:00'), lu:true },
  { id:'5', de:'client', contenu:'Parfait merci ! On approuve le devis.', date: new Date('2026-06-12T09:18:00'), lu:true },
  { id:'6', de:'systeme', contenu:'Devis DEV-2026-001 approuvé ✓ — Facture FAC-2026-001 générée automatiquement', date: new Date('2026-06-12T09:20:00'), lu:true, type:'facture', meta:{ numero:'FAC-2026-001', montant:19847, lien:'/factures/1' } },
  { id:'7', de:'systeme', contenu:'📅 Rappel envoyé — Facture FAC-2026-001 en attente de paiement (échéance dans 3 jours)', date: new Date('2026-06-27T08:00:00'), lu:false, type:'rappel' },
]

const TABS = [
  { id: 'apercu',    label: 'Aperçu'    },
  { id: 'devis',     label: 'Devis'     },
  { id: 'factures',  label: 'Factures'  },
  { id: 'projets',   label: 'Projets'   },
  { id: 'messages',  label: 'Messages'  },
  { id: 'notes',     label: 'Notes'     },
]

function fmtDate(d: Date) {
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'À l\'instant'
  if (diff < 3600000) return `${Math.floor(diff/60000)} min`
  if (diff < 86400000) return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  return d.toLocaleDateString('fr-CA', { day:'numeric', month:'short' })
}

function fmtCAD(n: number) {
  return n.toLocaleString('fr-CA', { style:'currency', currency:'CAD', maximumFractionDigits:0 })
}

// ── Chat panel ────────────────────────────────────────────────
function ChatPanel({ client }: { client: Client }) {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function autoResize() {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
  }

  async function sendMessage() {
    if (!input.trim() || sending) return
    const msg: ChatMessage = { id: Date.now().toString(), de: 'moi', contenu: input.trim(), date: new Date(), lu: true }
    setMessages(m => [...m, msg])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSending(true)
    // TODO: POST /api/messages + envoyer email au client via Resend
    // await fetch('/api/messages', { method:'POST', body: JSON.stringify({ client_id: client.id, contenu: msg.contenu }) })
    await new Promise(r => setTimeout(r, 600))
    setSending(false)
  }

  const nonLus = messages.filter(m => m.de === 'client' && !m.lu).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)' }}>{client.prenom[0]}{client.nom[0]}</span>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{client.prenom} {client.nom}</div>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>{client.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {nonLus > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--gold)', color: '#0A0A0A', borderRadius: '10px', padding: '2px 7px' }}>{nonLus} non lu{nonLus > 1 ? 's' : ''}</span>
          )}
          <div style={{ fontSize: '10px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
            Répond via email
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map(msg => {
          if (msg.de === 'systeme') {
            const isDevis = msg.type === 'devis'
            const isFacture = msg.type === 'facture'
            const isRappel = msg.type === 'rappel'
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  background: isDevis ? 'rgba(201,168,76,0.08)' : isFacture ? 'rgba(34,197,94,0.08)' : isRappel ? 'rgba(251,146,60,0.08)' : 'var(--bg-2)',
                  border: `0.5px solid ${isDevis ? 'var(--gold-3)' : isFacture ? 'rgba(34,197,94,0.25)' : isRappel ? 'rgba(251,146,60,0.3)' : 'var(--line)'}`,
                  borderRadius: '7px', padding: '7px 14px',
                  fontSize: '11px', color: 'var(--txt-2)',
                  display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '480px',
                }}>
                  {isDevis && <FileText size={12} color="var(--gold)" />}
                  {isFacture && <Receipt size={12} color="var(--green)" />}
                  {isRappel && <AlertCircle size={12} color="var(--amber)" />}
                  {!isDevis && !isFacture && !isRappel && <Bot size={12} color="var(--txt-3)" />}
                  <span>{msg.contenu}</span>
                  {msg.meta?.lien && (
                    <a href={msg.meta.lien} style={{ fontSize: '10px', color: isDevis ? 'var(--gold-2)' : 'var(--green)', textDecoration: 'none', fontWeight: 600, flexShrink: 0 }}>Voir →</a>
                  )}
                  <span style={{ fontSize: '9px', color: 'var(--txt-3)', flexShrink: 0, marginLeft: 'auto' }}>{fmtDate(msg.date)}</span>
                </div>
              </div>
            )
          }

          const isMoi = msg.de === 'moi'
          return (
            <div key={msg.id} style={{ display: 'flex', gap: '8px', flexDirection: isMoi ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              {!isMoi && (
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg-3)', border: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-2)' }}>{client.prenom[0]}</span>
                </div>
              )}
              <div style={{ maxWidth: '68%' }}>
                <div style={{
                  background: isMoi ? 'var(--ga)' : 'var(--bg-2)',
                  border: `0.5px solid ${isMoi ? 'var(--gold-3)' : 'var(--line)'}`,
                  borderRadius: isMoi ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                  padding: '9px 13px', fontSize: '12px', color: 'var(--txt-1)', lineHeight: 1.5,
                }}>
                  {msg.contenu}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginTop: '3px', textAlign: isMoi ? 'right' : 'left' }}>
                  {fmtDate(msg.date)}{isMoi && ' · Envoyé par email'}
                </div>
              </div>
            </div>
          )
        })}

        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '12px 2px 12px 12px', padding: '9px 13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={11} color="var(--gold)" style={{ animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Envoi…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Saisie */}
      <div style={{ padding: '12px 14px', borderTop: '0.5px solid var(--line)', flexShrink: 0, background: 'var(--bg-1)' }}>
        <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '10px 12px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={`Écrire à ${client.prenom}… (sera envoyé par email)`}
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: 'var(--txt-1)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)', padding: '4px', display: 'flex', alignItems: 'center' }}>
              <Paperclip size={14} />
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: input.trim() && !sending ? 'var(--gold)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
            >
              <Send size={13} color={input.trim() && !sending ? '#0A0A0A' : 'var(--txt-3)'} />
            </button>
          </div>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--txt-3)', marginTop: '5px', textAlign: 'center' }}>
          Votre message sera envoyé par email à {client.email} · Les réponses du client apparaissent ici automatiquement
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('apercu')
  const [client, setClient] = useState<Client | null>(MOCK_CLIENTS[id as string] ?? null)
  const [clientLoading, setClientLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('clients')
      .select('id, nom, email, telephone, adresse, ville, province, created_at')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          const parts = data.nom.split(' ')
          setClient({
            id: data.id,
            prenom: parts.slice(0, -1).join(' ') || data.nom,
            nom: parts.length > 1 ? parts[parts.length - 1] : '',
            email: data.email ?? '',
            telephone: data.telephone ?? '',
            adresse: data.adresse ?? '',
            ville: data.ville ?? '',
            province: data.province ?? 'QC',
            type: 'residential',
            statut: 'actif',
            valeur_totale: 0,
            nb_projets: 0,
            date_creation: data.created_at?.split('T')[0] ?? '',
          })
        }
        setClientLoading(false)
      })
  }, [id])

  if (clientLoading && !client) {
    return <div style={{ padding: '24px', color: 'var(--txt-3)', fontSize: '13px' }}>Chargement…</div>
  }

  if (!client && !clientLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <a href="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={13} /> Clients
        </a>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
          <User size={32} color="var(--bg-4)" strokeWidth={1.2} />
          <p style={{ fontSize: '13px', color: 'var(--txt-3)', marginTop: '12px' }}>Client introuvable — ID: {id}</p>
        </div>
      </div>
    )
  }

  const c = client!
  const nonLusCount = MOCK_MESSAGES.filter(m => m.de === 'client' && !m.lu).length

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>

      {/* Breadcrumb */}
      <a href="/clients" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
        <ArrowLeft size={13} /> Clients
      </a>

      {/* En-tête client */}
      <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderTop: '2px solid var(--gold-3)', borderRadius: '10px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>{c.prenom[0]}{c.nom[0]}</span>
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-1)' }}>{c.prenom} {c.nom}</div>
              {c.entreprise && <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>{c.entreprise}</div>}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', fontWeight: 600 }}>ACTIF</span>
                <span style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px', background: 'var(--bg-3)', color: 'var(--txt-3)' }}>{c.type === 'residential' ? 'Résidentiel' : 'Commercial'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setActiveTab('messages')} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer' }}>
              <MessageSquare size={13} /> Message
              {nonLusCount > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--gold)', color: '#0A0A0A', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nonLusCount}</span>}
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', color: 'var(--gold-2)', cursor: 'pointer' }}>
              <Edit3 size={13} /> Modifier
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          {[
            { label: 'Valeur totale', value: fmtCAD(c.valeur_totale), color: 'var(--gold)' },
            { label: 'Projets', value: `${c.nb_projets}`, color: 'var(--txt-1)' },
            { label: 'Client depuis', value: new Date(c.date_creation || Date.now()).toLocaleDateString('fr-CA', { year:'numeric', month:'short' }), color: 'var(--txt-1)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '10px 14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '17px', fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-1)', borderRadius: '10px', padding: '4px', border: '0.5px solid var(--line)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '7px 8px', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: activeTab === t.id ? 'var(--bg-3)' : 'transparent', color: activeTab === t.id ? 'var(--txt-1)' : 'var(--txt-3)', transition: 'all 0.12s', position: 'relative' }}>
            {t.label}
            {t.id === 'messages' && nonLusCount > 0 && (
              <span style={{ position: 'absolute', top: '3px', right: '6px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--gold)', color: '#0A0A0A', fontSize: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{nonLusCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Contenu onglets */}

      {activeTab === 'apercu' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coordonnées</div>
            {[
              { icon: Mail,  label: 'Courriel',   value: c.email },
              { icon: Phone, label: 'Téléphone',  value: c.telephone },
              { icon: MapPin,label: 'Adresse',    value: `${c.adresse}, ${c.ville} ${c.province}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '0.5px solid var(--line)' }}>
                <r.icon size={13} color="var(--txt-3)" />
                <span style={{ fontSize: '11px', color: 'var(--txt-3)', minWidth: '70px' }}>{r.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Activité récente</div>
            {MOCK_MESSAGES.slice(-4).reverse().map(m => (
              <div key={m.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '7px 0', borderBottom: '0.5px solid var(--line)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.de === 'client' ? 'var(--gold)' : m.de === 'systeme' ? 'var(--blue)' : 'var(--green)', marginTop: '5px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--txt-1)', lineHeight: 1.4 }}>{m.contenu.length > 60 ? m.contenu.slice(0, 60) + '…' : m.contenu}</div>
                  <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '2px' }}>{fmtDate(m.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'messages' && <ChatPanel client={c} />}

      {activeTab === 'devis' && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <FileText size={28} color="var(--bg-4)" strokeWidth={1.2} />
          <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Devis du client</p>
          <a href="/devis/nouveau" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', color: 'var(--gold-2)', textDecoration: 'none' }}>
            <Plus size={11} /> Nouveau devis
          </a>
        </div>
      )}

      {activeTab === 'factures' && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Receipt size={28} color="var(--bg-4)" strokeWidth={1.2} />
          <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Factures du client</p>
          <a href="/factures/nouvelle" style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', borderRadius: '7px', padding: '6px 12px', fontSize: '11px', color: 'var(--gold-2)', textDecoration: 'none' }}>
            <Plus size={11} /> Nouvelle facture
          </a>
        </div>
      )}

      {activeTab === 'projets' && (
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Building size={28} color="var(--bg-4)" strokeWidth={1.2} />
          <p style={{ fontSize: '12px', color: 'var(--txt-3)', margin: 0 }}>Projets du client</p>
        </div>
      )}

      {activeTab === 'notes' && (
        <JournalPanel clientId={id as string} />
      )}
    </div>
  )
}
