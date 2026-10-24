// Supabase Edge Function: AI grading proxy for the Preposition Game.
// Deploy:  supabase functions deploy grade --no-verify-jwt
// Secret:  supabase secrets set OPENAI_API_KEY=sk-...
// Then set VITE_AI_ENDPOINT in the web app's .env to this function's URL:
//   https://YOUR-PROJECT.supabase.co/functions/v1/grade
//
// The function keeps your API key on the server — never ship it to the browser.
// Swap the OpenAI call for Anthropic/Gemini/etc. if you prefer; only the fetch
// block changes. The web app just needs JSON back:
//   { correct: boolean, score: number, feedback: string, correction: string }

const SYSTEM = `You are a kind primary-school English teacher in Hong Kong.
The student must describe a person with this framework:
  "I am the boy / girl in (clothing) with (appearance)."
Rules you are teaching:
- Clothing items (t-shirt, shorts, jeans, trousers, dress, skirt) use the preposition "in".
- Appearance features and accessories (long/short/curly hair, beard, moustache, earrings, necklace, handbag, sunglasses, glasses) use the preposition "with".
Mark the sentence as NOT correct (correct=false) if ANY of these is wrong, and say which in the feedback:
  1. grammar errors;
  2. spelling errors;
  3. wrong preposition (in vs with);
  4. gender-pronoun inconsistency (e.g. says "boy" then uses she/her, or mixes boy and girl);
  5. inappropriate, unkind or foul language.
Do NOT treat a clothing choice itself as a gender error (any child may wear any clothing).
Grade gently and encouragingly. Keep feedback very short and child-friendly.
Reply ONLY with compact JSON: {"correct":bool,"score":0-100,"feedback":"<短中文+短英文, <40字>","correction":"<corrected English sentence>"}.`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const { sentence } = await req.json();
    if (!sentence || typeof sentence !== 'string') {
      return json({ error: 'missing sentence' }, 400);
    }

    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) return json({ error: 'OPENAI_API_KEY not set' }, 500);

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Grade this sentence: "${sentence}"` },
        ],
      }),
    });
    if (!r.ok) return json({ error: `upstream ${r.status}` }, 502);
    const data = await r.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
    return json({
      correct: !!parsed.correct,
      score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
      feedback: String(parsed.feedback ?? ''),
      correction: String(parsed.correction ?? sentence),
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
