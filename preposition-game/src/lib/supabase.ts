import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AvatarAttrs, Submission, Question } from './types';

// ----------------------------------------------------------------------------
// Supabase backend — this is what makes the app MULTI-DEVICE:
// a student submits on their own tablet, and the teacher sees every class's
// work on any device, because it all lives in one shared Postgres database.
// ----------------------------------------------------------------------------

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anon);

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url as string, anon as string)
  : null;

function requireClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      '未連接 Supabase。請在 .env 填入 VITE_SUPABASE_URL 同 VITE_SUPABASE_ANON_KEY。' +
        ' (Supabase not configured — set the two VITE_SUPABASE_* env vars.)'
    );
  }
  return supabase;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// DB row <-> app type mapping (snake_case columns).
interface SubRow {
  id: string;
  student_name: string;
  class_name: string;
  sentence: string;
  correct: boolean;
  score: number;
  attrs: AvatarAttrs;
  issues: string[];
  created_at: string;
}
function rowToSub(r: SubRow): Submission {
  return {
    id: r.id,
    studentName: r.student_name,
    className: r.class_name || '',
    sentence: r.sentence,
    correct: r.correct,
    score: r.score,
    attrs: r.attrs,
    issues: r.issues || [],
    timestamp: new Date(r.created_at).getTime(),
  };
}

// ---- Submissions ----
export async function saveSubmission(s: Omit<Submission, 'id' | 'timestamp'>): Promise<Submission> {
  const client = requireClient();
  const id = uid('sub');
  const { data, error } = await client
    .from('submissions')
    .insert({
      id,
      student_name: s.studentName,
      class_name: s.className,
      sentence: s.sentence,
      correct: s.correct,
      score: s.score,
      attrs: s.attrs,
      issues: s.issues,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToSub(data as SubRow);
}

export async function listSubmissions(): Promise<Submission[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as SubRow[]).map(rowToSub);
}

export async function listMySubmissions(name: string, className: string): Promise<Submission[]> {
  const all = await listSubmissions();
  const n = name.trim().toLowerCase();
  const c = className.trim().toLowerCase();
  return all.filter(
    (s) =>
      s.studentName.trim().toLowerCase() === n &&
      (c === '' || (s.className || '').trim().toLowerCase() === c)
  );
}

export async function deleteSubmission(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('submissions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Question bank ----
interface QRow {
  id: string;
  prompt: string;
  attrs: AvatarAttrs;
  created_by: string;
  created_at: string;
}
function rowToQ(r: QRow): Question {
  return { id: r.id, prompt: r.prompt, attrs: r.attrs, createdBy: r.created_by, timestamp: new Date(r.created_at).getTime() };
}

export async function saveQuestion(prompt: string, attrs: AvatarAttrs, createdBy: string): Promise<Question> {
  const client = requireClient();
  const id = uid('q');
  const { data, error } = await client
    .from('questions')
    .insert({ id, prompt, attrs, created_by: createdBy })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToQ(data as QRow);
}

export async function listQuestions(): Promise<Question[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as QRow[]).map(rowToQ);
}

export async function deleteQuestion(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('questions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function storageMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ---- Per-device preferences (local only; no backend needed) ----
export function savePref(key: string, value: string): void {
  try { localStorage.setItem(`pg_${key}`, value); } catch { /* ignore */ }
}
export function getPref(key: string): string | null {
  try { return localStorage.getItem(`pg_${key}`); } catch { return null; }
}
