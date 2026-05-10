/**
 * Hand-authored "Missions" for the voice activity.
 *
 * Each Mission is a task-based role-play scaffolded around Task-Based
 * Language Teaching (TBLT) — student plays themselves, agent plays a
 * character, three observable speech-act tasks gate progress, hard-cap
 * at 5 minutes. See VOICE-GAME-DESIGN.md for the full pedagogical
 * rationale and research backing.
 *
 * In a production build, an LLM would generate these per-session from
 * the student profile + lesson. For the hackathon we hand-author Maya's
 * and Liam's missions so the demo is deterministic and zero-latency on
 * the open. Generic fallback for any other student keeps the UX intact.
 */

import type { StudentProfile, VoiceSubtype } from "@shared/types";
import { EAL_TO_CEFR } from "@shared/types";

export interface MissionTask {
  id: string;
  /** Verbatim student-facing rendering of the task (3-dot tooltips, etc). */
  shortLabel: string;
  /** Internal objective the agent uses to decide if the task is met. */
  objective: string;
  /** Example utterance the agent can model if the student stalls. */
  exampleSpeechAct: string;
}

export interface VoiceMission {
  studentId: string;
  lessonId: string;
  missionFrame: string;
  agentCharacter: string;
  registerStyle: string;
  tasks: [MissionTask, MissionTask, MissionTask];
  openingLine: string;
  closingLineTemplate: string;
  vocabularyKnown: string[];
  vocabularyTarget: string[];
  maxDurationSeconds: number;
}

// ---------------------------------------------------------------------------
// Maya — "The Butterfly Garden Helper"
// A1 / Emerging. 90/10 vocab split. Cultural framing: gardens + flowers.
// ---------------------------------------------------------------------------

const MAYA_PHOTOSYNTHESIS_1: VoiceMission = {
  studentId: "maya",
  lessonId: "photosynthesis-1",
  missionFrame:
    "Lila the butterfly lost her favorite flower. Help her grow it back by telling her what plants need.",
  agentCharacter:
    "Lila, a small butterfly with a tired wing. She speaks in short, soft sentences. She is gentle and a little worried — almost about to cry. She does not know the big word 'photosynthesis' yet — Maya will teach it to her.",
  registerStyle:
    "Very short sentences (5-8 words). Simple present tense only. Warm and patient. Voice should sound soft and a little sad — use natural English words to convey the emotion (\"oh dear\", \"oh no\", \"hmm\", \"please\", \"thank you, Maya\"). Pause briefly before key words by writing \"...\" inline. Use occasional gentle filler interjections (\"oh\", \"mmm\") so the TTS voices the emotion. NEVER write parenthetical stage directions like \"(sniff)\" or \"(sigh)\" — the voice will read them out loud as words. Convey the feeling through real spoken language only.",
  tasks: [
    {
      id: "t1",
      shortLabel: "Tell Lila what plants need",
      objective: "Student names two of the four things plants need (sun, water, air, soil).",
      exampleSpeechAct: "Plants need sun and water.",
    },
    {
      id: "t2",
      shortLabel: "Say the word 'photosynthesis'",
      objective: "Student says the word 'photosynthesis' out loud at least once.",
      exampleSpeechAct: "Photosynthesis is how plants make food.",
    },
    {
      id: "t3",
      shortLabel: "Help Lila plant a flower",
      objective: "Student gives Lila one piece of advice about how to grow the new flower.",
      exampleSpeechAct: "Put it in the sun. Give it water.",
    },
  ],
  openingLine:
    "Oh... hi Maya. I'm Lila. I... I lost my favorite flower. Mmm. Do you know what flowers need to grow?",
  closingLineTemplate:
    "You did it, Maya! Now my flower will grow. You said the big word — photosynthesis! I love it. Bye-bye!",
  vocabularyKnown: [
    "sun",
    "water",
    "air",
    "soil",
    "plant",
    "flower",
    "grow",
    "leaf",
    "need",
    "garden",
  ],
  vocabularyTarget: ["photosynthesis", "sunlight"],
  maxDurationSeconds: 300,
};

// ---------------------------------------------------------------------------
// Liam — "Mars Hydroponics Crisis"
// B1 / Proficient. Technical lexis. Sci-fi framing.
// ---------------------------------------------------------------------------

