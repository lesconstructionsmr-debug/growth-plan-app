'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'

// Icône Google SVG inline
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error, setError]       = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Courriel non confirmé — vérifiez votre boîte de réception et cliquez le lien de confirmation.')
        } else {
          setError('Email ou mot de passe incorrect.')
        }
        setLoading(false)
        return
      }
      window.location.href = '/dashboard'
    } catch {
      setError('Erreur réseau — vérifiez votre connexion.')
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoad(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError('Connexion Google échouée. Réessayez.')
        setGoogleLoad(false)
      }
      // Si succès, Supabase redirige automatiquement vers /auth/callback
    } catch {
      setError('Erreur réseau.')
      setGoogleLoad(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'rgba(201,168,76,0.1)', border: '0.5px solid var(--gold-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Building2 size={24} color="var(--gold)" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '4px' }}>
            ERP Construction
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--txt-3)' }}>
            Accès restreint — connectez-vous
          </p>
        </div>

        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderTop: '2px solid var(--gold-3)', borderRadius: '12px', padding: '1.75rem',
        }}>
          {/* Bouton Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoad || loading}
            style={{
              width: '100%', background: 'var(--bg-2)',
              border: '0.5px solid var(--line)', borderRadius: '7px', padding: '10px',
              fontSize: '13px', fontWeight: 500, color: 'var(--txt-1)',
              cursor: googleLoad ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              marginBottom: '16px',
              opacity: googleLoad ? 0.7 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!googleLoad) (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
          >
            {googleLoad
              ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
              : <GoogleIcon />
            }
            {googleLoad ? 'Redirection…' : 'Continuer avec Google'}
          </button>

          {/* Séparateur */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
          }}>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--line)' }} />
            <span style={{ fontSize: '11px', color: 'var(--txt-3)' }}>ou</span>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--line)' }} />
          </div>

          {/* Formulaire email/mot de passe */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>
                Adresse courriel
              </label>
              <input
                id="login-email" name="email"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com" autoComplete="email" required
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
                  Oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password" name="password"
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password" required
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
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || googleLoad}
              style={{
                width: '100%', background: 'var(--gold-3)',
                border: '0.5px solid var(--gold)', borderRadius: '7px', padding: '10px',
                fontSize: '13px', fontWeight: 500, color: 'var(--gold-2)',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: loading ? 0.7 : 1, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = '#0A0A0A' }}}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--gold-3)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold-2)' }}
            >
              {loading && <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)', marginTop: '1.25rem' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: 'var(--gold-2)', textDecoration: 'none' }}>
            Créer un compte
          </Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--txt-3)', marginTop: '0.5rem' }}>
          <Link href="/politique-confidentialite" style={{ color: 'var(--txt-3)', textDecoration: 'underline' }}>
            Politique de confidentialité
          </Link>
          {' · '}Growth Plan © 2026
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
