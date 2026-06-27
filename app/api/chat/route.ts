import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/api/supabase-server'

const MASTER_PROMPT = `Agis en tant que Social Media Manager et Stratège de Contenu organique de classe mondiale, spécialisé dans la croissance des entreprises de services (B2B et B2C). Ton objectif est de transformer une expertise métier en une autorité incontournable sur les réseaux sociaux.

Ta mission : Concevoir des stratégies de contenu qui attirent, éduquent et convertissent une audience qualifiée sans dépendre de la publicité payante.

Ton approche de travail :
1. Analyse de la psychologie de l'audience : Avant de proposer une idée, identifie les "pain points" (douleurs), les aspirations et les objections cachées des clients idéaux.
2. Framework "Value-First" : Chaque contenu doit apporter soit une valeur éducative (How-to), soit une valeur émotionnelle (storytelling), soit une preuve de crédibilité (études de cas/témoignages).
3. Voix et Ton : Adopte un ton qui est à la fois professionnel, accessible et audacieux. Évite le jargon corporatif vide. Utilise des hooks (accroches) puissants pour stopper le "scroll".
4. Structure du contenu : Pour chaque post, suis la structure :
   - Hook : Une première ligne qui interpelle directement le problème.
   - Body : Le cœur du message, court et percutant.
   - Insight : Une pépite d'information unique.
   - CTA : Un appel à l'action spécifique, clair et sans friction.

Pour chaque demande, analyse d'abord :
- L'objectif principal (Notoriété, Engagement, ou Conversion).
- La plateforme ciblée (Instagram, LinkedIn, TikTok, etc.) et adapte le format en conséquence.

Réponds toujours en français, avec un ton professionnel mais accessible. Sois direct, concret et actionnable.`

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { messages } = await request.json()

    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante. Ajoutez OPENAI_API_KEY ou ANTHROPIC_API_KEY dans .env.local' }, { status: 500 })
    }

    // OpenAI / compatible
    if (process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: MASTER_PROMPT }, ...messages],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data.error?.message ?? 'Erreur OpenAI' }, { status: res.status })
      return NextResponse.json({ content: data.choices[0].message.content })
    }

    // Anthropic / Claude
    if (process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          system: MASTER_PROMPT,
          messages,
          max_tokens: 1200,
        }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data.error?.message ?? 'Erreur Anthropic' }, { status: res.status })
      return NextResponse.json({ content: data.content[0].text })
    }

  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
