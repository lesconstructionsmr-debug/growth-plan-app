'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { isDuplicateSignup } from '@/lib/auth/site-url'
import { resendConfirmation } from '@/app/actions/auth'

export default function RegisterPage() {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          prenom,
          nom,
          company,
          full_name: `${prenom} ${nom}`.trim(),
          company_name: company,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (isDuplicateSignup(data.user)) {
      setError('Un compte existe déjà pour ce courriel. Connectez-vous ou réinitialisez votre mot de passe.')
      setLoading(false)
      return
    }

    if (data.session) {
      router.replace('/dashboard')
      return
    }

    const sent = await resendConfirmation(email)
    const sentQs = !('ok' in sent && sent.ok) ? '&sent=0' : ''
    router.replace(`/onboarding/confirmation?email=${encodeURIComponent(email)}${sentQs}`)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

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
            Créer votre compte
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--txt-3)' }}>
            ERP Construction — Growth Plan
          </p>
        </div>

        <div style={{
          background: 'var(--bg-1)', border: '0.5px solid var(--line)',
          borderTop: '2px solid var(--gold-3)', borderRadius: '12px', padding: '1.75rem',
        }}>
          <form onSubmit={handleRegister}>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="reg-prenom" style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Prénom</label>
                <input
                  id="reg-prenom" name="prenom"
                  type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                  placeholder="Jean" autoComplete="given-name" required
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line-2)', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="reg-nom" style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Nom</label>
                <input
                  id="reg-nom" name="nom"
                  type="text" value={nom} onChange={e => setNom(e.target.value)}
                  placeholder="Tremblay" autoComplete="family-name" required
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line-2)', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
                  onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="reg-company" style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Nom de l'entreprise</label>
              <input
                id="reg-company" name="company"
                type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Peinture JTL inc." autoComplete="organization" required
                style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line-2)', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
                onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>Adresse courriel</label>
              <input
                id="reg-email" name="email"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vous@exemple.com" autoComplete="email" required
                style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line-2)', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold-3)'}
                onBlur={e => e.target.style.borderColor = 'var(--line-2)'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="reg-password" style={{ display: 'block', fontSize: '11px', color: 'var(--txt-2)', marginBottom: '6px' }}>
                Mot de passe <span style={{ color: 'var(--txt-3)' }}>(min. 8 caractères)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password" name="password"
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" required
                  style={{ width: '100%', background: 'var(--bg-2)', border: '0.5px solid var(--line-2)', borderRadius: '7px', padding: '9px 40px 9px 12px', fontSize: '13px', color: 'var(--txt-1)', outline: 'none' }}
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
              type="submit" disabled={loading}
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
              {loading && <Loader2 size={14} />}
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--txt-3)', marginTop: '1.25rem' }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: 'var(--gold-2)', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  )
}