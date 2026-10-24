import { AvatarAttrs, GradeIssue, GradeResult } from './types';
import { SPELLING_HINTS, COLOR_WORDS } from './vocab';

// Detect an explicit colour word sitting just before a clothing/accessory word,
// e.g. "yellow trousers" → bottomColor yellow. Returns only the colours the
// student actually wrote, so the random palette can fill in the rest.
function parseColors(t: string): { topColor?: string; bottomColor?: string; accentColor?: string } {
  const out: { topColor?: string; bottomColor?: string; accentColor?: string } = {};
  const TOP = ['t-shirt', 'tshirt', 't shirt', 'shirt', 'dress', 'suit'];
  const BOTTOM = ['shorts', 'jeans', 'trousers', 'skirt'];
  const ACCENT = ['socks', 'gloves', 'belt', 'scarf', 'tie'];
  const words = t.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const hex = COLOR_WORDS[words[i]];
    if (!hex) continue;
    // look at the next few words for an item the colour describes
    for (let j = i + 1; j < Math.min(i + 4, words.length); j++) {
      const w = words[j];
      if (TOP.includes(w)) { out.topColor = hex; break; }
      if (BOTTOM.includes(w)) { out.bottomColor = hex; break; }
      if (ACCENT.includes(w)) { out.accentColor = hex; break; }
      if (COLOR_WORDS[w]) continue; // allow "light blue"-style skips
    }
  }
  return out;
}

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
  if (/\bsuit\b/.test(t)) top = 'suit';
  if (/\bshorts\b/.test(t)) bottom = 'shorts';
  if (/\bjeans\b/.test(t)) bottom = 'jeans';
  if (/\btrousers?\b/.test(t)) bottom = 'trousers';
  if (/\bskirt\b/.test(t)) bottom = 'skirt';

  const footwear: AvatarAttrs['footwear'] = /\bsandals?\b/.test(t) ? 'sandals' : 'shoes';

  // hair (governed by "with")
  let hair: AvatarAttrs['hair'] = 'short';
  if (/\bpony[\s-]?tail\b/.test(t)) hair = 'ponytail';
  else if (/long hair/.test(t)) hair = 'long';
  else if (/curl(y|ey) hair/.test(t)) hair = 'curly';
  else if (/straight hair/.test(t)) hair = 'straight';
  else if (/short hair/.test(t)) hair = 'short';

  const sunglasses = /\bsunglasses\b/.test(t);
  const attrs: AvatarAttrs = {
    gender,
    hair,
    top,
    bottom,
    footwear,
    socks: /\bsocks?\b/.test(t),
    beard: /\bbeard\b/.test(t),
    moustache: /\bmoustache\b|\bmustache\b/.test(t),
    earrings: /\bear[\s-]?rings?\b|\bearing\b/.test(t),
    necklace: /\bneckla/.test(t),
    handbag: /\bhand[\s-]?bag\b/.test(t),
    gloves: /\bgloves?\b/.test(t),
    belt: /\bbelt\b/.test(t),
    scarf: /\bscarf\b|\bscarves\b/.test(t),
    watch: /\bwatch\b/.test(t),
    sunglasses,
    glasses: /\bglasses\b/.test(t) && !sunglasses,
  };
  // explicit colours the student typed override the random palette later
  const colors = parseColors(t);
  if (colors.topColor) attrs.topColor = colors.topColor;
  if (colors.bottomColor) attrs.bottomColor = colors.bottomColor;
  if (colors.accentColor) attrs.accentColor = colors.accentColor;
  return attrs;
}

