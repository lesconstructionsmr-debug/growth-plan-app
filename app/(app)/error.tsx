'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    try {
      if (typeof Sentry !== 'undefined' && typeof Sentry.captureException === 'function') {
        Sentry.captureException(error)
      }
    } catch (e) {
      console.error('Failed to capture exception with Sentry:', e)
    }
  }, [error])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: '24px',
        width: '100%',
      }}
    >
      <div
        style={{
          background: 'var(--bg-1, #121318)',
          border: '1px solid rgba(224, 96, 96, 0.3)',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(224, 96, 96, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--red, #E06060)',
          }}
        >
          <AlertTriangle size={24} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--txt-1, #F1F1F5)',
              margin: 0,
            }}
          >
            Une erreur inattendue est survenue dans le module
          </h2>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--txt-3, #8E8EA0)',
              margin: 0,
            }}
          >
            Un problème imprévu est survenu lors de l&apos;exécution. Vous pouvez essayer de réinitialiser le composant.
          </p>
        </div>

        {error?.message && (
          <div
            style={{
              width: '100%',
              background: 'var(--bg-2, #181920)',
              border: '0.5px solid var(--line, #272832)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--red, #E06060)',
              textAlign: 'left',
              overflowX: 'auto',
              maxHeight: '120px',
              wordBreak: 'break-word',
            }}
          >
            {error.message}
            {error.digest && (
              <div style={{ marginTop: '4px', opacity: 0.7, fontSize: '10px' }}>
                Digest: {error.digest}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => reset()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #F5D061, #D4AF37)',
            color: '#0A0B0E',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '8px',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1.0')}
        >
          <RefreshCw size={14} />
          <span>Réessayer</span>
        </button>
      </div>
    </div>
  )
}
