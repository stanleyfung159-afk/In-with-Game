// Shared types for the Preposition Game app

export type Gender = 'boy' | 'girl';
export type Hair = 'short' | 'long' | 'curly' | 'straight' | 'ponytail';
export type Top = 'tshirt' | 'dress' | 'suit' | null;
export type Bottom = 'shorts' | 'jeans' | 'trousers' | 'skirt' | null;
export type Footwear = 'shoes' | 'sandals';

// Structured attributes parsed from a student sentence.
// This is the single source of truth that drives grading AND avatar rendering.
export interface AvatarAttrs {
  gender: Gender;
  hair: Hair;
  top: Top;
  bottom: Bottom;
  footwear: Footwear;
  socks: boolean;
  beard: boolean;
  moustache: boolean;
  earrings: boolean;
  necklace: boolean;
  handbag: boolean;
  gloves: boolean;
  belt: boolean;
  scarf: boolean;
  watch: boolean;
  glasses: boolean;
  sunglasses: boolean;
  // Optional palette variety for class mode / avatars
  skin?: number; // index into SKIN_TONES
  hairColor?: number; // index into HAIR_COLORS
  topColor?: string;
  bottomColor?: string;
  accentColor?: string; // socks / scarf / gloves accent
  pattern?: 'none' | 'stripes' | 'dots'; // clothing pattern
  scene?: 'plain' | 'classroom' | 'park'; // background scene
}

// Result of an optional AI-powered deeper grade.
export interface AiGrade {
  correct: boolean;
  score: number;
  feedback: string;
  correction: string; // a corrected version of the sentence
}

export interface GradeIssue {
  kind: 'wrong-prep' | 'missing-prep' | 'spelling' | 'no-vocab' | 'structure';
  message: string;
}

export interface GradeResult {
  correct: boolean;
  issues: GradeIssue[];
  score: number; // 0-100
  detected: { clothing: string[]; features: string[] };
  normalizedSentence: string;
}

export interface Submission {
  id: string;
  studentName: string;
  className: string;
  sentence: string;
  correct: boolean;
  score: number;
  attrs: AvatarAttrs;
  issues: string[];
  timestamp: number;
}

export interface Question {
  id: string;
  prompt: string; // the target sentence students should read / match
  attrs: AvatarAttrs;
  createdBy: string;
  timestamp: number;
}
