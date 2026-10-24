import { AvatarAttrs } from './types';
import { parse } from './parser';
import { SKIN_TONES, HAIR_COLORS } from './vocab';

// Built-in sample sentences for class mode when the teacher's question bank is empty.
export const SAMPLE_SENTENCES: string[] = [
  'I am the boy in a t-shirt with short hair and glasses.',
  'I am the girl in a dress with long hair and a necklace.',
  'I am the boy in jeans with a beard and sunglasses.',
  'I am the girl in a skirt with curly hair and earrings.',
  'I am the boy in shorts with a moustache and glasses.',
  'I am the girl in trousers with short hair and a handbag.',
];

// Give an avatar a little random palette variety so a class of avatars looks lively.
export function withPalette(a: AvatarAttrs, seed = Math.random()): AvatarAttrs {
  const r = (n: number) => Math.floor(((seed * (n + 7) * 9301 + 49297) % 233280) / 233280 * n);
  const patterns: AvatarAttrs['pattern'][] = ['none', 'none', 'stripes', 'dots'];
  const scenes: AvatarAttrs['scene'][] = ['plain', 'classroom', 'park'];
  return {
    ...a,
    skin: r(SKIN_TONES.length),
    hairColor: r(HAIR_COLORS.length),
    pattern: patterns[r(patterns.length)],
    scene: scenes[r(scenes.length)],
  };
}

// Build a distractor by flipping EXACTLY ONE practised attribute, so the
// left/right "which picture?" choice always hinges on the preposition content
// being practised — never on random noise.
export function makeDistractor(a: AvatarAttrs): { attrs: AvatarAttrs; changed: string } {
  const flips: Array<{ label: string; apply: (d: AvatarAttrs) => void }> = [];

  if (a.glasses) flips.push({ label: 'glasses', apply: (d) => { d.glasses = false; } });
  else flips.push({ label: 'glasses', apply: (d) => { d.glasses = true; d.sunglasses = false; } });

  if (a.hair === 'short') flips.push({ label: 'hair', apply: (d) => { d.hair = 'long'; } });
  else flips.push({ label: 'hair', apply: (d) => { d.hair = 'short'; } });

  if (a.top === 'tshirt') flips.push({ label: 'top', apply: (d) => { d.top = 'dress'; d.bottom = null; } });
  else if (a.top === 'dress') flips.push({ label: 'top', apply: (d) => { d.top = 'tshirt'; d.bottom = 'skirt'; } });

  if (a.bottom === 'jeans') flips.push({ label: 'bottom', apply: (d) => { d.bottom = 'shorts'; } });
  else if (a.bottom === 'shorts') flips.push({ label: 'bottom', apply: (d) => { d.bottom = 'trousers'; } });

  if (a.beard) flips.push({ label: 'beard', apply: (d) => { d.beard = false; } });
  if (a.necklace) flips.push({ label: 'necklace', apply: (d) => { d.necklace = false; } });

  const pick = flips[Math.floor(Math.random() * flips.length)];
  const d: AvatarAttrs = { ...a };
  pick.apply(d);
  return { attrs: d, changed: pick.label };
}

export function parseWithPalette(sentence: string): AvatarAttrs {
  return withPalette(parse(sentence), Math.random());
}
