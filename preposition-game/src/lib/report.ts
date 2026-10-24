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
      if (i.includes('衣物') && (i.includes('要用') || i.includes('不是'))) counts.wrongIn++;
      else if (i.includes('外貌') || i.includes('配件')) counts.wrongWith++;
      else if (i.includes('找不到') || i.includes('缺少') || i.includes('needs')) counts.missing++;
      else if (i.includes('拼寫') || i.includes('spelling')) counts.spelling++;
      else if (i.includes('完整句子') || i.includes('開頭')) counts.structure++;
      else if (i.includes('未偵測') || i.includes('詞彙')) counts.novocab++;
    }
  }
  const labels: Record<string, string> = {
    wrongIn: '衣物誤用 (應 in)',
    wrongWith: '特徵/配件誤用 (應 with)',
    missing: '缺少介詞',
    spelling: '串字錯誤',
    structure: '句子結構',
    novocab: '未用練習詞彙',
  };
  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([type, count]) => ({ type, label: labels[type], count }))
    .sort((a, b) => b.count - a.count);
}
