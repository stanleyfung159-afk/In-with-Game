import { AiGrade } from './types';

// ----------------------------------------------------------------------------
// Optional AI grading. Outside Quick there is no built-in model, so this calls
// a configurable HTTPS endpoint (e.g. a Supabase Edge Function or any server
// that proxies OpenAI/Anthropic). See supabase/functions/grade in the repo for
// a ready-to-deploy example. If VITE_AI_ENDPOINT is empty the feature is off.
// ----------------------------------------------------------------------------

const endpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;

export const aiEnabled = Boolean(endpoint);

export async function aiGrade(sentence: string): Promise<AiGrade> {
  if (!endpoint) {
    throw new Error(
      'AI 批改未設定。請在 .env 填入 VITE_AI_ENDPOINT（見 supabase/functions/grade 範例），' +
        ' 或淨係用即時規則批改。(AI endpoint not configured.)'
    );
  }
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    });
  } catch {
    throw new Error('連接 AI 批改服務失敗，請稍後再試。(Could not reach the AI grading service.)');
  }
  if (!res.ok) {
    throw new Error(`AI 批改服務回傳錯誤 (${res.status})。`);
  }
  const data = await res.json();
  return {
    correct: !!data.correct,
    score: Math.max(0, Math.min(100, Math.round(Number(data.score) || 0))),
    feedback: String(data.feedback || ''),
    correction: String(data.correction || sentence),
  };
}
