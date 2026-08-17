'use client'

import { useEffect, useState } from 'react'
import { Plug, Copy, CheckCircle2, Loader2, RefreshCw, Send, ChevronDown, Mail } from 'lucide-react'
import { SETUP_FEE_CAD } from '@/lib/stripe/pricing'

export default function WebCrmPanel({ canManage }: { canManage: boolean }) {
  const [url, setUrl] = useState('')
  const [snippet, setSnippet] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testOk, setTestOk] = useState('')
  const [showTech, setShowTech] = useState(false)

  useEffect(() => {
    if (!canManage) { setLoading(false); return }
    fetch('/api/company/leads-connect')
      .then(async r => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Erreur')
        setUrl(data.url)
        setSnippet(data.snippet)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [canManage])

  async function sendTest() {
    if (!url) return
    setTesting(true)
    setTestOk('')
    setError('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nom: 'Test site web',
          email: 'test-site@example.com',
          telephone: '5145550100',
          source: 'Test connexion site',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec du test')
      setTestOk('Ça fonctionne. Allez dans Leads & CRM et rafraîchissez — vous verrez « Test site web ».')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur test')
    } finally {
      setTesting(false)
    }
  }

  async function regenerate() {
    if (!confirm('Remplacer le branchement actuel ? L\'ancien formulaire sur le site cessera d\'envoyer les demandes.')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/company/leads-connect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setUrl(data.url)
      setSnippet(data.snippet)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const box: React.CSSProperties = {
    background: 'var(--bg-2)', border: '0.5px solid var(--line)',
    borderRadius: '10px', padding: '16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt-1)', paddingBottom: '12px', borderBottom: '0.5px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Plug size={14} color="var(--gold)" /> Votre site web envoie les demandes ici
      </div>

      <div style={{ ...box, background: 'var(--ga)', borderColor: 'var(--gold-3)' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--txt-1)', marginBottom: '8px' }}>
          Inclus dans vos {SETUP_FEE_CAD} $ d&apos;adhésion — on le fait pour vous
        </div>
        <p style={{ fontSize: '13px', color: 'var(--txt-2)', margin: '0 0 10px', lineHeight: 1.65 }}>
          Quand quelqu&apos;un remplit le formulaire Contact sur <strong>votre site</strong>,
          la demande arrive automatiquement dans <strong>Leads &amp; CRM</strong>.
          Vous n&apos;avez rien à programmer.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.65 }}>
          Envoyez-nous l&apos;adresse de votre site (et le contact de votre webmestre s&apos;il y en a un).
          On branche le formulaire à l&apos;onboarding.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { n: '1', t: 'Vous nous donnez l\'adresse de votre site' },
          { n: '2', t: 'On branche votre page Contact à Plan Growth' },
          { n: '3', t: 'Les demandes arrivent dans Leads — vous relancez' },
        ].map(s => (
          <div key={s.n} style={{ ...box, padding: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gold-2)', marginBottom: '6px' }}>ÉTAPE {s.n}</div>
            <div style={{ fontSize: '12px', color: 'var(--txt-1)', lineHeight: 1.45 }}>{s.t}</div>
          </div>
        ))}
      </div>

      <a
        href="mailto:max@growth-plan.ca?subject=Brancher%20mon%20site%20au%20CRM"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'var(--gold)', color: '#0A0A0A', fontWeight: 700, fontSize: '13px',
          borderRadius: '10px', padding: '12px 16px', textDecoration: 'none',
        }}
      >
        <Mail size={15} /> Demander le branchement de mon site
      </a>

      {canManage && (
        <button
          type="button"
          onClick={sendTest}
          disabled={testing || loading}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'var(--bg-2)', border: '0.5px solid var(--line)',
            borderRadius: '10px', padding: '11px 16px', fontSize: '12px', fontWeight: 600,
            color: 'var(--txt-1)', cursor: testing ? 'default' : 'pointer',
          }}
        >
          {testing ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
          {testing ? 'Envoi du test…' : 'Vérifier que le CRM reçoit bien les demandes'}
        </button>
      )}

      {testOk && (
        <div style={{ fontSize: '12px', color: 'var(--green)', background: 'var(--green)12', border: '0.5px solid var(--green)', borderRadius: '8px', padding: '10px 12px' }}>
          {testOk}
        </div>
      )}
      {error && (
        <div style={{ fontSize: '12px', color: 'var(--red)', background: 'var(--red)12', border: '0.5px solid var(--red)', borderRadius: '8px', padding: '10px 12px' }}>
          {error}
        </div>
      )}

      {!canManage && (
        <div style={{ fontSize: '12px', color: 'var(--txt-3)', ...box }}>
          Contactez le propriétaire du compte pour le branchement du site.
        </div>
      )}

      {canManage && (
        <div>
          <button
            type="button"
            onClick={() => setShowTech(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
              background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, color: 'var(--txt-3)', textAlign: 'left',
            }}
          >
            <ChevronDown size={14} style={{ transform: showTech ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
            Pour votre webmestre (facultatif)
          </button>

          {showTech && (
            <div style={{ ...box, marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--txt-2)', margin: 0, lineHeight: 1.55 }}>
                Si vous avez déjà quelqu&apos;un qui gère votre site, envoyez-lui ce bloc.
                Il le colle sur la page Contact. Vous n&apos;avez pas à le comprendre.
              </p>
              {loading ? (
                <div style={{ fontSize: '12px', color: 'var(--txt-3)' }}>Chargement…</div>
              ) : (
                <>
                  <textarea
                    readOnly
                    value={snippet}
                    rows={8}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--bg-1)', border: '0.5px solid var(--line)',
                      borderRadius: '8px', padding: '10px 12px', fontSize: '11px',
                      color: 'var(--txt-1)', fontFamily: 'ui-monospace, monospace',
                      lineHeight: 1.5, resize: 'vertical',
                    }}
                    onFocus={e => e.target.select()}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(snippet)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      style={btn()}
                    >
                      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copied ? 'Envoyé au presse-papiers' : 'Copier pour le webmestre'}
                    </button>
                    <button type="button" onClick={regenerate} style={btn()}>
                      <RefreshCw size={12} /> Remplacer le branchement
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function btn(): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'var(--bg-1)', border: '0.5px solid var(--line)',
    borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: 600,
    color: 'var(--txt-2)', cursor: 'pointer',
  }
}
