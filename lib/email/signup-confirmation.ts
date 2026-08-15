import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthCallbackUrl } from '@/lib/auth/site-url'
import { buildAuthCallbackUrl, escapeHtml } from '@/lib/email/links'

export async function sendResendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY manquante sur le serveur' }

  const from = process.env.RESEND_FROM ?? 'Plan Growth <noreply@growth-plan.ca>'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  }).catch(() => null)

  if (!res) return { ok: false, error: 'Resend injoignable' }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[resend]', res.status, body)
    return { ok: false, error: `Resend a refusé l'envoi (${res.status})` }
  }
  return { ok: true }
}

async function generateHashedToken(email: string, type: 'signup' | 'magiclink' | 'recovery') {
  const admin = createAdminClient()
  const params = {
    type,
    email,
    options: { redirectTo: getAuthCallbackUrl() },
  } as Parameters<typeof admin.auth.admin.generateLink>[0]
  const { data, error } = await admin.auth.admin.generateLink(params)
  return {
    tokenHash: data?.properties?.hashed_token as string | undefined,
    verifyType: (data?.properties?.verification_type as string | undefined) || type,
    error: error?.message,
  }
}

/** Génère le lien Auth puis l’envoie via Resend — pas le SMTP intégré Supabase. */
export async function sendSignupConfirmationEmail(email: string) {
  const trimmed = email.trim()
  if (!trimmed) return { ok: false as const, error: 'Entrez votre adresse courriel.' }

  try {
    let generated = await generateHashedToken(trimmed, 'signup')
    if (!generated.tokenHash) {
      generated = await generateHashedToken(trimmed, 'magiclink')
    }

    if (!generated.tokenHash) {
      console.error('[signup-email] generateLink', generated.error)
      return { ok: false as const, error: generated.error ?? 'Impossible de générer le lien de confirmation.' }
    }

    const confirmUrl = buildAuthCallbackUrl(generated.tokenHash, generated.verifyType)
    const safeEmail = escapeHtml(trimmed)

    return sendResendEmail({
      to: trimmed,
      subject: 'Confirmez votre compte — Plan Growth',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;color:#B8922A;font-weight:700">PLAN GROWTH</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#0A0A0A">Confirmez votre courriel</h1>
          <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 24px">
            Un compte a été créé pour <strong>${safeEmail}</strong>.
            Cliquez sur le bouton pour activer votre essai gratuit de 14 jours.
          </p>
          <a href="${confirmUrl}" style="display:inline-block;background:#D4960C;color:#0A0A0A;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
            Activer mon compte →
          </a>
          <p style="font-size:12px;color:#888;margin-top:28px;line-height:1.5">
            Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[signup-email]', err)
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Envoi du courriel impossible.',
    }
  }
}

export async function sendPasswordResetEmail(email: string) {
  const trimmed = email.trim()
  if (!trimmed) return { ok: false as const, error: 'Entrez votre adresse courriel.' }

  try {
    const generated = await generateHashedToken(trimmed, 'recovery')
    if (!generated.tokenHash) {
      // Ne pas révéler si le compte existe
      console.error('[reset-email] generateLink', generated.error)
      return { ok: true as const }
    }

    const resetUrl = buildAuthCallbackUrl(generated.tokenHash, 'recovery')
    return sendResendEmail({
      to: trimmed,
      subject: 'Réinitialisation du mot de passe — Plan Growth',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;color:#B8922A;font-weight:700">PLAN GROWTH</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#0A0A0A">Réinitialiser votre mot de passe</h1>
          <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 24px">
            Cliquez sur le bouton pour choisir un nouveau mot de passe.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#D4960C;color:#0A0A0A;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
            Choisir un mot de passe →
          </a>
          <p style="font-size:12px;color:#888;margin-top:28px;line-height:1.5">
            Si vous n’avez pas demandé cette réinitialisation, ignorez ce message.
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[reset-email]', err)
    return { ok: true as const }
  }
}
