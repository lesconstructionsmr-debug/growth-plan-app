'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmationContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
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
          Verifiez votre courriel
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: '6px' }}>
          Un lien de confirmation a ete envoye a
        </p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gold-2)', marginBottom: '24px' }}>
          {email}
        </p>
        <p style={{ fontSize: '13px', color: 'var(--txt-3)', lineHeight: 1.6, marginBottom: '28px' }}>
          Cliquez le lien dans le courriel pour activer votre compte et acceder a votre essai gratuit de 14 jours.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--txt-3)' }}>
          Deja confirme ?{' '}
          <Link href="/login" style={{ color: 'var(--gold-2)', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
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
