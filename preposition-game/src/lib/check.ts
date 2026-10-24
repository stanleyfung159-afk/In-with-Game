import { grade, parse } from './parser';
import { GradeResult, AvatarAttrs } from './types';

// ----------------------------------------------------------------------------
// Pre-check gate: the sentence must PASS this before any image is generated.
// Covers: sentence framework, in/with prepositions, spelling, gender-pronoun
// consistency, and inappropriate language. This is the rule-based gate used
// when no AI endpoint is configured; when VITE_AI_ENDPOINT is set the AI acts
// as the authoritative reader (see lib/ai.ts) and this still runs first to
// hard-block foul language instantly.
// ----------------------------------------------------------------------------

// Classroom-appropriate block list. Teachers can extend this.
// Kept deliberately small; matched as whole words, case-insensitive.
const FOUL_WORDS = [
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'piss', 'crap',
  'damn', 'stupid', 'idiot', 'dumb', 'ugly', 'fat', 'loser', 'hate',
];

export interface PreCheckIssue {
  kind: 'framework' | 'gender' | 'foul' | 'wrong-prep' | 'missing-prep' | 'spelling' | 'no-vocab' | 'structure';
  message: string; // bilingual-friendly HTML string
}

export interface PreCheckResult {
  ok: boolean;        // passed everything — image may be generated
  blocked: boolean;   // hard block: inappropriate language (never generate)
  grade: GradeResult; // underlying rule grade (score etc.)
  attrs: AvatarAttrs; // parsed attributes (used to render the avatar on pass)
  issues: PreCheckIssue[];
}

export function precheck(raw: string): PreCheckResult {
  const g = grade(raw);
  const attrs = parse(raw);
  const t = ' ' + raw.toLowerCase().replace(/[.,!?]/g, ' ') + ' ';
  const issues: PreCheckIssue[] = [];

  // 1) framework: must start with "I am the boy/girl"
  if (!/\bi am the (boy|girl)\b/.test(t)) {
    issues.push({
      kind: 'framework',
      message: '請用指定句式開頭：<b>I am the boy</b> 或 <b>I am the girl</b> … Start with "I am the boy/girl".',
    });
  }

  // 2) gender-pronoun consistency (grammatical, NOT clothing stereotypes)
  const saysBoy = /\bboy\b/.test(t);
  const saysGirl = /\bgirl\b/.test(t);
  if (saysBoy && saysGirl) {
    issues.push({ kind: 'gender', message: '句子同時出現 <b>boy</b> 同 <b>girl</b>——請只揀一個。' });
  } else if (saysBoy && /\b(she|her|hers)\b/.test(t)) {
    issues.push({ kind: 'gender', message: '性別代名詞不一致：講 <b>boy</b> 就用 <b>he / his</b>，唔係 she/her。' });
  } else if (saysGirl && /\b(he|his|him)\b/.test(t)) {
    issues.push({ kind: 'gender', message: '性別代名詞不一致：講 <b>girl</b> 就用 <b>she / her</b>，唔係 he/his。' });
  }

  // 3) inappropriate language (hard block)
  const foul = FOUL_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(t));
  if (foul) {
    issues.push({ kind: 'foul', message: '句子包含不適當／不友善字眼，請改用有禮貌的用語。Please keep it kind and appropriate.' });
  }

  // 4) merge the rule grader's issues (prepositions, spelling, vocab, structure)
  for (const gi of g.issues) {
    issues.push({ kind: gi.kind, message: gi.message });
  }

  const blocked = foul;
  // Image is unlocked only when there are NO problems at all.
  const ok = !blocked && g.correct && !issues.some((i) => i.kind === 'framework' || i.kind === 'gender' || i.kind === 'spelling');

  return { ok, blocked, grade: g, attrs, issues };
}
