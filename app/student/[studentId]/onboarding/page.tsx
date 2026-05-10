"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@shared/components/ui/button";
import { useStudentStore } from "@shared/stores/student-store";
import { EAL_TO_CEFR, type EALLevel } from "@shared/types";

type Step = "quiz" | "interests" | "personalizing" | "done";

interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[]; // ordered easiest → hardest (A1 → B2)
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "A new friend asks how you are. Which sounds most like you?",
    options: [
      "I am happy.",
      "I feel happy today.",
      "I'm feeling really happy today because the weather is nice.",
      "I'm in a particularly cheerful mood, given the unexpectedly pleasant weather.",
    ],
  },
  {
    id: "q2",
    prompt: "“What did you do this weekend?” — Pick the answer closest to yours.",
    options: [
      "I play with family.",
      "I played games with my family.",
      "I spent the weekend playing board games with my family at home.",
      "Most of my weekend was board games with the family — we got pretty competitive about it.",
    ],
  },
  {
    id: "q3",
    prompt:
      "Which sentence best summarises this story? “Maya planted seeds. She watered them every day. After two weeks, small green leaves appeared.”",
    options: [
      "Maya plants.",
      "Maya grew plants by watering them.",
      "Maya cared for her seeds and they sprouted into small plants.",
      "Through consistent care, Maya's seeds germinated into seedlings within a fortnight.",
    ],
  },
];

interface Prefill {
  answers: number[]; // index per question
  interestPlaceholder: string;
}

const PREFILL: Record<string, Prefill> = {
  maya: { answers: [0, 0, 1], interestPlaceholder: "e.g. butterflies" },
  liam: { answers: [2, 2, 2], interestPlaceholder: "e.g. space" },
};

const DEFAULT_PREFILL: Prefill = {
  answers: [1, 1, 1],
  interestPlaceholder: "e.g. dinosaurs, soccer, music",
};

function scoreToEal(answers: number[]): EALLevel {
  const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
  if (avg < 0.75) return "Emerging";
  if (avg < 1.5) return "Developing";
  if (avg < 2.5) return "Proficient";
  return "Extending";
}

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const hydrate = useStudentStore((s) => s.hydrate);
  const updateStudent = useStudentStore((s) => s.updateStudent);
  const student = useStudentStore((s) => s.getById(studentId));

  const prefill = PREFILL[studentId] ?? DEFAULT_PREFILL;

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const [step, setStep] = useState<Step>("quiz");
  const [answers, setAnswers] = useState<number[]>(prefill.answers);
  const [interestsInput, setInterestsInput] = useState("");

  const inferredEal = useMemo(() => scoreToEal(answers), [answers]);
  const parsedInterests = useMemo(
    () =>
      interestsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [interestsInput],
  );

  function handleQuizSubmit() {
    setStep("interests");
  }

  function handleInterestsSubmit() {
    setStep("personalizing");
    setTimeout(() => {
      updateStudent(studentId, {
        ealLevel: inferredEal,
        interests: parsedInterests,
      });
      setStep("done");
    }, 1200);
  }

  const stepIndex = step === "quiz" ? 0 : step === "interests" ? 1 : 2;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <ProgressDots active={stepIndex} />

      {step === "quiz" && (
        <QuizStep
          studentName={student?.name ?? "you"}
          answers={answers}
          onChange={setAnswers}
          onContinue={handleQuizSubmit}
        />
      )}

      {step === "interests" && (
        <InterestsStep
          studentName={student?.name ?? "you"}
          value={interestsInput}
          placeholder={prefill.interestPlaceholder}
          onChange={setInterestsInput}
          onContinue={handleInterestsSubmit}
          onBack={() => setStep("quiz")}
        />
      )}

      {step === "personalizing" && <PersonalizingStep />}

      {step === "done" && (
        <DoneStep
          studentName={student?.name ?? "you"}
          ealLevel={inferredEal}
          interests={parsedInterests}
          onContinue={() => router.push(`/student/${studentId}`)}
        />
      )}
    </div>
  );
}

function ProgressDots({ active }: { active: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i === active
              ? "w-8 bg-[hsl(var(--button-primary))]"
              : i < active
                ? "w-2 bg-[hsl(var(--button-primary))]/60"
                : "w-2 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

function QuizStep({
  studentName,
  answers,
  onChange,
  onContinue,
}: {
  studentName: string;
  answers: number[];
  onChange: (next: number[]) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">📖</div>
        <h1 className="text-3xl font-bold">A quick reading check</h1>
        <p className="text-muted-foreground mt-2">
          Three questions to find the right level for {studentName}.
        </p>
      </div>

      <div className="space-y-6">
        {QUESTIONS.map((q, qi) => (
          <fieldset
            key={q.id}
            className="rounded-xl border-2 border-border bg-card p-5"
          >
            <legend className="px-2 text-sm font-semibold text-muted-foreground">
              Question {qi + 1}
            </legend>
            <p className="font-medium mb-4">{q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const checked = answers[qi] === oi;
                return (
                  <label
                    key={oi}
                    className={`flex items-start gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                      checked
                        ? "border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))]/10"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() => {
                        const next = [...answers];
                        next[qi] = oi;
                        onChange(next);
                      }}
                      className="mt-1"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <Button variant="enya_primary" size="lg" onClick={onContinue}>
          Continue →
        </Button>
      </div>
    </div>
  );
}

function InterestsStep({
  studentName,
  value,
  placeholder,
  onChange,
  onContinue,
  onBack,
}: {
  studentName: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const canContinue = value.trim().length > 0;
  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">✨</div>
        <h1 className="text-3xl font-bold">What do you love?</h1>
        <p className="text-muted-foreground mt-2">
          Tell us one or two things {studentName} is into. We&apos;ll weave them
          into your stories and lessons.
        </p>
      </div>

      <div className="rounded-xl border-2 border-border bg-card p-5">
        <label className="block">
          <span className="text-sm font-semibold text-muted-foreground">
            Your interests
          </span>
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canContinue) onContinue();
            }}
            className="mt-2 w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-base focus:outline-none focus:border-[hsl(var(--button-primary-border))]"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-2">
            Separate multiple with commas.
          </p>
        </label>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="enya_neutral" size="lg" onClick={onBack}>
          ← Back
        </Button>
        <Button
          variant="enya_primary"
          size="lg"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

function PersonalizingStep() {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4 animate-pulse">🪄</div>
      <h2 className="text-2xl font-bold">Personalizing your dashboard…</h2>
      <p className="text-muted-foreground mt-2">
        Tuning lessons, picking a story theme, warming up your tutor.
      </p>
    </div>
  );
}

function DoneStep({
  studentName,
  ealLevel,
  interests,
  onContinue,
}: {
  studentName: string;
  ealLevel: EALLevel;
  interests: string[];
  onContinue: () => void;
}) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-3xl font-bold">All set, {studentName}!</h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s how your dashboard is tuned.
        </p>
      </div>

      <div className="rounded-xl border-2 border-border bg-card p-6 space-y-4">
        <div>
          <div className="text-sm font-semibold text-muted-foreground">
            Reading level
          </div>
          <div className="text-lg font-bold mt-1">
            {ealLevel}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({EAL_TO_CEFR[ealLevel]})
            </span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-muted-foreground">
            Interests
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {interests.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                (none entered)
              </span>
            ) : (
              interests.map((i) => (
                <span
                  key={i}
                  className="rounded-full border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))]/10 px-3 py-1 text-sm font-medium"
                >
                  {i}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button variant="enya_primary" size="lg" onClick={onContinue}>
          Open my dashboard →
        </Button>
      </div>
    </div>
  );
}
