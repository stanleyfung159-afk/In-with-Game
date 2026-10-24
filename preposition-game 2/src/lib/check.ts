import { grade, parse } from './parser';
import { GradeResult, AvatarAttrs } from './types';

// Question-type / difficulty levels, to accommodate students of different levels:
//   'in'   — easy: use clothing with "in" only       → I am the boy/girl in (clothing).
//   'with' — easy: use appearance with "with" only    → I am the boy/girl with (appearance).
//   'both' — advanced: use both                        → I am the boy/girl in (clothing) with (appearance).
export type QMode = 'in' | 'with' | 'both';

// Pre-check gate: the sentence must PASS before any image is generated.
// Covers: framework, the chosen level's preposition requirement, correct
// in/with usage, spelling, gender-pronoun consistency, and appropriate language.

const FOUL_WORDS = [
  'fuck', 'shit', 'bitch', 'bastard', 'asshole', 'dick', 'piss', 'crap',
  'damn', 'stupid', 'idiot', 'dumb', 'ugly', 'fat', 'loser', 'hate',
];

export interface PreCheckIssue {
  kind: 'framework' | 'gender' | 'foul' | 'requirement' | 'wrong-prep' | 'missing-prep' | 'spelling' | 'no-vocab' | 'structure';
  message: string;
}

export interface PreCheckResult {
  ok: boolean;
  blocked: boolean;
  grade: GradeResult;
  attrs: AvatarAttrs;
  issues: PreCheckIssue[];
}

export function precheck(raw: string, mode: QMode = 'both'): PreCheckResult {
  const g = grade(raw);
  const attrs = parse(raw);
  const t = ' ' + raw.toLowerCase().replace(/[.,!?]/g, ' ') + ' ';
  const issues: PreCheckIssue[] = [];

  // 1) framework: must start with "I am the boy/girl"
  if (!/\bi am the (boy|girl)\b/.test(t)) {
    issues.push({ kind: 'framework', message: 'Start your sentence with <b>I am the boy</b> or <b>I am the girl</b>.' });
  }

  // 2) gender-pronoun consistency (grammatical only, NOT clothing stereotypes)
  const saysBoy = /\bboy\b/.test(t);
  const saysGirl = /\bgirl\b/.test(t);
  if (saysBoy && saysGirl) {
    issues.push({ kind: 'gender', message: 'Your sentence has both <b>boy</b> and <b>girl</b> — please pick just one.' });
  } else if (saysBoy && /\b(she|her|hers)\b/.test(t)) {
    issues.push({ kind: 'gender', message: 'Pronoun mismatch: use <b>he / his</b> with <b>boy</b>, not she/her.' });
  } else if (saysGirl && /\b(he|his|him)\b/.test(t)) {
    issues.push({ kind: 'gender', message: 'Pronoun mismatch: use <b>she / her</b> with <b>girl</b>, not he/his.' });
  }

  // 3) inappropriate language (hard block)
  const foul = FOUL_WORDS.some((w) => new RegExp(`\\b${w}\\b`).test(t));
  if (foul) {
    issues.push({ kind: 'foul', message: 'Please use kind and appropriate words.' });
  }

  // 4) level requirement — in / with / both
  const clothingPresent = g.detected.clothing.length > 0;
  const featurePresent = g.detected.features.length > 0;
  if (mode === 'in' && !clothingPresent) {
    issues.push({ kind: 'requirement', message: 'This level needs a <b>clothing</b> item with <b>in</b> (e.g. <i>in a t-shirt</i>).' });
  }
  if (mode === 'with' && !featurePresent) {
    issues.push({ kind: 'requirement', message: 'This level needs an <b>appearance</b> word with <b>with</b> (e.g. <i>with glasses</i>).' });
  }
  if (mode === 'both') {
    if (!clothingPresent) issues.push({ kind: 'requirement', message: 'Advanced level needs a <b>clothing</b> item with <b>in</b> (e.g. <i>in a dress</i>).' });
    if (!featurePresent) issues.push({ kind: 'requirement', message: 'Advanced level needs an <b>appearance</b> word with <b>with</b> (e.g. <i>with long hair</i>).' });
  }

  // 5) merge the rule grader's issues (wrong prep, spelling, structure) — skip its
  //    generic "no-vocab" because the level requirement above is more specific.
  const prepProblem = g.issues.some((i) => i.kind === 'wrong-prep' || i.kind === 'missing-prep');
  for (const gi of g.issues) {
    if (gi.kind === 'no-vocab') continue;
    issues.push({ kind: gi.kind, message: gi.message });
  }

  const requirementMet =
    mode === 'in' ? clothingPresent : mode === 'with' ? featurePresent : (clothingPresent && featurePresent);

  const blocked = foul;
  const hardFail = issues.some((i) => i.kind === 'framework' || i.kind === 'gender' || i.kind === 'spelling');
  const ok = !blocked && requirementMet && !prepProblem && !hardFail;

  return { ok, blocked, grade: g, attrs, issues };
}
