import type { ScentFamily } from "./types";

export type MoodId = "A" | "B" | "C" | "D" | "E" | "F";
export type MomentId = "day" | "evening" | "anytime";
export type StrengthId = 1 | 2 | 3;

export type MoodOption = {
  id: MoodId;
  label: string;
  tags: readonly ScentFamily[];
};

export type MomentOption = {
  id: MomentId;
  label: string;
};

export type StrengthOption = {
  id: StrengthId;
  label: string;
};

export const MOOD_OPTIONS: readonly MoodOption[] = [
  {
    id: "A",
    label: "Warmth that stays close",
    tags: ["warm", "amber"],
  },
  {
    id: "B",
    label: "Something sharp and self-assured",
    tags: ["spicy", "woody"],
  },
  {
    id: "C",
    label: "Soft florals, quietly done",
    tags: ["floral", "powdery"],
  },
  {
    id: "D",
    label: "Salt air and open water",
    tags: ["aquatic", "fresh"],
  },
  {
    id: "E",
    label: "Calm, like a forest after rain",
    tags: ["green", "fresh", "woody"],
  },
  {
    id: "F",
    label: "Comfort, with a little indulgence",
    tags: ["sweet", "gourmand"],
  },
] as const;

export const MOMENT_OPTIONS: readonly MomentOption[] = [
  { id: "day", label: "In daylight" },
  { id: "evening", label: "After dark" },
  { id: "anytime", label: "Whenever, it isn't fussy" },
] as const;

export const STRENGTH_OPTIONS: readonly StrengthOption[] = [
  { id: 1, label: "Close to the skin" },
  { id: 2, label: "Noticeable, not loud" },
  { id: 3, label: "A trail behind you" },
] as const;

/**
 * Intensity is not stored in the database. It is a scoring-only attribute
 * defined here, by slug, so the seed data and the schema stay unchanged.
 * Values are 1 (close), 2 (noticeable), 3 (trail).
 */
export const FRAGRANCE_INTENSITY: Readonly<Record<string, StrengthId>> = {
  "eko-nights": 3,
  harmattan: 3,
  lagoon: 1,
  adire: 2,
  "palm-wine": 2,
  iroko: 3,
  "night-bloom": 3,
  "first-rain": 1,
} as const;

export type QuizAnswers = {
  mood: MoodId;
  moment: MomentId;
  strength: StrengthId;
};