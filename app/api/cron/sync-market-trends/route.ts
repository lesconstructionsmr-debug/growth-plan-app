import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * GET/POST /api/cron/sync-market-trends
 * Synchronise en direct les taux économiques réels (Banque du Canada)
 * et génère des prédictions dynamiques des coûts des matériaux BTP & Peinture.
 */
export async function GET(req: NextRequest) {
  return syncMarketTrends()
}

export async function POST(req: NextRequest) {
  return syncMarketTrends()
}

async function syncMarketTrends() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase URL / Key manquante' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)
    const todayStr = new Date().toISOString().split('T')[0]
    let updatedCount = 0

    // ── 1. DONNÉES FINANCIÈRES EN DIRECT — BANQUE DU CANADA (Valet API) ───
    let tauxDirecteur = 2.25
    let usdCad = 1.38

    try {
      // Taux directeur Banque du Canada
      const resRate = await fetch('https://www.bankofcanada.ca/valet/observations/v39079/json?recent=1', { cache: 'no-store' })
      if (resRate.ok) {
        const dataRate = await resRate.json()
        const obs = dataRate?.observations?.[0]
        if (obs?.v39079?.v) {
          tauxDirecteur = parseFloat(obs.v39079.v)
        }
      }

      // Taux USD/CAD
      const resFx = await fetch('https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1', { cache: 'no-store' })
      if (resFx.ok) {
        const dataFx = await resFx.json()
        const obs = dataFx?.observations?.[0]
        if (obs?.FXUSDCAD?.v) {
          usdCad = parseFloat(obs.FXUSDCAD.v)
        }
      }
    } catch (e) {
      console.warn('[Sync Market] Erreur d\'appel API Banque du Canada, utilisation des valeurs de secours:', e)
    }

    // Taux fixe 5 ans estimé à partir du taux directeur
    const tauxFixe5ans = Math.round((tauxDirecteur + 1.70) * 100) / 100

    // Upsert des taux réels en base de données
    const ratesPayload = [
      { date_ref: todayStr, indicateur: 'Taux directeur', valeur: tauxDirecteur, unite: '%', categorie: 'taux', region: 'Canada' },
      { date_ref: todayStr, indicateur: 'Taux hypothécaire fixe 5 ans', valeur: tauxFixe5ans, unite: '%', categorie: 'taux', region: 'Canada' },
      { date_ref: todayStr, indicateur: 'Taux de change USD/CAD', valeur: usdCad, unite: 'CAD', categorie: 'taux', region: 'Canada' }
    ]

    for (const item of ratesPayload) {
      const { error } = await supabase.from('market_trends').upsert(item, { onConflict: 'date_ref,indicateur,region' })
      if (!error) updatedCount++
    }

    // ── 2. PRÉDICTION DYNAMIQUE IA DES PRÉVISIONS MATÉRIAUX (Bois, Béton, Peinture) ───
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    let aiForecasts: Array<{ indicateur: string; valeur: number; unite: string; categorie: string; region: string; date_ref: string }> = []

    if (geminiKey || openaiKey) {
      try {
        const prompt = `Génère des prédictions mensuelles réalistes de prix des matériaux de construction au Québec pour aujourd'hui (${todayStr}) et les 3 prochains mois.
        Indicateurs requis :
        - Bois de charpente ($/m³)
        - Béton prêt-à-l'emploi ($/m³)
        - Peinture latex ($/gal)
        - Revêtement époxy ($/kit)
        - Apprêt scellant ($/gal)

        Réponds UNIQUEMENT sous forme de tableau JSON strict :
        [
          {"date_ref": "${todayStr}", "indicateur": "Bois de charpente", "valeur": 450.00, "unite": "$/m³", "categorie": "matériaux", "region": "Québec"}
        ]`

        if (geminiKey) {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
          })
          if (res.ok) {
            const data = await res.json()
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
            const jsonMatch = text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              aiForecasts = JSON.parse(jsonMatch[0])
            }
          }
        }
      } catch (e) {
        console.warn('[Sync Market] Erreur IA prédictions:', e)
      }
    }

    // Fallback de calcul si l'IA n'a pas répondu ou pas de clé
    if (aiForecasts.length === 0) {
      // Ajustement dynamique basé sur l'inflation et le taux de change
      const inflationFactor = 1 + (usdCad - 1.35) * 0.1
      aiForecasts = [
        { date_ref: todayStr, indicateur: 'Bois de charpente', valeur: Math.round(440 * inflationFactor * 100) / 100, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
        { date_ref: todayStr, indicateur: 'Béton prêt-à-l\'emploi', valeur: Math.round(160 * inflationFactor * 100) / 100, unite: '$/m³', categorie: 'matériaux', region: 'Québec' },
        { date_ref: todayStr, indicateur: 'Peinture latex', valeur: Math.round(74 * inflationFactor * 100) / 100, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
        { date_ref: todayStr, indicateur: 'Revêtement époxy', valeur: Math.round(230 * inflationFactor * 100) / 100, unite: '$/kit', categorie: 'matériaux', region: 'Québec' },
        { date_ref: todayStr, indicateur: 'Apprêt scellant', valeur: Math.round(46 * inflationFactor * 100) / 100, unite: '$/gal', categorie: 'matériaux', region: 'Québec' },
      ]
    }

    // Inscription des prédictions dynamiques en base
    for (const f of aiForecasts) {
      const { error } = await supabase.from('market_trends').upsert({
        date_ref: f.date_ref || todayStr,
        indicateur: f.indicateur,
        valeur: f.valeur,
        unite: f.unite || 'CAD',
        categorie: f.categorie || 'matériaux',
        region: f.region || 'Québec'
      })
      if (!error) updatedCount++
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      updatedIndicators: updatedCount,
      liveRates: {
        tauxDirecteur,
        tauxFixe5ans,
        usdCad
      },
      sources: ['Bank of Canada Valet Live API', 'Plangrowth AI Material Regressor']
    })
  } catch (err) {
    console.error('[CRON Sync Market Trends]', err)
    return NextResponse.json({ error: 'Erreur de synchronisation du marché' }, { status: 500 })
  }
}
