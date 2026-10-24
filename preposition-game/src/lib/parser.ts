import { AvatarAttrs, GradeIssue, GradeResult } from './types';
import { SPELLING_HINTS } from './vocab';

// ----------------------------------------------------------------------------
// Sentence parser: turn a free-typed English sentence into structured attributes.
// Because the worksheet vocabulary is closed, a rule-based parser is far more
// reliable (and instant) than any generative model.
// ----------------------------------------------------------------------------

export function parse(raw: string): AvatarAttrs {
  const t = ' ' + raw.toLowerCase().replace(/[.,!?]/g, ' ') + ' ';

  const gender = /\bgirl\b/.test(t) ? 'girl' : /\bboy\b/.test(t) ? 'boy' : 'boy';

  // clothing (governed by "in")
  let top: AvatarAttrs['top'] = null;
  let bottom: AvatarAttrs['bottom'] = null;
  if (/t[\s-]?shirt/.test(t)) top = 'tshirt';
  if (/\bdress\b/.test(t)) top = 'dress';
  if (/\bshorts\b/.test(t)) bottom = 'shorts';
  if (/\bjeans\b/.test(t)) bottom = 'jeans';
  if (/\btrousers?\b/.test(t)) bottom = 'trousers';
  if (/\bskirt\b/.test(t)) bottom = 'skirt';

  // hair (governed by "with")
  let hair: AvatarAttrs['hair'] = 'short';
  if (/long hair/.test(t)) hair = 'long';
  else if (/curl(y|ey) hair/.test(t)) hair = 'curly';
  else if (/short hair/.test(t)) hair = 'short';

  const sunglasses = /\bsunglasses\b/.test(t);
  const attrs: AvatarAttrs = {
    gender,
    hair,
    top,
    bottom,
    beard: /\bbeard\b/.test(t),
    moustache: /\bmoustache\b|\bmustache\b/.test(t),
    earrings: /\bear[\s-]?rings?\b|\bearing\b/.test(t),
    necklace: /\bneckla/.test(t),
    handbag: /\bhand[\s-]?bag\b/.test(t),
    sunglasses,
    glasses: /\bglasses\b/.test(t) && !sunglasses,
  };
  return attrs;
}

// Describe which preposition zone a word index falls into.
function zoneOf(idx: number, iIn: number, iWith: number): 'in' | 'with' | 'none' {
  // "with" usually comes after "in"; nearest preceding preposition wins.
  const prepositions = [
    { name: 'in' as const, idx: iIn },
    { name: 'with' as const, idx: iWith },
  ]
    .filter((p) => p.idx >= 0 && p.idx < idx)
    .sort((a, b) => b.idx - a.idx);
  return prepositions.length ? prepositions[0].name : 'none';
}

interface Check {
  name: string;
  idx: number;
  expect: 'in' | 'with';
  cat: 'clothing' | 'feature';
}

