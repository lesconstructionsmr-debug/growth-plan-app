'use client'

/**
 * NotificationWidget — Chatbot de notification automatique
 *
 * Quand un devis est envoyé au client, ce composant :
 * 1. Déclenche un message automatique via le chat integré
 * 2. Affiche une confirmation dans l'UI
 * 3. Est compatible avec Crisp, Intercom, ou tout autre service de chat
 *
 * Pour activer Crisp  → décommenter la section CRISP ci-dessous et ajouter CRISP_WEBSITE_ID dans .env.local
 * Pour activer Intercom → même chose avec la section INTERCOM
 */

import { useEffect, useState } from 'react'
import { MessageSquare, CheckCircle2, X, Bell } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────
export interface NotificationPayload {
  type: 'devis_envoye' | 'facture_envoyee' | 'rappel_devis' | 'paiement_recu'
  client_nom: string
  client_email: string
  numero: string       // ex: "DEV-2026-001"
  titre: string
  montant?: number
  lien_portail?: string
}

// ── Messages automatiques selon le type ────────────────────────
function buildMessage(payload: NotificationPayload): string {
  const prenom = payload.client_nom.split(' ')[0]
  switch (payload.type) {
    case 'devis_envoye':
      return `Bonjour ${prenom} 👋 Votre devis ${payload.numero} vient d'être envoyé à ${payload.client_email}. Veuillez vérifier votre courriel — vous y trouverez un lien sécurisé pour consulter et approuver votre soumission en ligne. N'hésitez pas à nous contacter si vous avez des questions !`
    case 'facture_envoyee':
      return `Bonjour ${prenom}, votre facture ${payload.numero} est disponible. Vérifiez votre courriel pour accéder au lien de paiement sécurisé.`
    case 'rappel_devis':
      return `Rappel amical : votre devis ${payload.numero} attend votre approbation. Vérifiez votre courriel ou cliquez sur le lien qui vous a été envoyé.`
    case 'paiement_recu':
      return `Merci ${prenom} ! Votre paiement a bien été reçu. Un reçu vous sera envoyé par courriel sous peu.`
    default:
      return `Un message vous a été envoyé à ${payload.client_email}.`
  }
}

// ── Envoi vers service de chat externe ─────────────────────────
async function sendToChatService(payload: NotificationPayload): Promise<void> {
  const message = buildMessage(payload)

  // ── CRISP (décommenter + ajouter NEXT_PUBLIC_CRISP_WEBSITE_ID dans .env.local) ──
  // if (typeof window !== 'undefined' && (window as any).$crisp) {
  //   (window as any).$crisp.push(['do', 'chat:open'])
  //   (window as any).$crisp.push(['do', 'message:send', ['text', message]])
  // }

  // ── INTERCOM (décommenter + configurer Intercom dans layout.tsx) ──
  // if (typeof window !== 'undefined' && (window as any).Intercom) {
  //   (window as any).Intercom('showNewMessage', message)
  // }

  // ── EMAIL API (via Resend / SendGrid / Nodemailer) ─────────────
  // await fetch('/api/notifications/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ payload, message }),
  // })

  // ── Mode développement : log dans la console ───────────────────
  console.log('[NotificationWidget] Message auto envoyé:', {
    to: payload.client_email,
    type: payload.type,
    message,
  })

  // Simuler un délai réseau
  await new Promise(r => setTimeout(r, 600))
}

// ── Composant principal ─────────────────────────────────────────
interface NotificationWidgetProps {
  payload: NotificationPayload
  onDismiss?: () => void
  autoSend?: boolean  // si true, envoie automatiquement au mount
}

export function NotificationWidget({
  payload,
  onDismiss,
  autoSend = false,
}: NotificationWidgetProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (autoSend && status === 'idle') {
      handleSend()
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    setStatus('sending')
    try {
      await sendToChatService(payload)
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'idle') return null

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: 'var(--bg-1)', border: '0.5px solid var(--line)',
      borderRadius: '12px', padding: '14px 16px', maxWidth: '320px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      {onDismiss && (
        <button onClick={onDismiss} style={{
          position: 'absolute', top: '10px', right: '10px',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)',
        }}>
          <X size={14} />
        </button>
      )}

      {status === 'sending' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageSquare size={16} color="var(--gold)" />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>Envoi en cours…</div>
            <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>
              Notification envoyée à {payload.client_email}
            </div>
          </div>
        </div>
      )}

      {status === 'sent' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={16} color="var(--green)" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt-1)' }}>
                Client notifié ✓
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)', marginTop: '2px' }}>
                {payload.client_nom} — {payload.client_email}
              </div>
            </div>
          </div>
          <div style={{
            background: 'var(--bg-2)', borderRadius: '8px', padding: '10px 12px',
            fontSize: '11px', color: 'var(--txt-2)', lineHeight: 1.5,
          }}>
            {buildMessage(payload)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { icon: '📧', text: `Courriel envoyé à ${payload.client_email}` },
              { icon: '🔔', text: 'Rappel automatique dans 48h si non lu' },
            ].map(n => (
              <div key={n.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--txt-3)' }}>
                <span>{n.icon}</span> {n.text}
              </div>
            ))}
          </div>
        </>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={16} color="var(--red)" />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--red)' }}>Erreur d'envoi</div>
            <button onClick={handleSend} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', color: 'var(--gold)', padding: 0, marginTop: '2px',
            }}>
              Réessayer →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Hook utilitaire ─────────────────────────────────────────────
/**
 * useAutoNotify — déclenche automatiquement une notification quand condition est true
 *
 * Exemple dans devis/[id]/page.tsx :
 *   const { notify, widget } = useAutoNotify()
 *   // Après envoi du devis :
 *   notify({ type:'devis_envoye', client_nom, client_email, numero, titre })
 *   // Dans le JSX : {widget}
 */
export function useAutoNotify() {
  const [payload, setPayload] = useState<NotificationPayload | null>(null)

  function notify(p: NotificationPayload) {
    setPayload(p)
  }

  const widget = payload ? (
    <NotificationWidget
      payload={payload}
      autoSend
      onDismiss={() => setPayload(null)}
    />
  ) : null

  return { notify, widget }
}
