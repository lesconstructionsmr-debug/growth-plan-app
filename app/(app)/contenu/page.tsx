'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles, Send, Copy, Download, RefreshCw, ChevronDown,
  Instagram, Linkedin, BookOpen, Calendar, Lightbulb, Check,
  MessageSquare, FileText, Loader2, PenLine, Target, BarChart2
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Suggestion {
  label: string
  prompt: string
}

// ── Suggestions rapides ────────────────────────────────────────
const SUGGESTIONS: Suggestion[] = [
  { label: '3 piliers de contenu', prompt: 'Mon service : entrepreneur général en rénovation résidentielle au Québec. Ma cible : propriétaires 35-55 ans. Objectif : notoriété + leads. Génère-moi 3 piliers de contenu fondamentaux avec exemples de posts.' },
  { label: 'Hook Instagram', prompt: 'Crée 5 hooks Instagram ultra-puissants pour un entrepreneur en rénovation. Thème : avant/après transformation sous-sol. Format : Reels 30 secondes.' },
  { label: 'Calendrier éditorial', prompt: 'Génère un calendrier éditorial pour 4 semaines. Service : peinture intérieure et extérieure résidentielle, Québec. Plateformes : Instagram + Facebook. 3 posts/semaine.' },
  { label: 'Post LinkedIn B2B', prompt: 'Écris un post LinkedIn pour un entrepreneur général qui cherche des contrats de gestion immobilière (B2B). Ton : professionnel et crédible. Inclus hook, insight unique et CTA.' },
  { label: 'Étude de cas client', prompt: 'Structure une étude de cas client pour les réseaux sociaux. Projet : rénovation complète cuisine 45 000 $, 6 semaines. Format adapté pour Instagram carousel et LinkedIn.' },
  { label: 'Stratégie TikTok', prompt: 'Crée une stratégie TikTok pour un plombier à Montréal. 5 idées de vidéos avec hook, concept et durée recommandée.' },
]

const PLATEFORMES = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'linkedin',  label: 'LinkedIn',  icon: Linkedin,  color: '#0A66C2' },
  { id: 'tiktok',    label: 'TikTok',   icon: MessageSquare, color: '#69C9D0' },
  { id: 'facebook',  label: 'Facebook', icon: MessageSquare, color: '#4267B2' },
]

const OBJECTIFS = ['Notoriété', 'Engagement', 'Conversion', 'Leads']

// ── Helpers ────────────────────────────────────────────────────
function formatMessage(text: string) {
  // Convertit **bold**, *italic*, et listes en JSX simple
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('## ')) return <div key={i} style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', margin: '10px 0 4px' }}>{line.slice(3)}</div>
    if (line.startsWith('# '))  return <div key={i} style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gold-2)', margin: '12px 0 6px' }}>{line.slice(2)}</div>
    if (line.startsWith('- ') || line.startsWith('• ')) return <div key={i} style={{ display: 'flex', gap: '6px', marginLeft: '8px', marginBottom: '2px' }}><span style={{ color: 'var(--gold)', marginTop: '2px' }}>•</span><span>{processBold(line.slice(2))}</span></div>
    if (line.match(/^\d+\. /)) return <div key={i} style={{ display: 'flex', gap: '8px', marginLeft: '8px', marginBottom: '2px' }}><span style={{ color: 'var(--gold)', fontWeight: 700, minWidth: '16px' }}>{line.match(/^\d+/)![0]}.</span><span>{processBold(line.replace(/^\d+\. /, ''))}</span></div>
    if (line === '') return <div key={i} style={{ height: '6px' }} />
    return <div key={i} style={{ marginBottom: '2px', lineHeight: 1.6 }}>{processBold(line)}</div>
  })
}

function processBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ color: 'var(--txt-1)', fontWeight: 600 }}>{p}</strong> : p)
}

