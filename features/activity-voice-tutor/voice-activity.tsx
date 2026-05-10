"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Mic, Volume2, X } from "lucide-react";
import { useConversation } from "@elevenlabs/react";
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

interface MissionTaskHint {
  id: string;
  shortLabel: string;
}

interface VoiceSessionPayload {
  signedUrl: string | null;
  agentPersonaPrompt: string;
  voiceMode: string;
  fallbackMp3: string;
  maxDurationSeconds?: number;
  // Optional Mission payload — when present, the UI renders a 3-dot task
  // indicator above the mic orb. See voice-missions.ts for shape.
  mission?: {
    missionFrame: string;
    openingLine: string;
    tasks: MissionTaskHint[];
  };
}

export function VoiceActivity({ studentId, lessonId }: Props) {
  const [state, setState] = useState<State>("idle");
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [transcript, setTranscript] = useState<
    { who: "tutor" | "student"; text: string }[]
  >([]);
  // Mission task hints, plus a heuristic completed-count. We don't have a
  // live tool-call from the agent telling us which tasks are done (Phase B),
  // so we approximate: each tutor message after a student turn = +1 task
  // completed, capped at the task count. Good enough for the demo arc.
  const [missionTasks, setMissionTasks] = useState<MissionTaskHint[]>([]);
  const [missionCompleted, setMissionCompleted] = useState(0);
  const lastTurnRef = useRef<"tutor" | "student" | null>(null);
  // `liveActive` flips true the moment we hand off to ElevenLabs. Used to
  // decide whether `end` calls the SDK's endSession() vs just stops the
  // simulated audio.
  const liveActiveRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks live-session start timestamp so onDisconnect can distinguish a
  // legitimate end from an immediate-rejection close (1008 from ElevenLabs
  // when the agent's dashboard doesn't whitelist a sent override field).
  const liveStartedAtRef = useRef(0);
  // Mirrors `transcript.length` so onDisconnect can read it without a stale
  // closure. Updated in the message handler + reset in `start`.
  const transcriptLenRef = useRef(0);
  // The session payload we just fetched, kept around so onDisconnect can
  // call runSimulated(session) if the live path was rejected.
  const pendingSessionRef = useRef<VoiceSessionPayload | null>(null);
  const { hydrate, hydrated, getById } = useStudentStore();
  const { awardXp, markActivityComplete } = useProgressStore();
  const profile = getById(studentId);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  // -------------------------------------------------------------------------
  // ElevenLabs live conversation hook
  //
  // We wire callbacks now (cheap — they're no-ops until startSession runs)
  // and only kick the session off when the API returns a signed URL AND the
  // demo isn't pinned to simulated mode. onMessage pushes to the same
  // transcript array the simulated path uses, so the UI doesn't care which
  // engine is driving.
  // -------------------------------------------------------------------------
  const conversation = useConversation({
    onMessage: ({ message, source }) => {
      if (!message) return;
      const who = source === "user" ? "student" : "tutor";
      transcriptLenRef.current += 1;
      setTranscript((t) => [...t, { who, text: message }]);
      // Mission progress heuristic: when the tutor speaks right after a
      // student turn, we treat that as "task completed". Caps at task
      // count. This is a stand-in until Phase B wires the agent's
      // update_task_state tool calls.
      if (who === "tutor" && lastTurnRef.current === "student") {
        setMissionCompleted((c) =>
          Math.min(missionTasks.length || 3, c + 1)
        );
      }
      lastTurnRef.current = who;
    },
    onError: (msg, ctx) => {
      console.error("[voice-activity] elevenlabs error", msg, ctx);
    },
    onDisconnect: (details?: unknown) => {
      if (!liveActiveRef.current) return;
      liveActiveRef.current = false;
      // ElevenLabs closes the websocket with code 1008 when an override the
      // agent's dashboard hasn't whitelisted is sent (e.g. first_message,
      // language, voice_id). When that happens we never had a conversation,
      // so falling through to "ended" + awarding XP is misleading. Detect
      // the early-close case (no transcript yet AND it disconnected within
      // ~3s of starting) and fall back to the simulated transcript instead.
      const elapsed = Date.now() - liveStartedAtRef.current;
      const hadAnyTurns = transcriptLenRef.current > 0;
      const looksRejected = elapsed < 3000 && !hadAnyTurns;
      console.warn("[voice-activity] disconnected", { elapsed, hadAnyTurns, details });
      if (looksRejected && pendingSessionRef.current) {
        // Run the scripted fallback so the demo flow still completes.
        const session = pendingSessionRef.current;
        pendingSessionRef.current = null;
        runSimulated(session);
        return;
      }
      setState("ended");
      awardXp(studentId, 25);
      markActivityComplete(studentId, `${lessonId}-voice`);
    },
  });

  // Map SDK status → our 5-state machine. While live, the orb animation is
  // driven by `isSpeaking` (true = tutor, false = listening).
  useEffect(() => {
    if (!liveActiveRef.current) return;
    if (conversation.status === "connecting") setState("connecting");
    else if (conversation.status === "connected")
      setState(conversation.isSpeaking ? "speaking" : "listening");
  }, [conversation.status, conversation.isSpeaking]);

  // Run the no-key scripted demo path. Extracted so the live path can also
  // use it as a graceful fallback if startSession throws.
  const runSimulated = useCallback(
    async (session: VoiceSessionPayload) => {
      setState("speaking");
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

      if (audioRef.current && session.fallbackMp3) {
        audioRef.current.src = session.fallbackMp3;
        audioRef.current.play().catch(() => {});
      }

      for (let i = 0; i < lines.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1800));
        setTranscript((t) => [...t, lines[i]]);
        setState(lines[i].who === "tutor" ? "speaking" : "listening");
      }

      setState("ended");
      awardXp(studentId, 25);
      markActivityComplete(studentId, `${lessonId}-voice`);
    },
    [studentId, lessonId, awardXp, markActivityComplete]
  );

  const start = async () => {
    setState("connecting");
    setTranscript([]);
    setMissionCompleted(0);
    lastTurnRef.current = null;
    transcriptLenRef.current = 0;
    pendingSessionRef.current = null;
    liveStartedAtRef.current = 0;
    try {
      const session = (await studentService.getVoiceSession({
        studentId,
        lessonId,
        activitySubtype: "explain-back",
      })) as VoiceSessionPayload;

      // Pull the Mission tasks (3 hand-authored tasks for Maya/Liam, generic
      // fallback for any other student). Rendered as a 3-dot progress
      // indicator below.
      if (session.mission?.tasks) setMissionTasks(session.mission.tasks);

      // Stash the session payload so onDisconnect can run the simulated
      // fallback if the live websocket gets rejected on connect.
      pendingSessionRef.current = session;

      const useSimulated =
        !session.signedUrl || session.voiceMode === "simulated";

      if (useSimulated) {
        await runSimulated(session);
        return;
      }

      // Live path. ElevenLabs disconnects the websocket with close code
      // 1008 the moment a per-conversation override is sent that the
      // agent's dashboard hasn't whitelisted ("Override for field 'X' is
      // not allowed by config."). For the hackathon demo we send NO
      // overrides — the agent uses whatever system prompt and first
      // message are stored in its dashboard config. The student-facing
      // result: a live voice conversation runs, but it follows the
      // dashboard's generic prompt instead of the per-student Mission.
      //
      // To unlock per-student personalization in the LIVE path:
      //   1. Open the agent at https://elevenlabs.io/app/conversational-ai
      //   2. Settings → Conversation overrides → toggle "System prompt"
      //      and "First message" to allowed.
      //   3. Re-add the `overrides.agent.prompt` and `firstMessage` fields
      //      below.
      // Until then, the simulated fallback (which IS Mission-aware) runs
      // when the override config rejects the connection.
      try {
        liveActiveRef.current = true;
        liveStartedAtRef.current = Date.now();
        const startArgs = process.env.NEXT_PUBLIC_VOICE_OVERRIDES_ALLOWED === "true"
          ? {
              signedUrl: session.signedUrl as string,
              overrides: {
                agent: { prompt: { prompt: session.agentPersonaPrompt } },
              },
            }
          : { signedUrl: session.signedUrl as string };
        await conversation.startSession(
          startArgs as Parameters<typeof conversation.startSession>[0]
        );
        // status/isSpeaking effect above will drive the UI from here.
      } catch (sdkErr) {
        console.error(
          "[voice-activity] live startSession failed, falling back",
          sdkErr
        );
        liveActiveRef.current = false;
        await runSimulated(session);
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

  const end = useCallback(() => {
    if (liveActiveRef.current) {
      // onDisconnect will flip state→ended and award XP/mark complete.
      conversation.endSession().catch(() => {});
      liveActiveRef.current = false;
    } else {
      setState("ended");
      if (audioRef.current) audioRef.current.pause();
    }
  }, [conversation]);

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
              {/* Mission task progress strip */}
              {missionTasks.length > 0 && (
                <div className="mb-6 mx-auto max-w-md">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Mission
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    {missionTasks.map((task, i) => {
                      const done = i < missionCompleted;
                      return (
                        <div key={task.id} className="flex flex-col items-center gap-1.5">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full transition-all duration-500",
                              done ? "scale-110" : "scale-100 opacity-30"
                            )}
                            style={{
                              backgroundColor: done
                                ? "var(--student-accent, #f59e0b)"
                                : "rgba(0,0,0,0.25)",
                              boxShadow: done
                                ? "0 0 10px var(--student-accent, #f59e0b)"
                                : "none",
                            }}
                          />
                          <div className="text-[10px] text-muted-foreground max-w-[110px] leading-tight">
                            {task.shortLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
