'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function JoinContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepted'>('loading')
  const [info,   setInfo]   = useState<{ email: string; company: string; role: string } | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch(`/api/join?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus('invalid') }
        else { setInfo(data); setStatus('valid') }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  async function accept() {
    setJoining(true)
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (res.ok) {
      setStatus('accepted')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setJoining(false)
      alert('Erreur lors de l\'acceptation. Veuillez réessayer.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-0)' }}>
      <div style={{ maxWidth: '420px', width: '100%', background: 'var(--bg-1)', border: '0.5px solid var(--line)', borderRadius: '14px', padding: '40px 32px', textAlign: 'center' }}>

        <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--ga)', border: '0.5px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Users size={24} color="var(--gold)" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={24} color="var(--txt-3)" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p style={{ color: 'var(--txt-3)', fontSize: '13px' }}>Vérification de l'invitation…</p>
          </>
        )}

        {status === 'invalid' && (
          <>
            <XCircle size={28} color="var(--red)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 8px' }}>Invitation invalide</h2>
            <p style={{ fontSize: '13px', color: 'var(--txt-3)', lineHeight: 1.6 }}>
              Ce lien d'invitation est expiré ou déjà utilisé. Contactez la personne qui vous a invité pour obtenir un nouveau lien.
            </p>
            <a href="/login" style={{ display: 'inline-block', marginTop: '20px', fontSize: '12px', color: 'var(--gold-2)', textDecoration: 'none' }}>← Retour à la connexion</a>
          </>
        )}

        {status === 'valid' && info && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 8px' }}>Vous êtes invité !</h2>
            <p style={{ fontSize: '13px', color: 'var(--txt-2)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Rejoignez <strong>{info.company}</strong> sur Plan Growth en tant que <strong>{info.role}</strong>.
            </p>
            <div style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line)', borderRadius: '9px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: 'var(--txt-3)' }}>
              {info.email}
            </div>
            <button
              onClick={accept}
              disabled={joining}
              style={{ width: '100%', padding: '12px', background: 'var(--gold)', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: 700, color: '#0A0A0A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {joining ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Connexion…</> : 'Accepter l\'invitation'}
            </button>
            <p style={{ fontSize: '10px', color: 'var(--txt-3)', marginTop: '12px' }}>
              Vous aurez accès à tous les clients, devis et factures de la compagnie.
            </p>
          </>
        )}

        {status === 'accepted' && (
          <>
            <CheckCircle2 size={28} color="var(--green)" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--txt-1)', margin: '0 0 8px' }}>Bienvenue dans l'équipe !</h2>
            <p style={{ fontSize: '13px', color: 'var(--txt-3)' }}>Redirection vers le tableau de bord…</p>
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} color="var(--txt-3)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <JoinContent />
    </Suspense>
  )
}
