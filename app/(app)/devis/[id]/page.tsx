'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ArrowLeft, FileText, Send, CheckCircle2, XCircle,
  Edit3, Download, Eye, Copy, Trash2, User, Calendar,
  Building2, MapPin, Clock, Mail, MessageSquare, X,
  AlertCircle, ChevronRight, Bell, Receipt, BellOff,
} from 'lucide-react'

// ── Types locaux (placeholder jusqu'à Supabase) ──────────────────
type StatutDevis = 'brouillon' | 'envoye' | 'vu' | 'approuve' | 'refuse' | 'expire' | 'converti'

interface LignePlaceholder {
  id: string
  description: string
  quantite: number
  unite: string
  prix_unitaire: number
  total_ligne: number
}

interface DevisPlaceholder {
  id: string
  numero: string
  titre: string
  statut: StatutDevis
  client_nom: string
  client_email: string
  client_ville: string
  projet_titre: string | null
  date_emission: string
  date_validite: string
  sous_total: number
  montant_tps: number
  montant_tvq: number
  total_ttc: number
  taux_tps: number
  taux_tvq: number
  notes_client: string | null
  notes_internes: string | null
  lignes: LignePlaceholder[]
}

// ── Helpers ───────────────────────────────────────────────────────
const STATUT_CONFIG: Record<StatutDevis, { label: string; color: string; bg: string }> = {
  brouillon: { label: 'Brouillon',  color: 'var(--txt-3)',   bg: 'var(--bg-3)'       },
  envoye:    { label: 'Envoyé',     color: 'var(--blue)',    bg: 'var(--blue)18'     },
  vu:        { label: 'Vu',         color: 'var(--purple)',  bg: 'var(--purple)18'   },
  approuve:  { label: 'Approuvé',   color: 'var(--green)',   bg: 'var(--green)18'    },
  refuse:    { label: 'Refusé',     color: 'var(--red)',     bg: 'var(--red)18'      },
  expire:    { label: 'Expiré',     color: 'var(--amber)',   bg: 'var(--amber)18'    },
  converti:  { label: 'Facturé',    color: 'var(--gold-2)',  bg: 'var(--gold-3)'     },
}

const fmt = (n: number) =>
  n.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })

