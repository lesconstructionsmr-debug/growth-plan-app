'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/actions/auth'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit" disabled={pending}
      style={{
        width: '100%', background: 'var(--gold-3)',
        border: '0.5px solid var(--gold)', borderRadius: '7px', padding: '10px',
        fontSize: '13px', fontWeight: 500, color: 'var(--gold-2)',
        cursor: pending ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        opacity: pending ? 0.7 : 1, transition: 'all 0.15s',
      }}
    >
      {pending && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />}
      {pending ? 'Connexion...' : 'Se connecter'}
    </button>
  )
}

function LoginForm() {
  const [showPw, setShowPw] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'rgba(201,168,76,0.1)', border: '0.5px solid var(--gold-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>
            Growth Plan
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--txt-3)' }}>
            Connectez-vous a votre espace
          </p>
        </div>

        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderTop: '2px solid var(--gold-3)', borderRadius: '12px', padding: '1.75rem',
        }}>
          <form action={signIn}>
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>
                Adresse courriel
              </label>
              <input
                id="login-email" name="email"
                type="email" placeholder="vous@exemple.com" autoComplete="email" required
                style={{
                  width: '100%', background: 'var(--bg-2)',
                  border: '0.5px solid var(--line-2)', borderRadius: '7px',
                  padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
                onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="login-password" style={{ fontSize: '11px', color: 'var(--txt-2)' }}>Mot de passe</label>
                <Link href="/forgot-password" style={{ fontSize: '11px', color: 'var(--gold-2)', textDecoration: 'none' }}>
                  Oublie ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password" name="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="..." autoComplete="current-password" required
                  style={{
                    width: '100%', background: 'var(--bg-2)',
                    border: '0.5px solid var(--line-2)', borderRadius: '7px',
                    padding: '9px 40px 9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--txt-3)', display: 'flex', alignItems: 'center',
                }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(224,96,96,0.1)', border: '0.5px solid rgba(224,96,96,0.3)',
                borderRadius: '6px', padding: '8px 12px',
                fontSize: '12px', color: 'var(--red)', marginBottom: '14px',
              }}>
                {decodeURIComponent(error)}
              </div>
            )}

            <SubmitButton />
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)', marginTop: '1.25rem' }}>
          Pas encore de compte ?{' '}
          <Link href="/onboarding" style={{ color: 'var(--gold-2)', textDecoration: 'none', fontWeight: 500 }}>
            Commencer gratuitement
          </Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--txt-3)', marginTop: '0.5rem' }}>
          <Link href="/politique-confidentialite" style={{ color: 'var(--txt-3)', textDecoration: 'underline' }}>
            Politique de confidentialite
          </Link>
          {' - '}Growth Plan 2026
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
