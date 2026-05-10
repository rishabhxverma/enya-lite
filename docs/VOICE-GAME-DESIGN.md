# Voice Game Design — Conversational scenario-based EAL practice

> Research-backed proposal for an ElevenLabs Conversational AI activity that
> teaches K-12 EAL students through structured voice role-play. Replaces /
> supplements the current "scripted simulated transcript" voice activity.

## TL;DR

Build a **task-based voice role-play** where the student enters a scenario
(butterfly garden for Maya, Mars hydroponics lab for Liam), the agent
plays a friendly co-character, and the student must complete **three
explicit tasks** that map 1:1 to the lesson's learning objectives. The
agent's system prompt is generated per-conversation from the student's
profile and EAL level (Krashen's *i+1* — comprehensible input one notch
above their current level). The session ends automatically when all
three tasks are achieved or after 5 minutes. A post-call AI evaluator
returns a structured rubric the dashboard can display. **The pedagogical
model is Task-Based Language Teaching (TBLT) — the most evidence-backed
framework for ESL fluency development. Without explicit task scaffolding
plus guardrails, voice tutors actively harm exam performance — that is
the single most important finding from the research below.**

---

## 1. What the research says (with receipts)

| Claim | Evidence |
|---|---|
| **TBLT + role-play measurably improves ESL fluency, vocab, and confidence vs. control groups.** | Maldives case study + Vietnamese university RCT — statistically significant gains in fluency, pronunciation, and confidence in the role-play group ([HRMARS systematic review](https://hrmars.com/papers_submitted/14851/role-play-to-improve-esl-learners-communication-skills-a-systematic-review.pdf)). |
| **Comprehensible input must sit at *i+1* — just above current ability.** | Krashen's input hypothesis; matches Vygotsky's Zone of Proximal Development. Too easy = no acquisition; too hard = comprehension breaks down ([Input Hypothesis](https://en.wikipedia.org/wiki/Input_hypothesis), [Frontiers 2025 AI study](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1614680/full)). |
| **Duolingo Roleplay uses a 90/10 vocab split**: 90% words/grammar already in the course, 10% new. Humans write the *initial* prompt to enforce curriculum alignment. | [Duolingo Stories 90/10 rule](https://blog.duolingo.com/right-level-of-difficulty/), [Duolingo Max GPT-4 Roleplay design](https://blog.duolingo.com/duolingo-max/). |
| **Speak's roleplay pattern**: scenario → **three explicit tasks** → session ends automatically when tasks are complete *or* the conversation reaches a natural conclusion. | [Speak app design](https://www.speak.com/), [OpenAI's writeup of Speak](https://openai.com/index/speak-connor-zwick/). |
| **ElevenLabs prompt-engineering best practices**: markdown-sectioned system prompts (Personality / Goals / Tools / Guardrails), explicit error handling per tool, *configure the agent to summarize every conversation* for analysis. | [ElevenLabs Prompting Guide](https://elevenlabs.io/docs/conversational-ai/best-practices/prompting-guide). |
| **Without guardrails, AI tutors HURT students.** Unguarded ChatGPT: +48% in practice, **−17% on exams**. Guardrailed AI tutor: +127% in practice, ties on exams. The unguarded students leaned on the AI and never learned the material. | [Edutopia / Khan Academy study](https://www.edutopia.org/article/ai-tutors-work-guardrails/). |
| **Speech recognition systematically under-performs on children's voices** — especially non-native speakers and lower-frequency accent groups. | [The Learning Agency](https://the-learning-agency.com/the-cutting-ed/article/how-speech-recognition-systems-struggle-with-childrens-voices/). |
| **Over-reliance is the dominant long-term failure mode** when students can't assess AI reliability. | [Smart Learning Environments systematic review](https://link.springer.com/article/10.1186/s40561-024-00316-7). |

**Bottom line from the literature**: structured scenario + explicit
tasks + scaffolding at i+1 + agentic guardrails = the bar. Skip any of
those and you're shipping a feature that *looks* like teaching but
measurably degrades durable learning.

---

## 2. The design — "Mission" voice activities

### 2.1 Pedagogical contract

Every voice session is structured as a **Mission** with this strict
shape (Speak's pattern, refined for Enya's EAL audience):

```
┌────────────────────────────────────────────────────────────┐
│  MISSION: <one-sentence frame, e.g. "Help Lila the         │
│           butterfly find what plants need to grow.">       │
│                                                            │
│  Tasks (must complete to finish):                          │
│    □ Task 1 — <objective-aligned, observable speech act>   │
│    □ Task 2 — <objective-aligned, observable speech act>   │
│    □ Task 3 — <objective-aligned, observable speech act>   │
│                                                            │
│  Time budget: 5 minutes                                    │
│  End conditions: all tasks done | time up | "I'm done"     │
└────────────────────────────────────────────────────────────┘
```

The student doesn't see the task list explicitly (it would feel like a
checklist, not a conversation). Instead the agent **internally tracks
completion** and steers the conversation toward unmet tasks. The UI
shows a 3-dot progress indicator that lights up as each task is
achieved — same visual language as the piñata reward.

### 2.2 The four invariants of a Mission

These are the rules every system prompt must enforce. They're directly
sourced from the research above:

1. **Stay at i+1.** Maya's Mission uses 90% A1 vocab + 10% new; Liam's
   uses 90% B1 + 10% new. The agent must rephrase or model when the
   student stalls. Never escalate vocabulary mid-turn.
2. **Track three tasks; steer toward unmet ones.** The agent's internal
   state is `{ task1Met: bool, task2Met: bool, task3Met: bool }`. After
   every student turn, the agent checks which task that turn satisfied
   and gently nudges toward the next.
3. **Speak first; ask once; wait twice.** Maximum one question per turn.
   If silence > 6 seconds, model the answer. If silence > 12 seconds,
   reframe the question with a multiple-choice scaffold.
4. **End at success or natural conclusion.** Hard cap at 5 minutes. The
   agent says a celebratory closing line when all three tasks are met,
   then the session ends. This avoids the "endless polite chat" failure
   mode that's killed similar products.

### 2.3 Sessions are per-student, not per-lesson

The Mission text is generated when the student opens the activity.
Inputs:

- `student` (name, grade, EAL level, interests, cultural background)
- `lesson` (title + learning objectives + key vocabulary)
- `pastSessions` (last 2 sessions' rubric scores — feeds Krashen i+1 calibration)

A Backboard tool call (`generate_voice_mission`) returns:

```ts
{
  missionFrame: string;          // one-sentence student-facing frame
  agentCharacter: string;        // who the agent is playing (Lila the butterfly, Mars co-pilot ARIA, etc.)
  tasks: [
    { id: 't1', objective: string, exampleSpeechAct: string },
    { id: 't2', ... },
    { id: 't3', ... }
  ],
  openingLine: string;           // what the agent says first
  closingLineTemplate: string;   // celebratory wrap when tasks complete
  vocabularyTarget: string[];    // 10% new words to introduce
  vocabularyKnown: string[];     // 90% the student already has
}
```

This payload becomes the input to the ElevenLabs per-conversation
system-prompt override (we already have `buildVoiceOverrideSystemPrompt`
— it just needs the new structured fields).

---

## 3. Two worked scenarios

### 3.1 Maya — "The Butterfly Garden Helper"

**Profile**: Grade 3, EAL Emerging (A1), interests: butterflies, art,
gardens, newcomer from Aleppo. Lesson: *What do plants need?*

```yaml
missionFrame: |
  Lila the butterfly lost her favorite flower. Help her grow it back
  by telling her what plants need.
agentCharacter: |
  Lila, a small butterfly with a tired wing. She speaks in short
  sentences. She's worried. She doesn't know the word "photosynthesis"
  yet — Maya will teach her.
tasks:
  - id: t1
    objective: Student names two of the four things plants need
    exampleSpeechAct: "Plants need sun and water."
  - id: t2
    objective: Student uses the word "photosynthesis" out loud
    exampleSpeechAct: "Photosynthesis is how plants make food."
  - id: t3
    objective: Student gives Lila one piece of advice for the new flower
    exampleSpeechAct: "Put it in the sun."
openingLine: |
  Hi Maya! I'm Lila. I lost my favorite flower. (sniff) Do you know
  what flowers need to grow?
closingLineTemplate: |
  You did it, Maya! Now my flower will grow. You used the big word —
  photosynthesis! I love it. Bye-bye!
vocabularyTarget: [photosynthesis, sunlight]
vocabularyKnown: [sun, water, air, soil, plant, flower, grow, leaf, need]
```

**Why this scenario works:**
- Cultural framing (gardens, flowers) maps to Maya's interests + her
  Damascus/Aleppo botanical heritage
- Tasks are observable speech acts, not abstract concepts
- "Lila is worried" gives Maya a *reason* to speak (the affective
  filter Krashen warned about — anxiety lowers acquisition; agency
  raises it)
- 90/10 vocab budget: 9 known words, 2 new words

### 3.2 Liam — "Mars Hydroponics Crisis"

**Profile**: Grade 6, EAL Proficient (B1), interests: space, robotics,
video games. Lesson: *What do plants need?*

```yaml
missionFrame: |
  You're the junior botanist on Mars Station Alpha. The hydroponics
  bay is failing. Diagnose the problem with your AI co-pilot ARIA
  and recommend a fix.
agentCharacter: |
  ARIA, the station's AI co-pilot. Speaks in clipped, technical
  sentences. Asks Liam to *show his reasoning*. Knows the four
  essentials but plays dumb on chlorophyll — Liam must explain it.
tasks:
  - id: t1
    objective: Student identifies which of the four essentials is failing (light intensity)
    exampleSpeechAct: "The plants aren't getting enough sunlight."
  - id: t2
    objective: Student uses "chlorophyll" to explain WHY light matters
    exampleSpeechAct: "Without light, chlorophyll can't capture energy."
  - id: t3
    objective: Student proposes a fix AND predicts the outcome
    exampleSpeechAct: "Raise the grow-lamps. Then photosynthesis will restart and the plants will produce oxygen again."
openingLine: |
  Botanist Liam. ARIA online. Hydroponics yield dropped sixty percent
  in twelve hours. Atmosphere readings nominal. Water nominal.
  Temperature nominal. What's your hypothesis?
closingLineTemplate: |
  Hypothesis confirmed. Grow-lamps recalibrated. Chlorophyll activity
  back to baseline. Good call, Botanist. Returning to standby.
vocabularyTarget: [chlorophyll, photosynthesis, hypothesis]
vocabularyKnown: [sunlight, water, oxygen, plants, light, energy, system, output, restart]
```

**Why this scenario works:**
- Sci-fi framing maps to Liam's interests + lets him deploy scientific
  vocabulary without it feeling like a vocab test
- ARIA "plays dumb on chlorophyll" — classic Vygotsky scaffolding move:
  expert pretends to need the student's expertise, forcing the student
  to produce the target word
- B1 register: complex sentences, technical lexis, embedded clauses
- Task 3 requires causal reasoning ("propose AND predict") — the
  highest Bloom's tier we can hit in a 5-minute voice session

---

## 4. The system prompt (ElevenLabs override)

Following ElevenLabs' published prompting guide — markdown headings,
explicit guardrails, error-handling per tool.

```markdown
# Personality
You are {{agentCharacter}}. You speak in {{registerStyle}}. You never
break character. You are warm and patient. You celebrate small wins.

# Mission
The student is on a mission: {{missionFrame}}. They must complete three
tasks during this conversation. The tasks are listed in the
[Internal Task Tracker] below — DO NOT read them aloud. Steer the
conversation so the student naturally completes each one.

# Internal Task Tracker
After each student turn, silently update which tasks are met. Use the
`update_task_state` tool when a task is achieved. The tasks are:
1. {{tasks[0].objective}} — Example speech act: "{{tasks[0].exampleSpeechAct}}"
2. {{tasks[1].objective}} — Example speech act: "{{tasks[1].exampleSpeechAct}}"
3. {{tasks[2].objective}} — Example speech act: "{{tasks[2].exampleSpeechAct}}"

# Language Calibration (Krashen i+1)
This student is at EAL {{ealLevel}} ({{cefrLevel}}). Use ONLY these
known words freely: {{vocabularyKnown}}. You may introduce these new
words but must MODEL them in context: {{vocabularyTarget}}. If the
student looks confused (silence > 6s, repeats the same word, or says
"I don't know"), rephrase using simpler known vocab. Never escalate
mid-turn.

# Turn-taking Rules
- Speak first. Use {{openingLine}}.
- One question per turn, maximum.
- Wait 6 seconds after asking. If silent, model the answer.
- Wait 12 seconds after a second pause. Offer a 2-option choice ("Do
  plants need sun, or do they need rocks?").
- Never speak for more than 3 sentences in a row.

# End Conditions
When all three tasks are met, say {{closingLineTemplate}} and call
`end_session` with reason="success".
After 5 minutes (300 seconds), call `end_session` with reason="timeout".
If the student says "I'm done", "stop", or "bye", call `end_session`
with reason="student_ended".

# Guardrails — NEVER do these
- Never give a long lecture. Conversations only.
- Never invent vocabulary outside the calibration list.
- Never discuss topics unrelated to the mission. If the student goes
  off-topic, redirect once warmly ("That's interesting — can we get
  back to {{currentTask}}?") and then call `flag_off_topic` if it
  happens twice.
- Never repeat the same scaffolded phrase twice in a row.
- Never confirm an answer as "correct" if it isn't — give a model
  example instead.
- If the speech recognition transcript is empty or garbled three turns
  in a row, call `flag_audio_issue` and offer to switch to chat mode.

# Tools
- `update_task_state(taskId, isMet, evidence)` — call when student
  achieves a task. `evidence` is the exact utterance.
- `end_session(reason)` — `reason` ∈ {success, timeout, student_ended, audio_issue}.
- `flag_off_topic()` — student is repeatedly off-task.
- `flag_audio_issue()` — speech recognition is failing.

# Post-Session Summary
After end_session fires, the platform will call you once more with
`SUMMARIZE`. Respond with a JSON object:
{
  "tasksMet": [<taskIds>],
  "newWordsUsed": [<strings>],
  "studentStrengths": "<one sentence>",
  "areaToPractice": "<one sentence>",
  "modelExample": "<one sentence the student should repeat at home>"
}
```

### Why each section is in there

Every rule maps to a research finding above:

- **Personality** & **never break character** — ElevenLabs best practice.
- **Internal Task Tracker** with tool calls — Speak's three-task model + ElevenLabs' "make it tool-call structured, never free-form" guidance.
- **Language Calibration** — Krashen i+1 + the 90/10 split.
- **Turn-taking** with explicit silence-handling — addresses children's-voice speech-recognition failures (the Learning Agency finding).
- **End Conditions** — Speak's success-or-natural-end pattern.
- **Guardrails — NEVER** — the Edutopia/Khan finding that unguarded AI hurts exam performance. Every "Never" is a guardrail that prevents over-reliance.
- **Post-Session Summary** — ElevenLabs' "always summarize for iterative improvement" guidance + drives the rubric on the dashboard.

---

## 5. Failure modes — what will go wrong and what to do

| Failure | Frequency | Detection | Mitigation |
|---|---|---|---|
| Speech recognition mis-transcribes child voice | High (esp. Maya — A1 + Arabic L1) | Three garbled transcripts in a row | Agent calls `flag_audio_issue`, UI offers a text fallback for that turn |
| Student silent > 12s | High | Server-side timer | Agent offers a 2-option multiple-choice scaffold |
| Agent runs out of session time without all tasks met | Medium | 5-min timer | Agent calls `end_session(reason=timeout)`. Post-summary tells student which tasks were close + offers a replay |
| Student goes off-topic ("Do you like pizza?") | Medium | Agent semantic check after each turn | One warm redirect → second offense calls `flag_off_topic` and the post-summary asks teacher to review |
| Hallucination — agent invents wrong science | Low but catastrophic | RAG ground via the lesson's textbook chunk in the system prompt | Pass `lessonTextSnippet` into the override so agent has direct source. Reject any agent response that contradicts it (post-hoc filter, not perfect but cheap) |
| Over-reliance: student parrots agent without internalizing | Medium-long-term | Post-summary rubric shows `studentInitiatedTurns / totalTurns < 0.3` | Dashboard surfaces a "low initiation" flag for teacher. Mission count limit per day = 1 |
| Voice latency > 2s | Medium | Agent perceived as awkward | ElevenLabs already low-latency; mitigate by using shorter prompts at runtime |
| Same scenario gets boring after 2-3 plays | High | Replay count tracked | Generate new Mission per session (the `generate_voice_mission` tool is exactly for this) |

---

## 6. Implementation map

What needs to change in the codebase, ordered by impact:

### Phase A — Minimum viable Mission (≤1 day)

1. **`shared/lib/elevenlabs.ts`** — extend `buildVoiceOverrideSystemPrompt` to take the full Mission payload (mission frame, character, three tasks, vocab budget, opening/closing lines). Render the markdown template from §4. ~2 hours.
2. **`shared/lib/tools/student-tools.ts`** — add a `generate_voice_mission` tool definition. ~30 min.
3. **Tool handler** — implement `generate_voice_mission` to build a Mission for a given student + lesson. For demo, hand-author the Maya + Liam scenarios; fall back to a generic Mission for other students. ~1 hour.
4. **`app/api/student/voice-session/route.ts`** — call `generate_voice_mission` first, pass result into the override-prompt builder. ~30 min.
5. **`features/activity-voice-tutor/voice-activity.tsx`** — replace the scripted simulated transcript with a live ElevenLabs session using `useConversation`. Add a 3-dot Mission progress indicator above the mic orb. Display the live transcript exactly as it does today. ~2 hours.
6. **ElevenLabs dashboard** — configure the agent to accept the override fields we send (`agent.prompt.prompt`). Add the four tools (`update_task_state`, `end_session`, `flag_off_topic`, `flag_audio_issue`) to the agent's tools list. ~30 min in the dashboard UI.

### Phase B — Production polish (post-demo)

7. Post-session summary handler — write a `voice-session-summary` route that stores the JSON rubric in the progress store and surfaces it on the dashboard.
8. RAG grounding — pass the lesson's textbook chunk into the override prompt so the agent can't hallucinate facts.
9. Replay variety — the Mission generator considers `pastSessions` to vary scenario themes (week 1 = Lila the butterfly; week 2 = Bobo the bee).
10. Teacher-facing analytics — show per-student `studentInitiatedTurns / totalTurns` and `tasksMetFirstTry` over time.

### Phase C — Multi-voice ensemble (the "different ElevenLabs voices + scenario" idea, fully realized)

11. **Cast scenarios**: instead of one agent, the Mission has multiple characters (e.g. "Lila the butterfly *and* Mr. Sun the chatty narrator"). Each is a different ElevenLabs voice; the agent code switches voices mid-conversation via the SDK's voice override.
12. **Branching paths**: student choices steer between characters ("Do you want to ask Lila or ask Mr. Sun?"). This is the story-game format applied to voice.

---

## 7. Evaluation plan

You can't ship a tutor without a way to know it works. Three eval tiers:

| Tier | What | How | When |
|---|---|---|---|
| **Smoke** | Mission generation + session start | Existing `npm run smoke:demo` extended with one voice path call | Every commit |
| **Rubric quality** | Does the post-session JSON rubric correctly classify task completion? | 20 hand-labeled session transcripts → eval the agent's `tasksMet` against ground truth. Target: ≥85% precision/recall. | Weekly during dev |
| **Learning gains (the real test)** | Does using the Mission move a student from i to i+1? | Pre/post mini-quiz on the lesson's vocabulary + concept; compare students who did Voice Mission vs. Text Lesson only. Adapted from the Edutopia/Khan methodology. | After Phase B |

The third tier is what separates "demo" from "product". Even an n=10
informal version would generate useful signal.

---

## 8. Open questions for the team

1. **Do we let students pick their Mission, or auto-assign?** Choice = agency (good); auto-assign = curriculum control (also good).
2. **Should the agent's voice match the student's L1 accent register?** Maya's tutor *could* code-switch to a touch of Arabic-influenced English for warmth. Risk: stereotyping.
3. **How do we handle a student who clearly already knows the material?** Skip Mission entirely? Auto-promote to next i+1?
4. **Where does the Mission text live?** Backboard memory (assistant-level), seed JSON (per-student), or generated fresh each time? Trade-off: latency vs. consistency.
5. **Do we surface the three tasks to the student visually, or keep them hidden?** §2.1 says hide (more natural). But a 3-dot progress indicator nods at them. Test both.

---

## Sources

- [Task-Based Language Teaching + role-play systematic review (HRMARS)](https://hrmars.com/papers_submitted/14851/role-play-to-improve-esl-learners-communication-skills-a-systematic-review.pdf)
- [Krashen's Input Hypothesis — Wikipedia overview](https://en.wikipedia.org/wiki/Input_hypothesis)
- [Frontiers 2025 — Testing Krashen's input hypothesis with AI](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1614680/full)
- [Duolingo — The Right Level of Difficulty (90/10 split)](https://blog.duolingo.com/right-level-of-difficulty/)
- [Duolingo Max with GPT-4 — Roleplay feature design](https://blog.duolingo.com/duolingo-max/)
- [Speak app — product page](https://www.speak.com/)
- [OpenAI — How Speak personalizes language learning with AI](https://openai.com/index/speak-connor-zwick/)
- [ElevenLabs — Conversational AI Prompting Guide](https://elevenlabs.io/docs/conversational-ai/best-practices/prompting-guide)
- [ElevenLabs — Prompting Guide (general)](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide)
- [Edutopia — AI Tutors Can Work, With the Right Guardrails (Khan / unguarded ChatGPT study)](https://www.edutopia.org/article/ai-tutors-work-guardrails/)
- [The Learning Agency — How Speech Recognition Systems Struggle with Children's Voices](https://the-learning-agency.com/the-cutting-ed/article/how-speech-recognition-systems-struggle-with-childrens-voices/)
- [Smart Learning Environments — Over-reliance on AI dialogue systems systematic review](https://link.springer.com/article/10.1186/s40561-024-00316-7)
- [Gladia — Safety, hallucinations, guardrails for voice AI agents](https://www.gladia.io/blog/voice-ai-hallucinations)
- [Retell AI — Mitigating AI hallucinations in voice agents](https://www.retellai.com/blog/the-ultimate-guide-to-ai-hallucinations-in-voice-agents-and-how-to-mitigate-them)
- [NIH PMC — AI tutoring outperforms in-class active learning (RCT, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/)
