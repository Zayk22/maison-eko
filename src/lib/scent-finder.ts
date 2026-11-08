import { SEED_FRAGRANCES } from "@/data/seed-data";
import {
  FRAGRANCE_INTENSITY,
  MOOD_OPTIONS,
  type QuizAnswers,
  type StrengthId,
} from "./scent-config";

export type ScoredFragrance = {
  slug: string;
  name: string;
  score: number;
};

export type ScentFinderResult = {
  bestMatch: ScoredFragrance;
  runnerUp: ScoredFragrance | null;
};

const MOOD_CAP = 6;

/**
 * Score one fragrance against the answers. Pure; no I/O.
 *
 * Mood: +3 per matched tag, capped at +6. The cap is deliberate: mood E
 * has three tags, and without a cap a three-tag option would always win
 * by tag count rather than by fit.
 *
 * Moment: exact tag +2. A fragrance tagged "anytime" gains +1 when the
 * user picks "day" or "evening". A user picking "anytime" gains +2 when
 * the fragrance is also tagged "anytime", and 0 otherwise.
 *
 * Strength: exact +4, one step away +1, two steps away 0.
 */
function scoreOne(
  slug: string,
  tags: readonly string[],
  momentTags: readonly string[],
  intensity: StrengthId,
  answers: QuizAnswers,
): number {
  const mood = MOOD_OPTIONS.find((m) => m.id === answers.mood);
  if (!mood) throw new Error(`Unknown mood: ${answers.mood}`);

  let moodScore = 0;
  for (const tag of mood.tags) {
    if (tags.includes(tag)) moodScore += 3;
  }
  if (moodScore > MOOD_CAP) moodScore = MOOD_CAP;

  let momentScore = 0;
  if (momentTags.includes(answers.moment)) {
    momentScore = 2;
  } else if (
    momentTags.includes("anytime") &&
    (answers.moment === "day" || answers.moment === "evening")
  ) {
    momentScore = 1;
  } else if (answers.moment === "anytime" && momentTags.includes("anytime")) {
    momentScore = 2;
  }

  const diff = Math.abs(intensity - answers.strength);
  const strengthScore = diff === 0 ? 4 : diff === 1 ? 1 : 0;

  return moodScore + momentScore + strengthScore;
}

/**
 * Score all fragrances and return the best match and runner-up.
 * Tie-break order: higher score, then earlier position in the seed file,
 * then alphabetical slug. The last rule is a defence so two equal-position
 * entries cannot produce unstable output; it should never trigger with
 * the current eight.
 */
export function findScentMatch(answers: QuizAnswers): ScentFinderResult {
  if (SEED_FRAGRANCES.length === 0) {
    throw new Error("No fragrances to score against.");
  }

  const scored: (ScoredFragrance & { position: number })[] =
    SEED_FRAGRANCES.map((f, index) => {
      const intensity = FRAGRANCE_INTENSITY[f.slug];
      if (intensity === undefined) {
        throw new Error(
          `Missing intensity for fragrance ${f.slug}. Add it to FRAGRANCE_INTENSITY.`,
        );
      }
      return {
        slug: f.slug,
        name: f.name,
        score: scoreOne(f.slug, f.tags, f.tags, intensity, answers),
        position: index,
      };
    });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.position !== b.position) return a.position - b.position;
    return a.slug.localeCompare(b.slug);
  });

  const best = scored[0]!;
  const runnerUp = scored.length > 1 ? scored[1]! : null;

  return {
    bestMatch: { slug: best.slug, name: best.name, score: best.score },
    runnerUp: runnerUp
      ? { slug: runnerUp.slug, name: runnerUp.name, score: runnerUp.score }
      : null,
  };
}