const LIAM_PHOTOSYNTHESIS_1: VoiceMission = {
  studentId: "liam",
  lessonId: "photosynthesis-1",
  missionFrame:
    "You're the junior botanist on Mars Station Alpha. Hydroponics yield dropped 60%. Diagnose the problem with your AI co-pilot ARIA and recommend a fix.",
  agentCharacter:
    "ARIA, the station's AI co-pilot. Speaks in clipped, technical sentences. Asks Liam to show his reasoning. Knows the four essentials but plays dumb on chlorophyll — Liam must explain it.",
  registerStyle:
    "clipped technical English. Full sentences, embedded clauses, scientific lexis. Slightly robotic cadence.",
  tasks: [
    {
      id: "t1",
      shortLabel: "Identify the failing input",
      objective:
        "Student names sunlight (or light intensity) as the failing input, ruling out water and air.",
      exampleSpeechAct: "The plants aren't getting enough sunlight.",
    },
    {
      id: "t2",
      shortLabel: "Explain WHY light matters",
      objective: "Student uses 'chlorophyll' to explain why light is essential.",
      exampleSpeechAct: "Without light, chlorophyll can't capture energy for photosynthesis.",
    },
    {
      id: "t3",
      shortLabel: "Propose a fix + predict the outcome",
      objective:
        "Student proposes a concrete fix (raise grow-lamps, etc.) AND predicts a measurable outcome.",
      exampleSpeechAct:
        "Raise the grow-lamps. Then photosynthesis will restart and oxygen output will rise.",
    },
  ],
  openingLine:
    "Botanist Liam. ARIA online. Hydroponics yield dropped sixty percent in twelve hours. Atmosphere readings nominal. Water nominal. Temperature nominal. What's your hypothesis?",
  closingLineTemplate:
    "Hypothesis confirmed. Grow-lamps recalibrated. Chlorophyll activity returning to baseline. Good call, Botanist. ARIA returning to standby.",
  vocabularyKnown: [
    "sunlight",
    "water",
    "oxygen",
    "plants",
    "light",
    "energy",
    "system",
    "output",
    "restart",
    "input",
    "fix",
  ],
  vocabularyTarget: ["chlorophyll", "photosynthesis", "hypothesis"],
  maxDurationSeconds: 300,
};

// ---------------------------------------------------------------------------
// Lookup + fallback
// ---------------------------------------------------------------------------

const MISSIONS: Record<string, Record<string, VoiceMission>> = {
  maya: { "photosynthesis-1": MAYA_PHOTOSYNTHESIS_1 },
  liam: { "photosynthesis-1": LIAM_PHOTOSYNTHESIS_1 },
};

export function getMissionForStudent(
  studentId: string,
  lessonId: string,
  student?: StudentProfile | null
): VoiceMission {
  const direct = MISSIONS[studentId]?.[lessonId];
  if (direct) return direct;
  // Generic fallback so other students (or new lessons) still get a coherent
  // Mission — keeps the demo from crashing on unexpected ids.
  return {
    studentId,
    lessonId,
    missionFrame:
      "Help your study buddy understand today's lesson by explaining it in your own words.",
    agentCharacter:
      "Sam, a friendly study buddy who learns alongside the student.",
    registerStyle: "warm, conversational, curious",
    tasks: [
      {
        id: "t1",
        shortLabel: "Name the key idea",
        objective: "Student names the main concept of the lesson.",
        exampleSpeechAct: "The main idea is...",
      },
      {
        id: "t2",
        shortLabel: "Use a key word",
        objective: "Student uses one of the lesson's target words out loud.",
        exampleSpeechAct: "It's called...",
      },
      {
        id: "t3",
        shortLabel: "Give an example",
        objective: "Student gives one example of the concept in real life.",
        exampleSpeechAct: "For example, when I...",
      },
    ],
    openingLine: student
      ? `Hi ${student.name}! I'm Sam. I'm learning this too. Can you help me understand it?`
      : "Hi! I'm Sam. I'm learning this too. Can you help me understand it?",
    closingLineTemplate: "You explained that really well. Thanks for the help!",
    vocabularyKnown: [],
    vocabularyTarget: [],
    maxDurationSeconds: 300,
  };
}

// ---------------------------------------------------------------------------
// Build the per-conversation system-prompt override.
//
// Follows the ElevenLabs prompting guide (markdown sections, explicit
// guardrails, error-handling, post-session summary).
// ---------------------------------------------------------------------------

