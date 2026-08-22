'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Send, Mail, Phone, StickyNote,
  User, CheckCircle2, Clock, Plus, Loader2, Sparkles
} from 'lucide-react'

export type NoteType = 'note' | 'appel' | 'sms' | 'email' | 'specification'

export interface ChatMessageEntry {
  id: string
  type: NoteType
  contenu: string
  created_at: string
  auteur?: string
}

interface ClientChatPanelProps {
  clientId: string
  clientNom: string
  clientEmail: string
  clientTelephone: string
  onInsertIntoQuote?: (text: string) => void
}

const CANAUX: { id: NoteType | 'tous'; label: string; icon: React.ElementType }[] = [
  { id: 'tous', label: 'Tous', icon: MessageSquare },
  { id: 'email', label: 'Courriels', icon: Mail },
  { id: 'sms', label: 'SMS', icon: MessageSquare },
  { id: 'appel', label: 'Appels', icon: Phone },
  { id: 'note', label: 'Notes', icon: StickyNote },
]

export function ClientChatPanel({
  clientId,
  clientNom,
  clientEmail,
  clientTelephone,
  onInsertIntoQuote,
}: ClientChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreCanal, setFiltreCanal] = useState<NoteType | 'tous'>('tous')
  const [contenu, setContenu] = useState('')
  const [typeEnvoi, setTypeEnvoi] = useState<NoteType>('email')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    fetch(`/api/notes?client_id=${clientId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(
            data.map((n: any) => ({
              id: n.id,
              type: (n.type as NoteType) || 'note',
              contenu: n.contenu || '',
              created_at: n.created_at,
              auteur: n.profiles?.full_name || 'Vous',
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!contenu.trim() || envoiEnCours) return

    setEnvoiEnCours(true)
    try {
      if (typeEnvoi === 'email') {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, contenu: contenu.trim() }),
        })
        const data = await res.json()
        if (data.note) {
          setMessages(prev => [
            ...prev,
            {
              id: data.note.id,
              type: 'email',
              contenu: data.note.contenu,
              created_at: data.note.created_at,
              auteur: 'Vous',
            },
          ])
        }
      } else {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, type: typeEnvoi, contenu: contenu.trim() }),
        })
        const note = await res.json()
        setMessages(prev => [
          ...prev,
          {
            id: note.id,
            type: typeEnvoi,
            contenu: note.contenu,
            created_at: note.created_at,
            auteur: 'Vous',
          },
        ])
      }
      setContenu('')
    } catch {
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  const messagesFiltres = messages.filter(
    m => filtreCanal === 'tous' || m.type === filtreCanal
  )

  return (
    <div className="flex flex-col h-full bg-[#111318] border-r border-[#222733] select-none">
      {/* 1. Header Profil Client */}
      <div className="p-4 border-b border-[#222733] bg-[#141822]/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
            {clientNom ? clientNom.slice(0, 2).toUpperCase() : 'CL'}
          </div>
          <div>
            <div className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
              {clientNom || 'Client non sélectionné'}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                En ligne
              </span>
            </div>
            <div className="text-xs text-zinc-400 flex items-center gap-3 mt-0.5">
              {clientEmail && <span>{clientEmail}</span>}
              {clientTelephone && <span>· {clientTelephone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filtres par Canal */}
      <div className="flex items-center gap-1.5 p-2 px-3 border-b border-[#222733] bg-[#0E1016]">
        {CANAUX.map(c => {
          const Icon = c.icon
          const active = filtreCanal === c.id
          return (
            <button
              key={c.id}
              onClick={() => setFiltreCanal(c.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                active
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181C26]'
              }`}
            >
              <Icon size={12} />
              {c.label}
            </button>
          )
        })}
      </div>

      {/* 3. Fil des Messages & Interactions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs gap-2">
            <Loader2 size={20} className="animate-spin text-amber-500" />
            Chargement des échanges...
          </div>
        ) : messagesFiltres.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs space-y-1">
            <MessageSquare size={28} className="mx-auto text-zinc-600 mb-2 stroke-1" />
            <p className="font-medium text-zinc-400">Aucun échange pour ce filtre.</p>
            <p>Envoyez un courriel ou notez un appel pour démarrer le fil.</p>
          </div>
        ) : (
          messagesFiltres.map(msg => {
            const isEmail = msg.type === 'email'
            const isAppel = msg.type === 'appel'
            const isNote = msg.type === 'note'
            return (
              <div
                key={msg.id}
                className="group p-3 rounded-xl bg-[#161A24] border border-[#262C3D] hover:border-zinc-700 transition-all text-xs space-y-2 relative"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                        isEmail
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : isAppel
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {msg.type.toUpperCase()}
                    </span>
                    <span className="font-medium text-zinc-200">{msg.auteur}</span>
                  </div>
                  <span className="text-zinc-500">
                    {new Date(msg.created_at).toLocaleTimeString('fr-CA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{msg.contenu}</p>

                {/* Action d'insertion rapide vers le Devis */}
                {onInsertIntoQuote && (
                  <button
                    onClick={() => onInsertIntoQuote(msg.contenu)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md mt-1.5"
                  >
                    <Plus size={10} /> Insérer dans le devis
                  </button>
                )}
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>

      {/* 4. Zone de Saisie & Envoi */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#222733] bg-[#141822]/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-[#0E1016] p-1 rounded-lg border border-[#262C3D]">
            {(['email', 'sms', 'note', 'appel'] as NoteType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeEnvoi(t)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all capitalize ${
                  typeEnvoi === t
                    ? 'bg-amber-500/20 text-amber-400 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t === 'email' ? 'Courriel' : t}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            Prêt à envoyer
          </span>
        </div>

        <div className="relative">
          <textarea
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            rows={3}
            placeholder={
              typeEnvoi === 'email'
                ? `Rédiger un courriel à ${clientNom || 'ce client'}...`
                : typeEnvoi === 'sms'
                ? 'Écrire un SMS direct...'
                : 'Consigner une note interne ou un compte-rendu d\'appel...'
            }
            className="w-full bg-[#0E1016] border border-[#262C3D] rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none font-sans"
          />
          <button
            type="submit"
            disabled={!contenu.trim() || envoiEnCours}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 hover:brightness-110 transition-all shadow-md"
          >
            {envoiEnCours ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Envoyer
          </button>
        </div>
      </form>
    </div>
  )
}
