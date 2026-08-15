'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { resendConfirmation } from '@/app/actions/auth'

function ConfirmationContent() {
  const params = useSearchParams()
  const emailFromQuery = params.get('email') ?? ''
  const sendFailed = params.get('sent') === '0'
  const [email, setEmail] = useState(emailFromQuery)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleResend() {
    if (!email.trim()) {
      setStatus('error')
      setMessage('Entrez votre adresse courriel.')
      return
    }
    setStatus('sending')
    setMessage('')
    const result = await resendConfirmation(email.trim())
    if ('error' in result && result.error) {
      setStatus('error')
      setMessage(result.error)
      return
    }
    setStatus('sent')
    setMessage('Un nouveau lien a été envoyé. Vérifiez aussi vos indésirables.')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'rgba(201,168,76,0.1)', border: '1px solid var(--gold-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '10px' }}>
          Vérifiez votre courriel
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: '6px' }}>
          Un lien de confirmation a été envoyé à
        </p>
        {emailFromQuery ? (
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold-2)', marginBottom: '24px' }}>
            {emailFromQuery}
          </p>
        ) : (
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@entreprise.com"
            autoComplete="email"
            style={{
              width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line-2)',
              borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)',
              outline: 'none', margin: '8px 0 20px', boxSizing: 'border-box',
            }}
          />
        )}
        <p style={{ fontSize: '13px', color: 'var(--txt-3)', lineHeight: 1.6, marginBottom: '20px' }}>
          {sendFailed
            ? 'Le premier envoi n’a pas abouti. Cliquez ci-dessous pour renvoyer le courriel via Resend.'
            : 'Cliquez le lien dans le courriel pour activer votre compte et accéder à votre essai gratuit de 14 jours. Pensez à vérifier le dossier spam.'}
        </p>

        {message && (
          <p style={{
            fontSize: '12px', lineHeight: 1.5, marginBottom: '16px',
            color: status === 'error' ? 'var(--red)' : 'var(--txt-2)',
          }}>
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={status === 'sending' || status === 'sent'}
          style={{
            width: '100%', background: 'var(--gold-3)', border: '0.5px solid var(--gold)',
            borderRadius: '7px', padding: '10px', fontSize: '13px', fontWeight: 500,
            color: 'var(--gold-2)', cursor: status === 'sending' || status === 'sent' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: status === 'sending' ? 0.7 : 1, marginBottom: '20px',
          }}
        >
          {status === 'sending' && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />}
          {status === 'sent' ? 'Courriel renvoyé' : status === 'sending' ? 'Envoi…' : 'Renvoyer le courriel'}
        </button>

        <p style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
          Déjà confirmé ?{' '}
          <Link href="/login" style={{ color: 'var(--gold-2)', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-0)' }} />}>
      <ConfirmationContent />
    </Suspense>
  )
}
