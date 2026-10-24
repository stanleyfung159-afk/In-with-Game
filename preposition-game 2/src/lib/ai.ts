import { AiGrade } from './types';

// ----------------------------------------------------------------------------
// Optional AI grading. Outside Quick there is no built-in model, so this calls
// a configurable HTTPS endpoint (e.g. a Supabase Edge Function or any server
// that proxies OpenAI/Anthropic). See supabase/functions/grade in the repo for
// a ready-to-deploy example. If VITE_AI_ENDPOINT is empty the feature is off.
// ----------------------------------------------------------------------------

const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;

export const aiEnabled = Boolean(endpoint);

export async function aiGrade(sentence: string, mode: 'in' | 'with' | 'both' = 'both'): Promise<AiGrade> {
  if (!endpoint) {
    throw new Error('AI endpoint not configured. Set VITE_AI_ENDPOINT in .env (see supabase/functions/grade), or use the built-in rule checker.');
  }
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence, mode }),
    });
  } catch {
    throw new Error('Could not reach the AI grading service. Please try again.');
  }
  if (!res.ok) {
    throw new Error(`The AI grading service returned an error (${res.status}).`);
  }
  const data = await res.json();
  return {
    correct: !!data.correct,
    score: Math.max(0, Math.min(100, Math.round(Number(data.score) || 0))),
    feedback: String(data.feedback || ''),
    correction: String(data.correction || sentence),
  };
}