// ── Page ──────────────────────────────────────────────────────
export default function ContenuPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Bonjour ! Je suis votre **Social Media Manager IA**, spécialisé dans la croissance organique pour les entreprises de services au Québec.\n\nMa mission : transformer votre expertise terrain en contenu qui attire, éduque et convertit — sans dépendre de la pub payante.\n\n**Pour commencer, dites-moi :**\n- Quel est votre service principal ?\n- Qui est votre client idéal ?\n- Quel est votre objectif prioritaire (notoriété, leads, engagement) ?\n\nOu choisissez une suggestion rapide ci-dessous pour démarrer immédiatement. 👇`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [plateforme, setPlateforme] = useState('instagram')
  const [objectif, setObjectif] = useState('Leads')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function autoResize() {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px'
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return
    setInput('')
    setApiError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: Message = { role: 'user', content: content.trim(), timestamp: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setApiError(data.error || 'Erreur inconnue')
        setLoading(false)
        return
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.content, timestamp: new Date() }])
    } catch {
      setApiError('Impossible de contacter l\'API. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  function copyMessage(content: string, idx: number) {
    navigator.clipboard.writeText(content)
    setCopied(idx)
    setTimeout(() => setCopied(null), 1800)
  }

  function resetConversation() {
    setMessages([{
      role: 'assistant',
      content: `Nouvelle conversation démarrée. Dites-moi quel est votre service, votre cible et votre objectif principal — je construis votre stratégie de contenu sur mesure.`,
      timestamp: new Date(),
    }])
    setApiError(null)
  }

  function exportConversation() {
    const text = messages.map(m => `[${m.role === 'user' ? 'Vous' : 'IA'}]\n${m.content}`).join('\n\n---\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `strategie-contenu-${new Date().toISOString().slice(0,10)}.txt`
    a.click()
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Sidebar gauche ──────────────────────────────────── */}
      <div style={{
        width: '260px', flexShrink: 0, borderRight: '0.5px solid var(--line)',
        background: 'var(--bg-1)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header sidebar */}
        <div style={{ padding: '16px', borderBottom: '0.5px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="var(--gold)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt-1)' }}>Social Media IA</div>
              <div style={{ fontSize: '10px', color: 'var(--green)' }}>● En ligne</div>
            </div>
          </div>
        </div>

        {/* Contexte campagne */}
        <div style={{ padding: '14px', borderBottom: '0.5px solid var(--line)' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Contexte</div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '5px' }}>Plateforme</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {PLATEFORMES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlateforme(p.id)}
                  style={{
                    padding: '3px 8px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer',
                    background: plateforme === p.id ? 'var(--ga)' : 'var(--bg-2)',
                    border: `0.5px solid ${plateforme === p.id ? 'var(--gold-3)' : 'var(--line)'}`,
                    color: plateforme === p.id ? 'var(--gold-2)' : 'var(--txt-3)',
                    fontWeight: plateforme === p.id ? 600 : 400,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '5px' }}>Objectif</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {OBJECTIFS.map(o => (
                <button
                  key={o}
                  onClick={() => setObjectif(o)}
                  style={{
                    padding: '3px 8px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer',
                    background: objectif === o ? 'var(--ga)' : 'var(--bg-2)',
                    border: `0.5px solid ${objectif === o ? 'var(--gold-3)' : 'var(--line)'}`,
                    color: objectif === o ? 'var(--gold-2)' : 'var(--txt-3)',
                    fontWeight: objectif === o ? 600 : 400,
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions rapides */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Démarrage rapide</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SUGGESTIONS.map(s => (
              <button
                key={s.label}
                onClick={() => sendMessage(s.prompt)}
                disabled={loading}
                style={{
                  background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                  borderRadius: '7px', padding: '8px 10px', cursor: 'pointer',
                  textAlign: 'left', fontSize: '11px', color: 'var(--txt-2)',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--txt-1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLElement).style.color = 'var(--txt-2)' }}
              >
                <Lightbulb size={11} color="var(--gold)" style={{ flexShrink: 0 }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 14px', borderTop: '0.5px solid var(--line)', display: 'flex', gap: '6px' }}>
          <button onClick={resetConversation} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px', fontSize: '10px', color: 'var(--txt-3)', cursor: 'pointer' }}>
            <RefreshCw size={11} /> Réinitialiser
          </button>
          <button onClick={exportConversation} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '7px', fontSize: '10px', color: 'var(--txt-3)', cursor: 'pointer' }}>
            <Download size={11} /> Exporter
          </button>
        </div>
      </div>

      {/* ── Zone chat ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-0)' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--line)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={16} color="var(--gold)" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)' }}>Stratège de Contenu IA</span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(201,168,76,0.1)', border: '0.5px solid var(--gold-3)', color: 'var(--gold-2)', fontWeight: 600 }}>
              {PLATEFORMES.find(p => p.id === plateforme)?.label} · {objectif}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
            {messages.filter(m => m.role === 'user').length} message{messages.filter(m => m.role === 'user').length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar */}
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--ga)' : 'rgba(201,168,76,0.08)',
                border: `0.5px solid ${msg.role === 'user' ? 'var(--gold-3)' : 'var(--line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {msg.role === 'user'
                  ? <PenLine size={13} color="var(--gold)" />
                  : <Sparkles size={13} color="var(--gold)" />
                }
              </div>

              {/* Bulle */}
              <div style={{ maxWidth: '72%', position: 'relative' }}>
                <div style={{
                  background: msg.role === 'user' ? 'var(--ga)' : 'var(--bg-1)',
                  border: `0.5px solid ${msg.role === 'user' ? 'var(--gold-3)' : 'var(--line)'}`,
                  borderRadius: msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                  padding: '12px 14px',
                  fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.6,
                }}>
                  {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                </div>
                {/* Actions sur message IA */}
                {msg.role === 'assistant' && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'flex-start' }}>
                    <button
                      onClick={() => copyMessage(msg.content, i)}
                      style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: copied === i ? 'var(--green)' : 'var(--txt-3)', padding: '2px 6px', borderRadius: '4px' }}
                    >
                      {copied === i ? <Check size={10} /> : <Copy size={10} />}
                      {copied === i ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Indicateur de frappe */}
          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(201,168,76,0.08)', border: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={13} color="var(--gold)" />
              </div>
              <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '2px 12px 12px 12px', padding: '12px 16px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Loader2 size={13} color="var(--gold)" style={{ animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Génération en cours…</span>
              </div>
            </div>
          )}

          {/* Erreur API */}
          {apiError && (
            <div style={{ background: 'rgba(224,96,96,0.08)', border: '0.5px solid rgba(224,96,96,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', color: 'var(--red)' }}>
              ⚠️ {apiError}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div style={{ padding: '14px 20px', borderTop: '0.5px solid var(--line)', background: 'var(--bg-1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => { setInput(e.target.value); autoResize() }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Décrivez votre service, cible et objectif... (Entrée pour envoyer, Shift+Entrée pour sauter une ligne)"
                rows={1}
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: '12px', color: 'var(--txt-1)', resize: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5, minHeight: '20px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>
                  {PLATEFORMES.find(p => p.id === plateforme)?.label} · {objectif}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Entrée ↵ pour envoyer</div>
              </div>
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: '40px', height: '40px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: input.trim() && !loading ? 'var(--gold)' : 'var(--bg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <Send size={15} color={input.trim() && !loading ? '#0A0A0A' : 'var(--txt-3)'} />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
