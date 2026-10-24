// Shared types for the Preposition Game app

export type Gender = 'boy' | 'girl';
export type Hair = 'short' | 'long' | 'curly';
export type Top = 'tshirt' | 'dress' | null;
export type Bottom = 'shorts' | 'jeans' | 'trousers' | 'skirt' | null;

// Structured attributes parsed from a student sentence.
// This is the single source of truth that drives grading AND avatar rendering.
export interface AvatarAttrs {
  gender: Gender;
  hair: Hair;
  top: Top;
  bottom: Bottom;
  beard: boolean;
  moustache: boolean;
  earrings: boolean;
  necklace: boolean;
  handbag: boolean;
  glasses: boolean;
  sunglasses: boolean;
  // Optional palette variety for class mode / avatars
  skin?: number; // index into SKIN_TONES
  hairColor?: number; // index into HAIR_COLORS
  topColor?: string;
  bottomColor?: string;
  pattern?: 'none' | 'stripes' | 'dots'; // clothing pattern
  scene?: 'plain' | 'classroom' | 'park'; // background scene
}

// Result of an optional AI-powered deeper grade.
export interface AiGrade {
  correct: boolean;
  score: number;
  feedback: string; // short bilingual feedback
  correction: string; // a corrected version of the sentence
}

export interface GradeIssue {
  kind: 'wrong-prep' | 'missing-prep' | 'spelling' | 'no-vocab' | 'structure';
  message: string; // bilingual-friendly HTML string
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
