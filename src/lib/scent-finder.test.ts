import { describe, it, expect } from "vitest";
import { findScentMatch } from "./scent-finder";
import {
  FRAGRANCE_INTENSITY,
  MOOD_OPTIONS,
  MOMENT_OPTIONS,
  STRENGTH_OPTIONS,
  type QuizAnswers,
} from "./scent-config";
import { SEED_FRAGRANCES } from "@/data/seed-data";

function enumerateAnswers(): QuizAnswers[] {
  const out: QuizAnswers[] = [];
  for (const mood of MOOD_OPTIONS) {
    for (const moment of MOMENT_OPTIONS) {
      for (const strength of STRENGTH_OPTIONS) {
        out.push({ mood: mood.id, moment: moment.id, strength: strength.id });
      }
    }
  }
  return out;
}

describe("scent-config sanity", () => {
  it("has 6 moods, 3 moments, 3 strengths", () => {
    expect(MOOD_OPTIONS.length).toBe(6);
    expect(MOMENT_OPTIONS.length).toBe(3);
    expect(STRENGTH_OPTIONS.length).toBe(3);
  });

  it("has intensity for every seed fragrance and no extras", () => {
    const seedSlugs = new Set(SEED_FRAGRANCES.map((f) => f.slug));
    const intensitySlugs = new Set(Object.keys(FRAGRANCE_INTENSITY));
    expect(intensitySlugs.size).toBe(seedSlugs.size);
    for (const slug of seedSlugs) {
      expect(intensitySlugs.has(slug)).toBe(true);
    }
    for (const slug of intensitySlugs) {
      expect(seedSlugs.has(slug)).toBe(true);
    }
  });
});

describe("findScentMatch", () => {
  it("enumerates exactly 54 answer combinations", () => {
    expect(enumerateAnswers().length).toBe(54);
  });

  it("every fragrance is the best match for at least one combination", () => {
    const allAnswers = enumerateAnswers();
    const winners = new Set<string>();
    for (const answers of allAnswers) {
      const result = findScentMatch(answers);
      winners.add(result.bestMatch.slug);
    }
    for (const fragrance of SEED_FRAGRANCES) {
      expect(winners.has(fragrance.slug)).toBe(true);
    }
  });

  it("is deterministic: same answers give the same result", () => {
    const allAnswers = enumerateAnswers();
    for (const answers of allAnswers) {
      const a = findScentMatch(answers);
      const b = findScentMatch(answers);
      expect(a).toEqual(b);
    }
  });

  it("runner-up is always defined and distinct from best match", () => {
    for (const answers of enumerateAnswers()) {
      const result = findScentMatch(answers);
      expect(result.runnerUp).not.toBeNull();
      expect(result.runnerUp!.slug).not.toBe(result.bestMatch.slug);
    }
  });

  it("runner-up score is never higher than the best match score", () => {
    for (const answers of enumerateAnswers()) {
      const result = findScentMatch(answers);
      expect(result.runnerUp!.score).toBeLessThanOrEqual(result.bestMatch.score);
    }
  });
});