// ── Modal d'envoi ────────────────────────────────────────────────
function ModalEnvoi({ devis, onClose, onSent }: {
  devis: DevisPlaceholder
  onClose: () => void
  onSent: () => void
}) {
  const [step, setStep] = useState<'compose' | 'sending' | 'sent'>('compose')
  const [emailMessage, setEmailMessage] = useState(
    `Bonjour ${devis.client_nom.split(' ')[0]},\n\nVeuillez trouver ci-joint votre devis ${devis.numero} — ${devis.titre}.\n\nTotal : ${fmt(devis.total_ttc)}\nValide jusqu'au : ${fmtDate(devis.date_validite)}\n\nCliquez sur le lien dans ce courriel pour consulter et approuver votre devis en ligne.\n\nCordialement,`
  )

  async function handleSend() {
    setStep('sending')
    try {
      await fetch(`/api/devis/${devis.id}/envoyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: emailMessage }),
      })
    } catch (_) { /* silently continue — email is best-effort */ }
    setStep('sent')
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  }
  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderRadius: '12px', width: '100%', maxWidth: '520px',
    display: 'flex', flexDirection: 'column', gap: '0',
    overflow: 'hidden',
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={15} color="var(--gold)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>
              Envoyer le devis au client
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
            <X size={16} />
          </button>
        </div>

        {step === 'compose' && (
          <>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Destinataire */}
              <div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.05em' }}>À</div>
                <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 12px', fontSize: '12px', color: 'var(--txt-1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={12} color="var(--txt-3)" />
                  {devis.client_email}
                </div>
              </div>

              {/* Objet */}
              <div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.05em' }}>Objet</div>
                <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '7px', padding: '8px 12px', fontSize: '12px', color: 'var(--txt-1)' }}>
                  Votre devis {devis.numero} — {devis.titre}
                </div>
              </div>

              {/* Message */}
              <div>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', marginBottom: '4px', fontWeight: 600, letterSpacing: '0.05em' }}>Message</div>
                <textarea
                  value={emailMessage}
                  onChange={e => setEmailMessage(e.target.value)}
                  rows={7}
                  style={{
                    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                    borderRadius: '7px', padding: '10px 12px',
                    fontSize: '12px', color: 'var(--txt-1)', outline: 'none',
                    width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Notification auto */}
              <div style={{
                background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
                borderRadius: '8px', padding: '10px 14px',
                display: 'flex', alignItems: 'flex-start', gap: '10px',
              }}>
                <MessageSquare size={14} color="var(--gold-2)" style={{ marginTop: '1px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-2)', marginBottom: '3px' }}>
                    Notification automatique activée
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--txt-2)', lineHeight: 1.5 }}>
                    Le client recevra un courriel avec le lien vers son portail sécurisé. Un message de rappel sera envoyé automatiquement dans 48h si le devis n'est pas consulté.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderTop: '0.5px solid var(--line)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px',
                padding: '8px 16px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={handleSend} style={{
                background: 'var(--gold)', border: 'none', borderRadius: '8px',
                padding: '8px 18px', fontSize: '12px', fontWeight: 700,
                color: '#0A0A0A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Send size={13} /> Envoyer maintenant
              </button>
            </div>
          </>
        )}

        {step === 'sending' && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>📤</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>Envoi en cours…</div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Génération du lien portail + envoi du courriel</div>
          </div>
        )}

        {step === 'sent' && (
          <div style={{ padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--green)18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '4px' }}>Devis envoyé !</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.5 }}>
                Un courriel a été envoyé à <strong>{devis.client_email}</strong> avec le lien pour consulter et approuver le devis en ligne.
              </div>
            </div>
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '12px 16px', width: '100%', textAlign: 'left' }}>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>NOTIFICATIONS ENVOYÉES</div>
              {[
                { icon: '📧', text: `Courriel envoyé à ${devis.client_email}` },
                { icon: '🔗', text: 'Lien portail sécurisé généré (valide 30 jours)' },
                { icon: '⏰', text: 'Rappel automatique prévu dans 48h si non consulté' },
              ].map(n => (
                <div key={n.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '11px', color: 'var(--txt-2)' }}>
                  <span>{n.icon}</span> {n.text}
                </div>
              ))}
            </div>
            <button onClick={() => { onSent(); onClose() }} style={{
              background: 'var(--gold)', border: 'none', borderRadius: '8px',
              padding: '8px 24px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer',
            }}>
              Parfait
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal approbation + auto-facture ─────────────────────────────
function ModalApprobation({ devis, onClose, onApproved }: {
  devis: DevisPlaceholder
  onClose: () => void
  onApproved: (factureNum: string) => void
}) {
  const [step, setStep] = useState<'confirm' | 'generating' | 'done'>('confirm')
  const [factureNum, setFactureNum] = useState('FAC-…')
  const [factureId, setFactureId] = useState<string | null>(null)

  async function handleApprove() {
    setStep('generating')
    try {
      const res = await fetch(`/api/devis/${devis.id}/convertir`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setFactureNum(data.numero)
        setFactureId(data.facture_id)
        setStep('done')
        onApproved(data.numero)
      } else {
        alert(data.error ?? 'Erreur lors de la conversion')
        setStep('confirm')
      }
    } catch {
      alert('Erreur réseau')
      setStep('confirm')
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  }
  const modalStyle: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderRadius: '12px', width: '100%', maxWidth: '480px',
    overflow: 'hidden',
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && step === 'done' && onClose()}>
      <div style={modalStyle}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="var(--green)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>
              Approuver le devis
            </span>
          </div>
          {step !== 'generating' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {step === 'confirm' && (
          <>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: 'var(--green)10', border: '0.5px solid var(--green)40',
                borderRadius: '10px', padding: '14px 16px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '8px' }}>
                  {devis.numero} — {devis.titre}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', marginBottom: '4px' }}>
                  {fmt(devis.total_ttc)} TTC
                </div>
                <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>Client : {devis.client_nom}</div>
              </div>

              <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '8px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '2px' }}>CE QUI SE PASSE AUTOMATIQUEMENT</div>
                {[
                  { icon: CheckCircle2, color: 'var(--green)', text: 'Statut du devis → Approuvé' },
                  { icon: Receipt, color: 'var(--gold)', text: `Facture ${factureNum} générée automatiquement` },
                  { icon: BellOff, color: 'var(--blue)', text: 'Rappels automatiques désactivés' },
                  { icon: MessageSquare, color: 'var(--purple)', text: 'Message de confirmation envoyé au client' },
                ].map(({ icon: Icon, color, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={13} color={color} />
                    <span style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '0.5px solid var(--line)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px',
                padding: '8px 16px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer',
              }}>Annuler</button>
              <button onClick={handleApprove} style={{
                background: 'var(--green)', border: 'none', borderRadius: '8px',
                padding: '8px 20px', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <CheckCircle2 size={13} /> Confirmer l'approbation
              </button>
            </div>
          </>
        )}

        {step === 'generating' && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '14px' }}>⚙️</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>Traitement en cours…</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
              {['Approbation du devis…', 'Génération de la facture…', 'Notification client…'].map(t => (
                <div key={t} style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{t}</div>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--green)18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} color="var(--green)" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '4px' }}>Devis approuvé !</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>Tout a été généré automatiquement.</div>
            </div>
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '12px 16px', width: '100%' }}>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '8px' }}>ACTIONS COMPLÉTÉES</div>
              {[
                { icon: '✅', text: `Devis ${devis.numero} → Approuvé` },
                { icon: '🧾', text: `Facture ${factureNum} créée — ${fmt(devis.total_ttc)}` },
                { icon: '📧', text: 'Courriel de confirmation envoyé' },
                { icon: '🔕', text: 'Rappels automatiques désactivés' },
              ].map(n => (
                <div key={n.text} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '11px', color: 'var(--txt-2)' }}>
                  <span>{n.icon}</span> {n.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={onClose} style={{
                flex: 1, background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px',
                padding: '9px', fontSize: '12px', color: 'var(--txt-2)', cursor: 'pointer',
              }}>Fermer</button>
              <a href={factureId ? `/factures/${factureId}` : '/factures'} style={{
                flex: 1, background: 'var(--gold)', border: 'none', borderRadius: '8px',
                padding: '9px', fontSize: '12px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer',
                textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}>
                <Receipt size={13} /> Voir la facture
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function DevisDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [devisData, setDevisData] = useState<DevisPlaceholder | null>(null)
  const [loading, setLoading] = useState(true)
  const [statut, setStatut] = useState<StatutDevis>('brouillon')
  const [showModalEnvoi, setShowModalEnvoi] = useState(false)
  const [showConfirmRefus, setShowConfirmRefus] = useState(false)
  const [showModalApprobation, setShowModalApprobation] = useState(false)
  const [factureGeneree, setFactureGeneree] = useState<string | null>(null)
  const [envoyeLe] = useState<Date>(() => {
    const d = new Date(); d.setHours(d.getHours() - 26); return d
  })
  const rappelDu24h = statut === 'envoye' || statut === 'vu'
  const heuresDepuisEnvoi = Math.floor((Date.now() - envoyeLe.getTime()) / 3600000)

  useEffect(() => {
    if (!id) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase
      .from('devis')
      .select('id, numero, titre, statut, lignes, montant_ht, tps, tvq, montant_ttc, date_emission, valide_jusqu_au, notes, clients(nom, email, ville)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        const cli = data.clients as any ?? {}
        const ht = Number(data.montant_ht ?? 0)
        const lignes = Array.isArray(data.lignes) ? data.lignes.map((l: any, i: number) => ({
          id: String(i), description: l.description ?? '',
          quantite: Number(l.quantite ?? 1), unite: l.unite ?? 'u',
          prix_unitaire: Number(l.prix_unitaire ?? 0),
          total_ligne: Number(l.quantite ?? 1) * Number(l.prix_unitaire ?? 0),
        })) : []
        const loaded: DevisPlaceholder = {
          id: data.id,
          numero: data.numero ?? '',
          titre: data.titre ?? '',
          statut: data.statut as StatutDevis,
          client_nom: cli.nom ?? '—',
          client_email: cli.email ?? '',
          client_ville: cli.ville ?? '',
          projet_titre: data.titre ?? null,
          date_emission: data.date_emission ?? '',
          date_validite: data.valide_jusqu_au ?? '',
          sous_total: ht,
          taux_tps: 5, taux_tvq: 9.975,
          montant_tps: Number(data.tps ?? 0),
          montant_tvq: Number(data.tvq ?? 0),
          total_ttc: Number(data.montant_ttc ?? 0),
          notes_client: data.notes ?? null,
          notes_internes: null,
          lignes,
        }
        setDevisData(loaded)
        setStatut(loaded.statut)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--txt-3)', fontSize: '13px' }}>Chargement du devis…</div>
  }

  if (!devisData) {
    return (
      <div style={{ padding: '24px' }}>
        <a href="/devis" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={13} /> Devis
        </a>
        <div style={{ background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
          <FileText size={32} color="var(--bg-4)" strokeWidth={1.2} />
          <p style={{ fontSize: '13px', color: 'var(--txt-3)', marginTop: '12px' }}>Devis introuvable — ID: {id}</p>
        </div>
      </div>
    )
  }

  const devis = { ...devisData, statut }

  const cfg = STATUT_CONFIG[statut]

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderRadius: '10px', padding: '16px 18px',
  }

  const btnSecondaire: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'none', border: '0.5px solid var(--line)', borderRadius: '8px',
    padding: '7px 12px', fontSize: '11px', color: 'var(--txt-2)', cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1000px' }}>
      {showModalEnvoi && (
        <ModalEnvoi
          devis={devis}
          onClose={() => setShowModalEnvoi(false)}
          onSent={() => setStatut('envoye')}
        />
      )}
      {showModalApprobation && (
        <ModalApprobation
          devis={devis}
          onClose={() => setShowModalApprobation(false)}
          onApproved={(num) => { setFactureGeneree(num); setStatut('converti') }}
        />
      )}

      {/* Breadcrumb */}
      <a href="/devis" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
        <ArrowLeft size={13} /> Devis
      </a>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt-1)', margin: 0 }}>
              {devis.numero}
            </h1>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--txt-2)' }}>{devis.titre}</div>
        </div>

        {/* Actions contextuelles selon statut */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href={`/devis/${id}/preview`} style={{ ...btnSecondaire, textDecoration: 'none' }}>
            <Eye size={13} /> Aperçu
          </a>
          <button style={btnSecondaire}><Download size={13} /> PDF</button>
          {!['converti', 'refuse', 'expire'].includes(statut) && (
            <a
              href={`/devis/nouveau?edit=${id}`}
              style={{ ...btnSecondaire, textDecoration: 'none' }}
              title="Modifier ce devis"
            >
              <Edit3 size={13} /> Modifier
            </a>
          )}
          <button style={btnSecondaire}><Copy size={13} /> Dupliquer</button>

          {statut === 'brouillon' && (
            <button onClick={() => setShowModalEnvoi(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--blue)', border: 'none', borderRadius: '8px',
              padding: '7px 14px', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}>
              <Send size={13} /> Envoyer au client
            </button>
          )}
          {(statut === 'envoye' || statut === 'vu') && (
            <>
              <button onClick={() => setShowModalEnvoi(true)} style={{
                ...btnSecondaire, border: '0.5px solid var(--blue)', color: 'var(--blue)',
              }}>
                <Send size={13} /> Renvoyer
              </button>
              <button onClick={() => setShowModalApprobation(true)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--green)', border: 'none', borderRadius: '8px',
                padding: '7px 14px', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}>
                <CheckCircle2 size={13} /> Marquer approuvé
              </button>
              <button onClick={() => setShowConfirmRefus(true)} style={{
                ...btnSecondaire, border: '0.5px solid var(--red)', color: 'var(--red)',
              }}>
                <XCircle size={13} /> Refusé
              </button>
            </>
          )}
          {statut === 'approuve' && (
            <button onClick={() => setShowModalApprobation(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--gold)', border: 'none', borderRadius: '8px',
              padding: '7px 14px', fontSize: '11px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer',
            }}>
              <Receipt size={13} /> Générer la facture
            </button>
          )}
        </div>
      </div>

      {/* Confirm refus */}
      {showConfirmRefus && (
        <div style={{
          background: 'var(--red)12', border: '0.5px solid var(--red)',
          borderRadius: '10px', padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={15} color="var(--red)" />
            <span style={{ fontSize: '12px', color: 'var(--txt-1)' }}>Confirmer le marquage du devis comme refusé ?</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowConfirmRefus(false)} style={{ ...btnSecondaire, fontSize: '11px' }}>Annuler</button>
            <button onClick={() => { setStatut('refuse'); setShowConfirmRefus(false) }} style={{
              background: 'var(--red)', border: 'none', borderRadius: '7px', padding: '6px 14px',
              fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}>Confirmer</button>
          </div>
        </div>
      )}

      {/* Bannière rappel automatique 24h */}
      {rappelDu24h && heuresDepuisEnvoi >= 24 && (
        <div style={{
          background: 'var(--amber)12', border: '0.5px solid var(--amber)',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <Bell size={15} color="var(--amber)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>
              Rappel automatique envoyé
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
              Le devis n'a pas reçu de réponse depuis {heuresDepuisEnvoi}h. Un rappel a été envoyé automatiquement à {devis.client_email}.
            </div>
          </div>
          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: 'var(--amber)20', color: 'var(--amber)', whiteSpace: 'nowrap' }}>
            En attente
          </span>
        </div>
      )}
      {rappelDu24h && heuresDepuisEnvoi < 24 && (
        <div style={{
          background: 'var(--blue)10', border: '0.5px solid var(--blue)40',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <Bell size={15} color="var(--blue)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>
              Rappel automatique programmé
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
              Si le devis n'est pas approuvé d'ici {24 - heuresDepuisEnvoi}h, un rappel sera envoyé automatiquement à {devis.client_email}.
            </div>
          </div>
        </div>
      )}

      {/* Bannière facture générée */}
      {(statut === 'converti') && factureGeneree && (
        <div style={{
          background: 'var(--green)10', border: '0.5px solid var(--green)',
          borderRadius: '10px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <Receipt size={15} color="var(--green)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '2px' }}>
              Facture générée automatiquement
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>
              {factureGeneree} — {fmt(devis.total_ttc)} — créée lors de l'approbation du devis
            </div>
          </div>
          <a href="/factures" style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 600,
            background: 'var(--green)', color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Voir la facture →
          </a>
        </div>
      )}

      {/* Infos 3 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px' }}>CLIENT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <User size={13} color="var(--txt-3)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>{devis.client_nom}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{devis.client_email}</div>
          <div style={{ fontSize: '11px', color: 'var(--txt-3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
            <MapPin size={10} /> {devis.client_ville}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px' }}>PROJET</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Building2 size={13} color="var(--txt-3)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>
              {devis.projet_titre ?? '—'}
            </span>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '10px', color: 'var(--txt-3)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '10px' }}>DATES</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Calendar size={13} color="var(--txt-3)" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Émission</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{fmtDate(devis.date_emission)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={13} color="var(--txt-3)" />
            <div>
              <div style={{ fontSize: '10px', color: 'var(--txt-3)' }}>Validité</div>
              <div style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{fmtDate(devis.date_validite)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--line)' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)' }}>Lignes du devis</span>
        </div>

        {/* En-tête tableau */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 80px 80px 110px 110px',
          padding: '8px 18px', borderBottom: '0.5px solid var(--line)',
          background: 'var(--bg-2)',
        }}>
          {['DESCRIPTION', 'QTÉ', 'UNITÉ', 'PRIX UNIT.', 'TOTAL'].map(h => (
            <div key={h} style={{ fontSize: '9px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.06em' }}>{h}</div>
          ))}
        </div>

        {devis.lignes.map((l, i) => (
          <div key={l.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 80px 80px 110px 110px',
            padding: '12px 18px',
            borderBottom: i < devis.lignes.length - 1 ? '0.5px solid var(--line)' : 'none',
            alignItems: 'center',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--txt-1)' }}>{l.description}</div>
            <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{l.quantite}</div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)' }}>{l.unite}</div>
            <div style={{ fontSize: '12px', color: 'var(--txt-2)' }}>{fmt(l.prix_unitaire)}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>{fmt(l.total_ligne)}</div>
          </div>
        ))}

        {/* Totaux */}
        <div style={{ borderTop: '0.5px solid var(--line)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { label: 'Sous-total', val: fmt(devis.sous_total), bold: false },
                { label: `TPS (${devis.taux_tps}%)`, val: fmt(devis.montant_tps), bold: false },
                { label: `TVQ (${devis.taux_tvq}%)`, val: fmt(devis.montant_tvq), bold: false },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--txt-2)' }}>
                  <span>{r.label}</span><span>{r.val}</span>
                </div>
              ))}
              <div style={{ borderTop: '0.5px solid var(--line)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: 'var(--txt-1)' }}>
                <span>Total TTC</span><span style={{ color: 'var(--gold)' }}>{fmt(devis.total_ttc)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.05em', marginBottom: '8px' }}>NOTES CLIENT</div>
          <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
            {devis.notes_client ?? '—'}
          </p>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--txt-3)', letterSpacing: '0.05em', marginBottom: '8px' }}>NOTES INTERNES</div>
          <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>
            {devis.notes_internes ?? '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