// Describe which preposition zone a word index falls into.
function zoneOf(idx: number, iIn: number, iWith: number): 'in' | 'with' | 'none' {
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

  // clothing → "in"
  pushIf(/t[\s-]?shirt/, 't-shirt', 'in', 'clothing');
  pushIf(/\bshorts\b/, 'shorts', 'in', 'clothing');
  pushIf(/\bjeans\b/, 'jeans', 'in', 'clothing');
  pushIf(/\btrousers?\b/, 'trousers', 'in', 'clothing');
  pushIf(/\bdress\b/, 'dress', 'in', 'clothing');
  pushIf(/\bskirt\b/, 'skirt', 'in', 'clothing');
  pushIf(/\bsuit\b/, 'suit', 'in', 'clothing');
  pushIf(/\bsandals?\b/, 'sandals', 'in', 'clothing');
  pushIf(/\bsocks?\b/, 'socks', 'in', 'clothing');

  // appearance + accessories → "with"
  pushIf(/\bhair\b/, 'hair', 'with', 'feature');
  pushIf(/\bpony[\s-]?tail\b/, 'ponytail', 'with', 'feature');
  pushIf(/\bbeard\b/, 'beard', 'with', 'feature');
  pushIf(/\bmoustache\b|\bmustache\b/, 'moustache', 'with', 'feature');
  pushIf(/\bear[\s-]?rings?\b|\bearing\b/, 'earrings', 'with', 'feature');
  pushIf(/\bneckla/, 'necklace', 'with', 'feature');
  pushIf(/\bhand[\s-]?bag\b/, 'handbag', 'with', 'feature');
  pushIf(/\bgloves?\b/, 'gloves', 'with', 'feature');
  pushIf(/\bbelt\b/, 'belt', 'with', 'feature');
  pushIf(/\bscarf\b|\bscarves\b/, 'scarf', 'with', 'feature');
  pushIf(/\bwatch\b/, 'watch', 'with', 'feature');
  pushIf(/\bsunglasses\b/, 'sunglasses', 'with', 'feature');
  if (!attrs.sunglasses) pushIf(/\bglasses\b/, 'glasses', 'with', 'feature');

  const issues: GradeIssue[] = [];

  // spelling
  for (const h of SPELLING_HINTS) {
    if (h.wrong.test(raw)) {
      issues.push({ kind: 'spelling', message: `Spelling: it should be <b>${h.right}</b>.` });
    }
  }

  const hasClothing = checks.some((c) => c.cat === 'clothing');
  const hasFeature = checks.some((c) => c.cat === 'feature');

  if (hasClothing && iIn < 0) {
    issues.push({ kind: 'missing-prep', message: `Clothing needs <b>in</b> (e.g. <i>in a t-shirt</i>) — "in" is missing.` });
  }
  if (hasFeature && iWith < 0) {
    issues.push({ kind: 'missing-prep', message: `Appearance needs <b>with</b> (e.g. <i>with glasses</i>) — "with" is missing.` });
  }

  for (const c of checks) {
    const z = zoneOf(c.idx, iIn, iWith);
    if (z === c.expect) continue;
    if (z === 'in' && c.expect === 'with') {
      issues.push({ kind: 'wrong-prep', message: `<b>${c.name}</b> is an appearance word — use <b>with</b>, not "in".` });
    } else if (z === 'with' && c.expect === 'in') {
      issues.push({ kind: 'wrong-prep', message: `<b>${c.name}</b> is clothing — use <b>in</b>, not "with".` });
    } else if (z === 'none') {
      issues.push({ kind: 'wrong-prep', message: `<b>${c.name}</b> is missing the correct preposition (${c.expect}).` });
    }
  }

  if (checks.length === 0) {
    issues.push({ kind: 'no-vocab', message: `No practice words found. Try words like <i>in a t-shirt</i> or <i>with glasses</i>.` });
  }

  if (checks.length > 0 && !/\bi am\b|\bis\b|\bhas\b|\bhe\b|\bshe\b/.test(t)) {
    issues.push({ kind: 'structure', message: `Try a full sentence, e.g. <i>I am the boy…</i> or <i>She is the girl…</i>.` });
  }

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
  if (a.top === 'suit') chips.push({ label: 'a suit', prep: 'in' });
  if (a.bottom) chips.push({ label: a.bottom, prep: 'in' });
  if (a.footwear === 'sandals') chips.push({ label: 'sandals', prep: 'in' });
  if (a.socks) chips.push({ label: 'socks', prep: 'in' });
  if (a.hair === 'ponytail') chips.push({ label: 'a ponytail', prep: 'with' });
  else if (a.hair) chips.push({ label: `${a.hair} hair`, prep: 'with' });
  if (a.beard) chips.push({ label: 'a beard', prep: 'with' });
  if (a.moustache) chips.push({ label: 'a moustache', prep: 'with' });
  if (a.glasses) chips.push({ label: 'glasses', prep: 'with' });
  if (a.sunglasses) chips.push({ label: 'sunglasses', prep: 'with' });
  if (a.earrings) chips.push({ label: 'earrings', prep: 'with' });
  if (a.necklace) chips.push({ label: 'a necklace', prep: 'with' });
  if (a.handbag) chips.push({ label: 'a handbag', prep: 'with' });
  if (a.gloves) chips.push({ label: 'gloves', prep: 'with' });
  if (a.belt) chips.push({ label: 'a belt', prep: 'with' });
  if (a.scarf) chips.push({ label: 'a scarf', prep: 'with' });
  if (a.watch) chips.push({ label: 'a watch', prep: 'with' });
  return chips;
}
