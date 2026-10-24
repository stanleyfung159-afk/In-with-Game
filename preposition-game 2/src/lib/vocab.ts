// Closed vocabulary from the worksheet — this is WHY avatar composition works:
// every option is known in advance, so we never need unstable AI image generation.

// Clothing — governed by the preposition "in".
export const CLOTHING_IN = ['t-shirt', 'shorts', 'jeans', 'trousers', 'dress', 'skirt', 'suit', 'sandals', 'socks'];

// Appearance features + accessories — governed by the preposition "with".
export const FEATURES_WITH = [
  'long hair', 'short hair', 'curly hair', 'straight hair', 'a ponytail',
  'a beard', 'a moustache', 'glasses', 'sunglasses',
  'earrings', 'a necklace', 'a handbag', 'gloves', 'a belt', 'a scarf', 'a watch',
];

// Skin tones for avatar variety.
export const SKIN_TONES = [
  { base: '#f8d5b5', dark: '#e8b98f' },
  { base: '#f3c99d', dark: '#e0ad7d' },
  { base: '#e0ac7e', dark: '#c98f5f' },
  { base: '#c68642', dark: '#a86a2e' },
  { base: '#8d5524', dark: '#6f4019' },
];

export const HAIR_COLORS = ['#2b2118', '#43301d', '#6b4423', '#9a6a3a', '#d9a441', '#1f1a16', '#5c3a21'];

// Big colour palettes so hundreds of avatars rarely look identical.
export const TOP_PALETTE = [
  '#4f9ce8', '#e85b9c', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444',
  '#14b8a6', '#f97316', '#6366f1', '#ec4899', '#0ea5e9', '#84cc16',
];
export const BOTTOM_PALETTE = [
  '#5b6472', '#3b6fb0', '#f59e0b', '#8b5cf6', '#166534', '#7c2d12',
  '#334155', '#9333ea', '#b91c1c', '#0f766e', '#a16207', '#1e3a8a',
];
export const ACCENT_PALETTE = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308',
];

// Fallback defaults when no random colour has been assigned yet.
export const TOP_COLORS: Record<string, string> = {
  tshirt: '#4f9ce8',
  dress: '#e85b9c',
  suit: '#374151',
};
export const BOTTOM_COLORS: Record<string, string> = {
  shorts: '#f59e0b',
  trousers: '#5b6472',
  jeans: '#3b6fb0',
  skirt: '#8b5cf6',
};

// Colour words a student may type (e.g. "yellow trousers"). When present they
// override the random palette so the avatar matches what the student wrote.
export const COLOR_WORDS: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  black: '#1f2937',
  white: '#f3f4f6',
  grey: '#9ca3af',
  gray: '#9ca3af',
  brown: '#8a5a32',
};

// Common misspellings → canonical form, used by the grader to give spelling feedback.
export const SPELLING_HINTS: Array<{ wrong: RegExp; right: string }> = [
  { wrong: /\bmustache\b/i, right: 'moustache' },
  { wrong: /\btee?[\s-]?shirt\b/i, right: 't-shirt' },
  { wrong: /\bnecklas+e?\b/i, right: 'necklace' },
  { wrong: /\bearing\b/i, right: 'earring' },
  { wrong: /\bhandbeg\b/i, right: 'handbag' },
  { wrong: /\bglases\b/i, right: 'glasses' },
  { wrong: /\bcurley\b/i, right: 'curly' },
  { wrong: /\btrouser\b/i, right: 'trousers' },
  { wrong: /\bponeytail\b|\bpony[\s-]?tail\b/i, right: 'ponytail' },
  { wrong: /\bscalf\b/i, right: 'scarf' },
];
