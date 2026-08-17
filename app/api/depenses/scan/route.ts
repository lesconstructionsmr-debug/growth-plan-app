import { NextRequest, NextResponse } from 'next/server'
import { requireCompany, apiError } from '@/lib/api/auth'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { parseScanJson } from '@/lib/depenses/parse-scan'
import { readDocument } from '@/lib/depenses/read-document'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_B64 = 1_800_000

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireCompany()
    const { allowed, retryAfterSec } = checkRateLimit(`scan:${user.id}`, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000,
    })
    if (!allowed) {
      return NextResponse.json(
        { error: `Limite atteinte. Réessaie dans ${retryAfterSec}s.` },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({})) as { image?: string; mime?: string }
    const image = String(body.image || '').replace(/^data:[^;]+;base64,/, '')
    const mime = body.mime === 'image/png' ? 'image/png' : 'image/jpeg'

    if (!image || image.length < 80) {
      return NextResponse.json({ error: 'Photo manquante' }, { status: 400 })
    }
    if (image.length > MAX_B64) {
      return NextResponse.json({ error: 'Photo trop lourde. Recadre ou prends plus loin.' }, { status: 413 })
    }

    const text = await readDocument(image, mime)
    if (!text) {
      return NextResponse.json({
        error: 'Le scan n\'est pas activé sur ce serveur, ou la photo n\'est pas lisible. Entre la dépense à la main.',
      }, { status: 503 })
    }

    const parsed = parseScanJson(text)
    if (!parsed.montant) {
      return NextResponse.json({
        error: 'Montant introuvable sur la photo. Vérifie la clarté et réessaie.',
        ...parsed,
      }, { status: 422 })
    }

    return NextResponse.json({ ok: true, ...parsed })
  } catch (err) {
    return apiError(err, '[POST /api/depenses/scan]')
  }
}
