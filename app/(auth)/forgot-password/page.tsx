'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { HardHat, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const isReset = searchParams.get('step') === 'reset'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const supabase = createClient()

  // ── Envoi du lien de réinitialisation ──────────────────────────────────
  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email) { setError('Veuillez entrer votre adresse courriel.'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  // ── Mise à jour du nouveau mot de passe ────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    if (password !== password2) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderTop: '2px solid var(--gold-3)',
    borderRadius: '12px', padding: '28px 24px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  }

  return (
    <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'var(--ga)', border: '0.5px solid var(--gold-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HardHat size={22} color="var(--gold)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--txt-1)' }}>ERP Construction</div>
          <div style={{ fontSize: '12px', color: 'var(--txt-3)', marginTop: '2px' }}>
            {isReset ? 'Nouveau mot de passe' : 'Réinitialisation du mot de passe'}
          </div>
        </div>
      </div>

      {/* ── Étape 1 : Demande de lien ── */}
      {!isReset && (
        <div style={cardStyle}>
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={24} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '8px' }}>
                  Courriel envoyé !
                </div>
                <div style={{ fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.6 }}>
                  Si un compte existe pour <strong style={{ color: 'var(--txt-1)' }}>{email}</strong>, vous recevrez un lien de réinitialisation dans les prochaines minutes.
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--txt-3)', lineHeight: 1.5 }}>
                Vérifiez aussi votre dossier spam. Le lien est valide 1 heure.
              </div>
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>
                  Mot de passe oublié ?
                </div>
                <div style={{ fontSize: '12px', color: 'var(--txt-3)', lineHeight: 1.5 }}>
                  Entrez votre adresse courriel — nous vous enverrons un lien pour créer un nouveau mot de passe.
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: 'rgba(224,96,96,0.08)', border: '0.5px solid rgba(224,96,96,0.3)',
                }}>
                  <AlertCircle size={14} color="var(--red)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSendLink} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>
                    Adresse courriel
                  </label>
                  <input
                    type="email" autoComplete="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@entreprise.com"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                      borderRadius: '8px', padding: '9px 12px',
                      fontSize: '13px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                  />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '11px',
                  background: loading ? 'var(--bg-3)' : 'var(--gold)',
                  border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 600,
                  color: loading ? 'var(--txt-3)' : '#0A0A0A',
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.15s',
                }}>
                  {loading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {loading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* ── Étape 2 : Nouveau mot de passe ── */}
      {isReset && (
        <div style={cardStyle}>
          {done ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle2 size={24} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '8px' }}>
                  Mot de passe mis à jour !
                </div>
                <div style={{ fontSize: '12px', color: 'var(--txt-2)', lineHeight: 1.6 }}>
                  Votre nouveau mot de passe est actif.
                </div>
              </div>
              <Link href="/login" style={{
                display: 'inline-block', marginTop: '4px',
                background: 'var(--gold-3)', border: '0.5px solid var(--gold)',
                borderRadius: '7px', padding: '9px 24px',
                fontSize: '13px', fontWeight: 500, color: 'var(--gold-2)',
                textDecoration: 'none',
              }}>
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txt-1)', marginBottom: '6px' }}>
                  Créer un nouveau mot de passe
                </div>
                <div style={{ fontSize: '12px', color: 'var(--txt-3)', lineHeight: 1.5 }}>
                  Choisissez un mot de passe sécurisé d'au moins 8 caractères.
                </div>
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: 'rgba(224,96,96,0.08)', border: '0.5px solid rgba(224,96,96,0.3)',
                }}>
                  <AlertCircle size={14} color="var(--red)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--red)' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>
                    Nouveau mot de passe
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required minLength={8}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                        borderRadius: '8px', padding: '9px 40px 9px 12px',
                        fontSize: '13px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt-3)',
                      display: 'flex', alignItems: 'center',
                    }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt-2)', display: 'block', marginBottom: '5px' }}>
                    Confirmer le mot de passe
                  </label>
                  <input
                    type={showPw ? 'text' : 'password'} value={password2}
                    onChange={e => setPassword2(e.target.value)}
                    placeholder="••••••••" required
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--bg-2)', border: '0.5px solid var(--line)',
                      borderRadius: '8px', padding: '9px 12px',
                      fontSize: '13px', color: 'var(--txt-1)', outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--gold-3)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--line)')}
                  />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '11px',
                  background: loading ? 'var(--bg-3)' : 'var(--gold)',
                  border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 600,
                  color: loading ? 'var(--txt-3)' : '#0A0A0A',
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.15s',
                }}>
                  {loading && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--txt-3)', textDecoration: 'none' }}>
          <ArrowLeft size={12} /> Retour à la connexion
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <Suspense fallback={<div style={{ color: 'var(--txt-3)', fontSize: '13px' }}>Chargement…</div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  )
}
