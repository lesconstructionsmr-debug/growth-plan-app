import { SCAN_PROMPT } from '@/lib/depenses/parse-scan'

export async function readDocument(b64: string, mime: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (geminiKey) {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: SCAN_PROMPT },
                  { inline_data: { mime_type: mime, data: b64 } },
                ],
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
            }),
            signal: AbortSignal.timeout(8000),
          }
        )
        if (!res.ok) continue
        const data = await res.json()
        const t = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (t) return t
      } catch (err) {
        console.error('[readDocument Gemini]', model, err)
      }
    }
  }

  if (openaiKey && mime.startsWith('image/')) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.1,
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: SCAN_PROMPT },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } },
            ],
          }],
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const data = await res.json()
        const t = data.choices?.[0]?.message?.content
        if (t) return t
      }
    } catch (err) {
      console.error('[readDocument OpenAI]', err)
    }
  }

  return null
}
