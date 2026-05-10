"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Mic, Volume2, X } from "lucide-react";
import { ActivityNav } from "@features/activity-text-lesson/activity-nav";
import { studentService } from "@shared/services/student-service";
import { useStudentStore } from "@shared/stores/student-store";
import { useProgressStore } from "@shared/stores/progress-store";
import { cn } from "@shared/lib/utils";

type State = "idle" | "connecting" | "listening" | "speaking" | "ended";

interface Props {
  studentId: string;
  lessonId: string;
}

export function VoiceActivity({ studentId, lessonId }: Props) {
  const [state, setState] = useState<State>("idle");
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [transcript, setTranscript] = useState<
    { who: "tutor" | "student"; text: string }[]
  >([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { hydrate, hydrated, getById } = useStudentStore();
  const { awardXp, markActivityComplete } = useProgressStore();
  const profile = getById(studentId);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const start = async () => {
    setState("connecting");
    setTranscript([]);
    try {
      const session = (await studentService.getVoiceSession({
        studentId,
        lessonId,
        activitySubtype: "explain-back",
      })) as {
        signedUrl: string | null;
        voiceMode: string;
        fallbackMp3: string;
      };

      // Demo strategy: if no live session OR voiceMode=simulated, play fallback MP3
      // and run a scripted transcript. (Live ElevenLabs SDK wiring is straightforward
      // when the agent ID + key are provided — useConversation hook from
      // @elevenlabs/react. For the no-key demo we play the MP3 instead.)
      const useSimulated =
        !session.signedUrl || session.voiceMode === "simulated";

      if (useSimulated) {
        setState("speaking");
        // Hardcoded scripted transcript (mirrors AM-09 plan)
        const isMaya = studentId === "maya";
        const lines = isMaya
          ? [
              { who: "tutor" as const, text: "Hi Maya! I love your butterfly garden. Can you tell me — what helps the flower grow?" },
              { who: "student" as const, text: "Sun?" },
              { who: "tutor" as const, text: "Yes! The sun helps. What else does the plant need?" },
              { who: "student" as const, text: "Water." },
              { who: "tutor" as const, text: "Great! Sun and water. The plant uses these to make its food. You explained it so well!" },
            ]
          : [
              { who: "tutor" as const, text: "Liam, I'll take a position: plants don't really need sunlight — they could grow with just water. Argue against me." },
              { who: "student" as const, text: "That's wrong. Plants need sunlight for photosynthesis. Without sunlight they can't make glucose." },
              { who: "tutor" as const, text: "But couldn't they get energy from water alone?" },
              { who: "student" as const, text: "No — water doesn't provide energy. Sunlight is the energy source the chlorophyll captures." },
              { who: "tutor" as const, text: "You're right — I conceded! Energy comes from light. Nice argument." },
            ];

        // Try to play MP3 if it exists; if it 404s, drop to silent text-only sim
        if (audioRef.current) {
          audioRef.current.src = session.fallbackMp3;
          audioRef.current.play().catch(() => {});
        }

        // Stagger the transcript so it feels like a conversation
        for (let i = 0; i < lines.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 1800));
          setTranscript((t) => [...t, lines[i]]);
          setState(lines[i].who === "tutor" ? "speaking" : "listening");
        }

        setState("ended");
        awardXp(studentId, 25);
        markActivityComplete(studentId, `${lessonId}-voice`);
      } else {
        // TODO: full ElevenLabs SDK wiring with useConversation hook + WebSocket
        // For now, surface the signed URL and direct user to the simulated fallback.
        setState("listening");
      }
    } catch (err) {
      console.error("[voice-activity] failed", err);
      setState("ended");
    }
  };

  // Countdown timer once started
  useEffect(() => {
    if (state === "listening" || state === "speaking") {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setSecondsLeft((s) => Math.max(0, s - 1));
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const end = () => {
    setState("ended");
    if (audioRef.current) audioRef.current.pause();
  };

  const subtitleText =
    studentId === "liam"
      ? "Today's mode: debate. The tutor takes a stance — you argue the other side."
      : "Today's mode: explain back. Tell the tutor what you learned about plants.";

  return (
    <>
      <ActivityNav studentId={studentId} lessonId={lessonId} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <audio ref={audioRef} hidden />

        {state === "idle" && (
          <div className="text-center py-10 max-w-xl mx-auto">
            <div
              className="mx-auto w-24 h-24 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--student-primary, oklch(0.83 0.17 82))" }}
            >
              <Mic className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mt-6">
              Voice Practice
            </h1>
            <p className="text-muted-foreground mt-3">{subtitleText}</p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground inline-block text-left">
              <li>⏱️ ~5 minutes</li>
              <li>🎙️ I&apos;ll listen and respond — speak naturally</li>
              <li>👂 You can end the conversation anytime</li>
            </ul>
            <div>
              <button
                onClick={start}
                className="mt-8 inline-flex items-center gap-2 rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-8 h-12 text-base"
              >
                Start Conversation
              </button>
            </div>
          </div>
        )}

        {(state === "connecting" ||
          state === "listening" ||
          state === "speaking") && (
          <div className="grid sm:grid-cols-[1fr_280px] gap-6 items-start">
            <div className="text-center py-10">
              <motion.div
                animate={{
                  scale:
                    state === "listening"
                      ? [1, 1.08, 1]
                      : state === "speaking"
                        ? [1, 1.04, 1]
                        : 1,
                }}
                transition={{
                  duration: state === "listening" ? 1.4 : 1.0,
                  repeat: state === "speaking" || state === "listening" ? Infinity : 0,
                }}
                className="mx-auto w-44 h-44 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  background: `radial-gradient(circle at 30% 30%, color-mix(in oklch, var(--student-accent, #fbbf24), white 30%), var(--student-primary, oklch(0.83 0.17 82)))`,
                }}
              >
                {state === "speaking" ? (
                  <Volume2 className="w-12 h-12 text-white" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </motion.div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {state === "connecting" && "Connecting…"}
                {state === "listening" && "Listening…"}
                {state === "speaking" && "Tutor speaking…"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(secondsLeft / 60)}:
                {String(secondsLeft % 60).padStart(2, "0")} remaining
              </p>
              <button
                onClick={end}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[hsl(var(--button-neutral-border))] bg-[hsl(var(--button-neutral))] text-[hsl(var(--button-neutral-text))] font-bold shadow-[0_3px_0_0_hsl(var(--button-neutral-shadow))] active:shadow-none active:translate-y-[3px] transition-all px-5 h-10 text-sm"
              >
                <X className="w-4 h-4" />
                End conversation
              </button>
            </div>

            <div className="rounded-2xl border-2 bg-card p-4 max-h-[60vh] overflow-auto">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Live transcript
              </div>
              <ul className="space-y-2.5 text-sm">
                {transcript.length === 0 && (
                  <li className="text-muted-foreground italic">
                    Conversation will appear here…
                  </li>
                )}
                {transcript.map((t, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-xl px-3 py-2",
                      t.who === "tutor"
                        ? "bg-yellow-50 text-yellow-900"
                        : "bg-blue-50 text-blue-900"
                    )}
                  >
                    <div className="text-[10px] font-semibold uppercase opacity-70">
                      {t.who === "tutor" ? "Tutor" : profile?.name ?? "You"}
                    </div>
                    {t.text}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {state === "ended" && (
          <div className="text-center py-10 max-w-xl mx-auto">
            <div className="text-6xl mb-3">🎉</div>
            <h1 className="text-3xl font-bold">Great job!</h1>
            <p className="text-muted-foreground mt-3 max-w-prose mx-auto">
              {studentId === "liam"
                ? "You built a clear evidence-based argument and used scientific vocabulary precisely."
                : "You named what plants need and used new words — sun, water, photosynthesis."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">+25 XP</p>
            <button
              onClick={() => {
                setState("idle");
                setSecondsLeft(300);
                setTranscript([]);
              }}
              className="mt-6 rounded-xl border-2 px-5 h-10 inline-flex items-center"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </>
  );
}
