"use client";

import { useEffect, useRef, useState } from "react";
import {
  MOOD_OPTIONS,
  MOMENT_OPTIONS,
  STRENGTH_OPTIONS,
  type MoodId,
  type MomentId,
  type StrengthId,
  type QuizAnswers,
} from "@/lib/scent-config";
import { findScentMatch } from "@/lib/scent-finder";
import type { ScentFinderResult } from "@/lib/scent-finder";
import { ScentFinderResultView } from "./scent-finder-result";

export type QuizProduct = {
  slug: string;
  name: string;
  description: string;
  accentHex: string;
  minPriceKobo: number | null;
};

type Props = {
  products: QuizProduct[];
};

type Step = "mood" | "moment" | "strength" | "result";

type PartialAnswers = {
  mood?: MoodId;
  moment?: MomentId;
  strength?: StrengthId;
};

export function ScentFinderQuiz({ products }: Props) {
  const [step, setStep] = useState<Step>("mood");
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [result, setResult] = useState<ScentFinderResult | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!liveRef.current) return;
    const text: Record<Step, string> = {
      mood: "Question 1 of 3",
      moment: "Question 2 of 3",
      strength: "Question 3 of 3",
      result: "Result",
    };
    liveRef.current.textContent = text[step];
  }, [step]);

  function chooseMood(id: MoodId) {
    setAnswers((a) => ({ ...a, mood: id }));
    setStep("moment");
  }

  function chooseMoment(id: MomentId) {
    setAnswers((a) => ({ ...a, moment: id }));
    setStep("strength");
  }

  function chooseStrength(id: StrengthId) {
    const next = { ...answers, strength: id };
    setAnswers(next);
    if (next.mood && next.moment && next.strength) {
      const full: QuizAnswers = {
        mood: next.mood,
        moment: next.moment,
        strength: next.strength,
      };
      setResult(findScentMatch(full));
      setStep("result");
    }
  }

  function back() {
    if (step === "moment") setStep("mood");
    else if (step === "strength") setStep("moment");
  }

  function reset() {
    setStep("mood");
    setAnswers({});
    setResult(null);
  }

  return (
    <div className="relative min-h-[420px] md:min-h-[480px]">
      <div ref={liveRef} aria-live="polite" className="sr-only" />

      {/* key forces a remount on every step, which replays the CSS animation */}
      <div key={step} className="me-step-in">
        {step === "mood" && (
          <QuestionBlock legend="What are you in the mood for?" stepLabel="1 of 3">
            {MOOD_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.id}
                label={opt.label}
                selected={answers.mood === opt.id}
                onClick={() => chooseMood(opt.id)}
              />
            ))}
          </QuestionBlock>
        )}

        {step === "moment" && (
          <QuestionBlock legend="When will you wear it?" stepLabel="2 of 3">
            {MOMENT_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.id}
                label={opt.label}
                selected={answers.moment === opt.id}
                onClick={() => chooseMoment(opt.id)}
              />
            ))}
            <BackButton onClick={back} />
          </QuestionBlock>
        )}

        {step === "strength" && (
          <QuestionBlock legend="How much presence do you want?" stepLabel="3 of 3">
            {STRENGTH_OPTIONS.map((opt) => (
              <OptionButton
                key={opt.id}
                label={opt.label}
                selected={answers.strength === opt.id}
                onClick={() => chooseStrength(opt.id)}
              />
            ))}
            <BackButton onClick={back} />
          </QuestionBlock>
        )}

        {step === "result" && result && (
          <ScentFinderResultView
            result={result}
            products={products}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

function QuestionBlock({
  legend,
  stepLabel,
  children,
}: {
  legend: string;
  stepLabel: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <div className="flex items-baseline justify-between mb-2">
        <legend className="font-display text-xl md:text-2xl text-ink">
          {legend}
        </legend>
        <span className="text-xs text-muted tabular-nums">{stepLabel}</span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </fieldset>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "w-full text-left min-h-11 px-4 py-3 rounded-control border text-base transition-colors " +
        (selected
          ? "bg-ink text-bg border-ink"
          : "bg-surface text-ink border-border-strong hover:border-ink") +
        " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      }
    >
      {label}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start mt-2 min-h-11 px-3 text-sm text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg rounded-control"
    >
      Back
    </button>
  );
}