// ----------------------------------------------------------------------------
// Grader: check in/with usage, spelling, and sentence completeness.
// ----------------------------------------------------------------------------
export function grade(raw: string): GradeResult {
  const attrs = parse(raw);
  const t = raw.toLowerCase().replace(/[.,!?]/g, ' ');
  const iIn = t.search(/\bin\b/);
  const iWith = t.search(/\bwith\b/);

  const checks: Check[] = [];
  const pushIf = (re: RegExp, name: string, expect: 'in' | 'with', cat: Check['cat']) => {
    const m = t.search(re);
    if (m >= 0) checks.push({ name, idx: m, expect, cat });
  };

  pushIf(/t[\s-]?shirt/, 't-shirt', 'in', 'clothing');
  pushIf(/\bshorts\b/, 'shorts', 'in', 'clothing');
  pushIf(/\bjeans\b/, 'jeans', 'in', 'clothing');
  pushIf(/\btrousers?\b/, 'trousers', 'in', 'clothing');
  pushIf(/\bdress\b/, 'dress', 'in', 'clothing');
  pushIf(/\bskirt\b/, 'skirt', 'in', 'clothing');

  pushIf(/\bhair\b/, 'hair', 'with', 'feature');
  pushIf(/\bbeard\b/, 'beard', 'with', 'feature');
  pushIf(/\bmoustache\b|\bmustache\b/, 'moustache', 'with', 'feature');
  pushIf(/\bear[\s-]?rings?\b|\bearing\b/, 'earrings', 'with', 'feature');
  pushIf(/\bneckla/, 'necklace', 'with', 'feature');
  pushIf(/\bhand[\s-]?bag\b/, 'handbag', 'with', 'feature');
  pushIf(/\bsunglasses\b/, 'sunglasses', 'with', 'feature');
  if (!attrs.sunglasses) pushIf(/\bglasses\b/, 'glasses', 'with', 'feature');

  const issues: GradeIssue[] = [];

  // spelling
  for (const h of SPELLING_HINTS) {
    if (h.wrong.test(raw)) {
      issues.push({
        kind: 'spelling',
        message: `拼寫：應該是 <b>${h.right}</b>。Check the spelling of "<b>${h.right}</b>".`,
      });
    }
  }

  const hasClothing = checks.some((c) => c.cat === 'clothing');
  const hasFeature = checks.some((c) => c.cat === 'feature');

  // missing prepositions
  if (hasClothing && iIn < 0) {
    issues.push({
      kind: 'missing-prep',
      message: `衣物要用 <b>in</b>（例：<i>in a t-shirt</i>）— 句子裡找不到 "in"。Clothing needs <b>in</b>.`,
    });
  }
  if (hasFeature && iWith < 0) {
    issues.push({
      kind: 'missing-prep',
      message: `外貌／配件要用 <b>with</b>（例：<i>with glasses</i>）— 句子裡找不到 "with"。Features need <b>with</b>.`,
    });
  }

  // wrong preposition zone
  for (const c of checks) {
    const z = zoneOf(c.idx, iIn, iWith);
    if (z === c.expect) continue;
    if (z === 'in' && c.expect === 'with') {
      issues.push({
        kind: 'wrong-prep',
        message: `<b>${c.name}</b> 是外貌／配件，要用 <b>with</b>，不是 "in"。`,
      });
    } else if (z === 'with' && c.expect === 'in') {
      issues.push({
        kind: 'wrong-prep',
        message: `<b>${c.name}</b> 是衣物，要用 <b>in</b>，不是 "with"。`,
      });
    } else if (z === 'none') {
      issues.push({
        kind: 'wrong-prep',
        message: `<b>${c.name}</b> 前面缺少正確的介詞 (${c.expect})。`,
      });
    }
  }

  // nothing recognised at all
  if (checks.length === 0) {
    issues.push({
      kind: 'no-vocab',
      message: `未偵測到練習詞彙。用表格的字試試，例如 <i>in a t-shirt</i>、<i>with glasses</i>。`,
    });
  }

  // basic structure nudge (optional, low weight)
  if (checks.length > 0 && !/\bi am\b|\bis\b|\bhas\b|\bhe\b|\bshe\b/.test(t)) {
    issues.push({
      kind: 'structure',
      message: `試試用完整句子開頭，例如 <i>I am the boy…</i> 或 <i>She is the girl…</i>。`,
    });
  }

  // dedupe wrong/missing prep issues
  const seen = new Set<string>();
  const deduped = issues.filter((i) => {
    if (seen.has(i.message)) return false;
    seen.add(i.message);
    return true;
  });

  const prepIssues = deduped.filter(
    (i) => i.kind === 'wrong-prep' || i.kind === 'missing-prep' || i.kind === 'no-vocab'
  ).length;
  const correct = prepIssues === 0 && checks.length > 0;

  // score: start 100, −25 per preposition issue, −8 per spelling, −5 structure
  let score = 100;
  for (const i of deduped) {
    if (i.kind === 'wrong-prep' || i.kind === 'missing-prep') score -= 25;
    else if (i.kind === 'no-vocab') score -= 60;
    else if (i.kind === 'spelling') score -= 8;
    else if (i.kind === 'structure') score -= 5;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    correct,
    issues: deduped,
    score,
    detected: {
      clothing: checks.filter((c) => c.cat === 'clothing').map((c) => c.name),
      features: checks.filter((c) => c.cat === 'feature').map((c) => c.name),
    },
    normalizedSentence: raw.trim(),
  };
}

// Build the human-readable "in …/with …" attribute chips from parsed attrs.
export function attrChips(a: AvatarAttrs): Array<{ label: string; prep: 'in' | 'with' }> {
  const chips: Array<{ label: string; prep: 'in' | 'with' }> = [];
  if (a.top === 'tshirt') chips.push({ label: 'a t-shirt', prep: 'in' });
  if (a.top === 'dress') chips.push({ label: 'a dress', prep: 'in' });
  if (a.bottom) chips.push({ label: a.bottom, prep: 'in' });
  if (a.hair) chips.push({ label: `${a.hair} hair`, prep: 'with' });
  if (a.beard) chips.push({ label: 'a beard', prep: 'with' });
  if (a.moustache) chips.push({ label: 'a moustache', prep: 'with' });
  if (a.glasses) chips.push({ label: 'glasses', prep: 'with' });
  if (a.sunglasses) chips.push({ label: 'sunglasses', prep: 'with' });
  if (a.earrings) chips.push({ label: 'earrings', prep: 'with' });
  if (a.necklace) chips.push({ label: 'a necklace', prep: 'with' });
  if (a.handbag) chips.push({ label: 'a handbag', prep: 'with' });
  return chips;
}
