import { Submission } from './types';

export interface StudentRow {
  name: string;
  className: string;
  attempts: number;
  correct: number;
  accuracy: number; // %
  avgScore: number;
  bestScore: number;
  lastActive: number;
}

export function perStudent(subs: Submission[]): StudentRow[] {
  const map = new Map<string, Submission[]>();
  for (const s of subs) {
    const key = `${s.studentName}~${s.className || ''}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  const rows: StudentRow[] = [];
  for (const [, list] of map) {
    const attempts = list.length;
    const correct = list.filter((s) => s.correct).length;
    const avgScore = Math.round(list.reduce((a, s) => a + s.score, 0) / attempts);
    const bestScore = Math.max(...list.map((s) => s.score));
    rows.push({
      name: list[0].studentName,
      className: list[0].className || '',
      attempts,
      correct,
      accuracy: Math.round((correct / attempts) * 100),
      avgScore,
      bestScore,
      lastActive: Math.max(...list.map((s) => s.timestamp)),
    });
  }
  return rows.sort((a, b) => b.avgScore - a.avgScore);
}

export interface ErrorRow {
  type: string;
  label: string;
  count: number;
}

// Classify each recorded issue string into a teaching category.
export function errorBreakdown(subs: Submission[]): ErrorRow[] {
  const counts: Record<string, number> = {
    wrongIn: 0, wrongWith: 0, missing: 0, spelling: 0, structure: 0, novocab: 0,
  };
  for (const s of subs) {
    for (const raw of s.issues) {
      const i = raw.toLowerCase();
      if (i.includes('clothing') && i.includes('not "with"')) counts.wrongIn++;
      else if (i.includes('appearance word')) counts.wrongWith++;
      else if (i.includes('missing') || i.includes('needs')) counts.missing++;
      else if (i.includes('spelling')) counts.spelling++;
      else if (i.includes('full sentence')) counts.structure++;
      else if (i.includes('no practice words')) counts.novocab++;
    }
  }
  const labels: Record<string, string> = {
    wrongIn: 'Clothing used with "with" (should be in)',
    wrongWith: 'Appearance used with "in" (should be with)',
    missing: 'Missing preposition',
    spelling: 'Spelling error',
    structure: 'Sentence structure',
    novocab: 'No practice words used',
  };
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([type, count]) => ({ type, label: labels[type], count }))
    .sort((a, b) => b.count - a.count);
}
