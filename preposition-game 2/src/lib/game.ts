import { AvatarAttrs } from './types';
import { parse } from './parser';
import { SKIN_TONES, HAIR_COLORS, TOP_PALETTE, BOTTOM_PALETTE, ACCENT_PALETTE } from './vocab';

// Built-in sample sentences for class mode when the teacher's question bank is empty.
export const SAMPLE_SENTENCES: string[] = [
  'I am the boy in a t-shirt with short hair and glasses.',
  'I am the girl in a dress with long hair and a necklace.',
  'I am the boy in jeans with a beard and sunglasses.',
  'I am the girl in a skirt with a ponytail and earrings.',
  'I am the boy in a suit with short hair and a watch.',
  'I am the girl in trousers with straight hair and a handbag.',
  'I am the boy in shorts with curly hair and a belt.',
  'I am the girl in a dress with a scarf and gloves.',
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Give an avatar lots of random colour/scene variety so hundreds of avatars
// rarely look identical even when two students write the same sentence.
// Any colour the student explicitly wrote (already on the attrs) is preserved.
export function withPalette(a: AvatarAttrs): AvatarAttrs {
  const patterns: AvatarAttrs['pattern'][] = ['none', 'none', 'stripes', 'dots'];
  const scenes: AvatarAttrs['scene'][] = ['plain', 'classroom', 'park'];
  return {
    ...a,
    skin: a.skin ?? Math.floor(Math.random() * SKIN_TONES.length),
    hairColor: a.hairColor ?? Math.floor(Math.random() * HAIR_COLORS.length),
    topColor: a.topColor ?? pick(TOP_PALETTE),
    bottomColor: a.bottomColor ?? pick(BOTTOM_PALETTE),
    accentColor: a.accentColor ?? pick(ACCENT_PALETTE),
    pattern: pick(patterns),
    scene: pick(scenes),
  };
}

// A "visual signature" of the features that actually change how the avatar is
// DRAWN. Two attrs with the same signature render identically. Crucially,
// trousers and jeans share one silhouette, so flipping between them is NOT a
// visible change and must never be used as a distractor.
function bottomSil(b: AvatarAttrs['bottom']): string {
  if (b === 'trousers' || b === 'jeans') return 'pants';
  return b ?? 'none';
}
function visualSig(a: AvatarAttrs): string {
  return [
    a.top ?? 'none',
    bottomSil(a.bottom),
    a.footwear,
    a.hair,
    a.socks, a.beard, a.moustache, a.earrings, a.necklace, a.handbag,
    a.gloves, a.belt, a.scarf, a.watch, a.glasses, a.sunglasses,
  ].map(String).join('|');
}

// Build a distractor by flipping EXACTLY ONE attribute the sentence actually
// STATES — AND only a flip that produces a VISIBLE difference (verified against
// the base's visual signature). This fixes the "A and B look identical" bug.
export function makeDistractor(a: AvatarAttrs, sentence = ''): { attrs: AvatarAttrs; changed: string } {
  const t = ' ' + sentence.toLowerCase() + ' ';
  const hairMentioned = /\bhair\b|\bpony[\s-]?tail\b/.test(t);
  const flips: Array<{ label: string; apply: (d: AvatarAttrs) => void }> = [];

  // tops — always a clearly different silhouette
  if (a.top === 'tshirt') flips.push({ label: 'top', apply: (d) => { d.top = 'suit'; } });
  else if (a.top === 'suit') flips.push({ label: 'top', apply: (d) => { d.top = 'tshirt'; } });
  else if (a.top === 'dress') flips.push({ label: 'top', apply: (d) => { d.top = 'tshirt'; d.bottom = 'skirt'; } });

  // bottoms — change LENGTH/silhouette so it is always visible
  // (never trousers<->jeans, which look the same)
  if (a.bottom === 'jeans' || a.bottom === 'trousers') flips.push({ label: 'bottom', apply: (d) => { d.bottom = 'shorts'; } });
  else if (a.bottom === 'shorts') flips.push({ label: 'bottom', apply: (d) => { d.bottom = 'trousers'; } });
  else if (a.bottom === 'skirt') flips.push({ label: 'bottom', apply: (d) => { d.bottom = 'shorts'; } });

  // footwear
  if (a.footwear === 'sandals') flips.push({ label: 'footwear', apply: (d) => { d.footwear = 'shoes'; } });

  // hair — pick a DIFFERENT, clearly distinct style
  if (hairMentioned) {
    const distinctFrom: Record<string, AvatarAttrs['hair'][]> = {
      short: ['long', 'curly', 'ponytail'],
      long: ['short', 'curly', 'ponytail'],
      straight: ['short', 'curly', 'ponytail'],
      curly: ['short', 'long', 'ponytail'],
      ponytail: ['short', 'long', 'curly'],
    };
    const opts = distinctFrom[a.hair] ?? ['short', 'long'];
    const to = opts[Math.floor(Math.random() * opts.length)];
    flips.push({ label: 'hair', apply: (d) => { d.hair = to; } });
  }

  // boolean accessories — toggling any of these is always visible
  if (a.socks) flips.push({ label: 'socks', apply: (d) => { d.socks = false; } });
  if (a.glasses) flips.push({ label: 'glasses', apply: (d) => { d.glasses = false; } });
  if (a.sunglasses) flips.push({ label: 'sunglasses', apply: (d) => { d.sunglasses = false; } });
  if (a.beard) flips.push({ label: 'beard', apply: (d) => { d.beard = false; } });
  if (a.moustache) flips.push({ label: 'moustache', apply: (d) => { d.moustache = false; } });
  if (a.earrings) flips.push({ label: 'earrings', apply: (d) => { d.earrings = false; } });
  if (a.necklace) flips.push({ label: 'necklace', apply: (d) => { d.necklace = false; } });
  if (a.handbag) flips.push({ label: 'handbag', apply: (d) => { d.handbag = false; } });
  if (a.gloves) flips.push({ label: 'gloves', apply: (d) => { d.gloves = false; } });
  if (a.belt) flips.push({ label: 'belt', apply: (d) => { d.belt = false; } });
  if (a.scarf) flips.push({ label: 'scarf', apply: (d) => { d.scarf = false; } });
  if (a.watch) flips.push({ label: 'watch', apply: (d) => { d.watch = false; } });

  // Keep ONLY flips that actually change how the avatar is drawn.
  const baseSig = visualSig(a);
  const valid = flips.filter((f) => {
    const d: AvatarAttrs = { ...a };
    f.apply(d);
    return visualSig(d) !== baseSig;
  });

  // Fallbacks guarantee a visible difference even for a bare sentence.
  if (valid.length === 0) {
    const d: AvatarAttrs = { ...a };
    if (a.glasses) { d.glasses = false; return { attrs: d, changed: 'glasses' }; }
    d.glasses = true;
    return { attrs: d, changed: 'glasses' };
  }

  const chosen = valid[Math.floor(Math.random() * valid.length)];
  const d: AvatarAttrs = { ...a };
  chosen.apply(d);
  return { attrs: d, changed: chosen.label };
}

export function parseWithPalette(sentence: string): AvatarAttrs {
  return withPalette(parse(sentence));
}