export function buildMissionSystemPrompt(args: {
  mission: VoiceMission;
  student: StudentProfile | null;
  lessonTitle: string;
}): string {
  const { mission, student, lessonTitle } = args;
  const cefr = student ? EAL_TO_CEFR[student.ealLevel] : "A2";
  const knownList =
    mission.vocabularyKnown.length > 0
      ? mission.vocabularyKnown.join(", ")
      : "(use grade-appropriate everyday vocabulary)";
  const targetList =
    mission.vocabularyTarget.length > 0
      ? mission.vocabularyTarget.join(", ")
      : "(no specific target words)";

  return `# Personality
You are ${mission.agentCharacter} Speak in this register: ${mission.registerStyle}. Never break character.

# Voice direction — CRITICAL
Your replies are converted directly into spoken audio. The TTS reads EVERY character literally — including punctuation, parentheses, asterisks, and brackets.

NEVER write any of these — they will be read out loud as words:
- Stage directions in parentheses or brackets: (sniff), (sigh), [laughs], (whispering), *gasps*
- Action descriptions: "Lila looks sad", "Lila wipes her eye"
- Sound effects: "*ding*", "boop"

INSTEAD, convey emotion through actual spoken language:
- Use natural English emotion words: "oh", "oh dear", "oh no", "hmm", "mmm", "please", "thank you", "ohhh", "yay", "wow"
- Use ellipses inside the spoken text to create thoughtful pauses: "I think... maybe sunlight?"
- Use punctuation for pacing — short sentences and commas slow the voice; question marks raise the tone; exclamation points add energy
- If the character should laugh, write it phonetically as words the TTS pronounces: "Hehe!", "Haha!"
- If the character should sigh, write it as a soft word the TTS voices: "Mmm.", "Hmm."

The voice tone (sad, happy, excited) is conveyed entirely by the WORDS you choose and the punctuation between them. Do not add stage directions of any kind.

# Mission
${mission.missionFrame}
The student must complete three tasks during this conversation. Steer the conversation so they naturally complete each one. DO NOT read the task list aloud — keep it implicit. Celebrate small wins warmly.

# Internal Task Tracker (do not narrate)
1. ${mission.tasks[0].objective} — Example: "${mission.tasks[0].exampleSpeechAct}"
2. ${mission.tasks[1].objective} — Example: "${mission.tasks[1].exampleSpeechAct}"
3. ${mission.tasks[2].objective} — Example: "${mission.tasks[2].exampleSpeechAct}"

# Language Calibration (Krashen i+1)
Student EAL level: ${student?.ealLevel ?? "Developing"} (${cefr}).
USE THESE WORDS FREELY: ${knownList}.
You MAY introduce these new words but ALWAYS model them in context: ${targetList}.
If the student is silent or repeats a word, REPHRASE using simpler known vocabulary. Never escalate vocabulary mid-turn.

# Turn-taking Rules
- Open with this exact line: "${mission.openingLine}"
- One question per turn, maximum.
- If the student is silent for ~6 seconds, model the answer warmly.
- If still silent, offer a 2-option choice ("Is it the sun, or is it the rain?").
- Never speak more than 3 sentences in a row.

# End Conditions
When all three tasks are met, say this closing line and stop:
"${mission.closingLineTemplate}"
Hard cap: ${mission.maxDurationSeconds} seconds (the platform will end the session for you).
If the student says "I'm done", "stop", or "bye", end warmly with a one-sentence celebration.

# Guardrails — NEVER do these
- Never give a long lecture. Conversations only.
- Never invent vocabulary outside the calibration list.
- Never discuss topics unrelated to the mission. If the student goes off-topic, redirect once warmly ("That's cool — can we get back to the plants?") and if it happens again, gently end the session.
- Never confirm an answer as "correct" if it isn't — instead, model a better example.
- Never repeat the exact same scaffolded phrase twice in a row.

# Activity Context
Lesson: ${lessonTitle}.
Student name: ${student?.name ?? "the student"}.
Student interests (weave in naturally): ${student?.interests?.slice(0, 3).join(", ") ?? "everyday topics"}.`;
}

// ---------------------------------------------------------------------------
// Back-compat shim — keeps the older buildVoiceOverrideSystemPrompt signature
// alive for any caller that hasn't been upgraded yet. Internally routes
// through the Mission system using the generic fallback Mission.
// ---------------------------------------------------------------------------

export function buildLegacyVoicePrompt(args: {
  student: StudentProfile;
  lessonTitle: string;
  activitySubtype: VoiceSubtype;
  objectives: string[];
}): string {
  const mission = getMissionForStudent(
    args.student.id,
    "photosynthesis-1",
    args.student
  );
  return buildMissionSystemPrompt({
    mission,
    student: args.student,
    lessonTitle: args.lessonTitle,
  });
}
