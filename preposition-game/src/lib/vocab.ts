// Closed vocabulary from the worksheet — this is WHY avatar composition works:
// every option is known in advance, so we never need unstable AI image generation.

export const CLOTHING_IN = ['t-shirt', 'shorts', 'jeans', 'trousers', 'dress', 'skirt'];
export const FEATURES_WITH = [
  'long hair', 'short hair', 'curly hair', 'beard', 'moustache',
  'earrings', 'necklace', 'handbag', 'sunglasses', 'glasses',
];

// Palette for avatar variety (used in class mode so avatars don't all look identical)
export const SKIN_TONES = [
  { base: '#f8d5b5', dark: '#e8b98f' },
  { base: '#f3c99d', dark: '#e0ad7d' },
  { base: '#e0ac7e', dark: '#c98f5f' },
  { base: '#c68642', dark: '#a86a2e' },
  { base: '#8d5524', dark: '#6f4019' },
];

export const HAIR_COLORS = ['#2b2118', '#43301d', '#6b4423', '#9a6a3a', '#d9a441', '#555'];

export const TOP_COLORS: Record<string, string> = {
  tshirt: '#4f9ce8',
  dress: '#e85b9c',
};
export const BOTTOM_COLORS: Record<string, string> = {
  shorts: '#f59e0b',
  trousers: '#5b6472',
  jeans: '#3b6fb0',
  skirt: '#8b5cf6',
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
];
