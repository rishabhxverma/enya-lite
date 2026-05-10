# Ultraplan 00 — Architecture, Stack & Design System

> **Audience:** All 4 developers + AI coding agents that will pick up specific tasks. Read this first.
> **Status:** LOCKED — these decisions are final. No design thinking required during build.

---

## 0. Project Identity

- **Codename:** Enya Lite (hackathon throwaway)
- **Repo path:** `/Users/rishabhverma/Desktop/Althra Hackathon/Enya Lite/` (empty as of plan time — `git init` then scaffold)
- **Reference codebase (read-only mining target):** `/Users/rishabhverma/Desktop/Enya/platform-mvp/frontend/` — copy components/styles/types FROM here, never push back to this repo.
- **Branch source for design extraction:** `development` (Akin's most recent frontend branch is `origin/chore/student-dash-cleanup` — a refactor, not new design tokens. Design system in `development` is current.)
- **Time box:** 7 hours hackathon + 8 hours autonomous overnight session = **~15 hours total wall clock**.
- **Demo:** localhost only. No deployment, no auth, no DB.

---

## 1. The Hackathon Pitch (memorize)

> "Watch a teacher upload their textbook, create a student, and see the AI generate a fully personalized course — then switch to the student view and experience that course as a **text lesson**, **video lesson with inline questions**, a **voice conversation activity**, and an **interactive story game**, all personalized to that specific student's interests, background, and EAL proficiency level."

**Demo students** (the two extremes):
- **Maya** — Grade 3, Emerging (A1), interests: butterflies + art, newcomer from Syria, quiet learner.
- **Liam** — Grade 6, Proficient (B1), interests: space + robotics, born in Canada, energetic + competitive.

**EAL proficiency levels (Enya naming → CEFR):**
| Enya | CEFR | Vocabulary Cap | Sentence Length |
|---|---|---|---|
| Emerging | A1 | ~500 high-freq words | <8 words avg |
| Developing | A2 | ~1,000 words | <12 words avg |
| Proficient | B1 | ~2,000 words | <18 words avg |
| Extending | B2–C1 | ~3,500+ words | unbounded |

---

## 2. L4 Personalization — The Non-Negotiable Concept

**This is NOT tiered generation.** We do not generate 4 versions of one lesson and serve the appropriate tier.

**What L4 actually means:** Every student gets **fresh, LLM-generated content unique to them**, every time. Two Grade-3 Emerging students with different interests get **completely different text, different stories, different quiz questions** even on the same lesson topic.

**Implementation rule:** Every content-generation tool call MUST receive the full student profile (`grade`, `eal_level`, `interests[]`, `cultural_background`, `learning_goals`) and the LLM weaves these in. Never generate generic content and template-substitute keywords.

**Demo evidence:** When Maya and Liam open the same "Photosynthesis" lesson, Maya sees A1 vocabulary with butterfly analogies; Liam sees B1 vocabulary with rocket-fuel/space-station analogies. Side-by-side switch between students must be **visually obvious**.

---

## 3. Tech Stack — LOCKED

### 3.1 Frontend
| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| Runtime | React | 19.0.0 |
| Language | TypeScript | 5.8.3 |
| Styling | Tailwind CSS | 4.1.7 |
| UI primitives | Radix UI + shadcn/ui (New York style, zinc base) | latest |
| State | Zustand | 5.0.12 |
| Data fetching | SWR | 2.3.8 |
| Forms | react-hook-form + Zod | 7.60 / 4.3 |
| Icons | lucide-react | 0.563 |
| Animation | motion (framer-motion successor) | 12.24.7 |
| Toasts | sonner | 2.0.7 |
| Video | react-youtube | 10.1 |
| Charts | recharts (sufficient — skip AMCharts for hackathon) | 2.15.4 |
| File upload | react-dropzone | 15 |
| HTTP | axios | 1.11 |

### 3.2 Visual Polish Layer (NEW additions on top of shadcn base)
| Library | Use For | Install |
|---|---|---|
| **Magic UI** | Animated cards, marquee, number tickers, animated buttons, animated lists | `npx shadcn@latest add "https://magicui.design/r/<component>"` per-component (no monolithic install) |
| **Aceternity UI** | Hero sections, spotlight, aurora background, 3D card, sparkles, BG beams | Copy components from aceternity.com/components into `shared/components/aceternity/` |
| **react-bits** | ShinyText, BlurText, GradientText, ClickSpark micro-interactions | `npm install @appletosolutions/reactbits` (note: some components are copy-paste — check each) |

**Layering rule:** Base = shadcn (`shared/components/ui/*`). Polish = Magic UI for component-level animation; Aceternity for full-section visual effects (hero, dashboard backgrounds); react-bits for inline text micro-interactions (greetings, headers).

### 3.3 Backend
| Layer | Choice | Notes |
|---|---|---|
| API | Next.js API routes (route handlers under `app/api/*`) | NO separate backend. NO Express. |
| AI Infrastructure | **Backboard.io** | Single assistant, per-turn tool swapping, threads per context, memory shared across threads |
| Doc parsing | **Docling** (Python) | Run as FastAPI sidecar on `localhost:8000`. Single endpoint: `POST /parse` → returns chunked text |
| Voice | **ElevenLabs Conversational AI** | (See §6 for evaluation) |
| Image gen | **OpenAI DALL-E 3** | Direct OpenAI API, NOT through Backboard. With quality gate (§7). |
| Video search | YouTube Data API v3 | Server-side proxy in API routes |
| Video transcript | `youtube-transcript-api` (Python) — co-located with Docling sidecar OR `youtube-transcript` (npm) | Pick npm version for simpler hackathon deploy |

### 3.4 Persistence
**NO DATABASE.** All persistence:
- **Backboard memory** — student profiles, teacher state, course metadata (auto-retrieved as context across all threads)
- **Backboard documents** — parsed textbook chunks (auto-chunked, auto-embedded for RAG)
- **Zustand client store** — UI state, current student, current thread ID
- **JSON seed files** — `public/seed/*.json` — pre-generated demo content for fallback / fast demo

### 3.5 Auth
**NONE.** A single `<RoleSwitcher />` component in the top nav lets the demo presenter flip between "Teacher" and "Student → [Maya | Liam]". No login, no session, no tokens.

---

## 4. Backboard.io — Single Assistant Architecture

### 4.1 Concept
**ONE assistant** with **ONE comprehensive system prompt** (see `ultraplan-02-system-prompt.md`). Different "modes" (teacher chat, student tutor, story game narrator, voice tutor) achieved by **passing different `tools` arrays per message**. Memory is shared across all threads of the same assistant — so the assistant's knowledge of all students/courses is global.

### 4.2 Thread Topology
| Thread | When created | Lifetime |
|---|---|---|
| `teacher-main` | First teacher chat open | Whole session |
| `student-{studentId}-main` | Student dashboard open for first time | Whole session |
| `student-{studentId}-story-{lessonId}` | Story game start | Until lesson complete |
| `student-{studentId}-voice-{lessonId}` | Voice activity start | Until activity complete |
| `student-{studentId}-text-{lessonId}` | Text lesson generation | Single request |
| `student-{studentId}-video-{lessonId}` | Video question generation | Single request |

Thread IDs are stored in Zustand keyed by `(role, studentId, mode, lessonId)`. Recreate if missing.

### 4.3 Tool-Swapping Pattern
Each `send_message()` call passes only the tools relevant to the current context. The assistant's system prompt tells it: "Your available tools tell you what mode you are in."

- Teacher chat → `teacherTools` array (15 tools — see `ultraplan-02-system-prompt.md` §3.1)
- Student dashboard chat → `studentTools` array (10 tools — §3.2)
- Story game node → just `[generate_story_game_node, generate_story_image]`
- Voice — handled by ElevenLabs's own function-calling (does not go through Backboard)

### 4.4 Model Selection (per-message override)
| Use Case | Provider | Model |
|---|---|---|
| Teacher chat (fast turns) | google | `gemini-2.0-flash` |
| Student chat (fast turns) | google | `gemini-2.0-flash` |
| Course outline generation | anthropic | `claude-sonnet-4-6` |
| Pedagogical audit | anthropic | `claude-sonnet-4-6` |
| Text lesson generation | anthropic | `claude-sonnet-4-6` |
| Story game node generation | anthropic | `claude-sonnet-4-6` |
| Quiz/question generation | openai | `gpt-4o` (good structured JSON) |
| Voice (entirely separate) | ElevenLabs internal | n/a |
| Image (separate) | OpenAI direct | `dall-e-3` |

**Cost is irrelevant for hackathon. Speed of TTFB during demo > all else.**

### 4.5 Memory Strategy
| Operation | Memory Setting |
|---|---|
| Teacher creates student | `Auto` — write profile to memory |
| Teacher updates student | `Auto` |
| Teacher uploads textbook | `Auto` — Backboard documents handle the chunking |
| Student generates content | `Readonly` — read student profile + textbook chunks, do not pollute memory with per-lesson generations |
| Story game turns | `Readonly` |
| Voice tutor (delegated) | n/a |

---

## 5. Data Model — TypeScript Interfaces

These types live in `shared/types/index.ts`. Adapted from `/Users/rishabhverma/Desktop/Enya/platform-mvp/frontend/shared/types/dto/` but slimmed down for hackathon (no DB columns, no audit fields).

```typescript
// EAL proficiency
export type EALLevel = 'Emerging' | 'Developing' | 'Proficient' | 'Extending';
export const EAL_TO_CEFR: Record<EALLevel, string> = {
  Emerging: 'A1', Developing: 'A2', Proficient: 'B1', Extending: 'B2-C1'
};

// Student
export interface StudentProfile {
  id: string;                      // 'maya' | 'liam'
  name: string;
  avatarUrl: string;
  grade: number;                    // 3 | 6
  ealLevel: EALLevel;
  interests: string[];              // ['butterflies', 'art']
  culturalBackground: string;       // 'Newcomer from Syria'
  learningGoals: string[];
  // Personalization theme
  theme: StudentTheme;
}

export interface StudentTheme {
  primaryColor: string;             // OKLCH or hex
  accentColor: string;
  backgroundPattern: 'butterflies' | 'starfield' | 'soccer' | 'ocean' | 'forest' | 'plain';
  heroImageUrl: string | null;      // AI-generated, null in degraded mode
  fontPairing?: 'whimsical' | 'futuristic' | 'classic';
}

// Course
export interface Course {
  id: string;
  title: string;
  topic: string;
  gradeLevel: number;
  curriculumStandard: string;       // 'BC Grade 3 Science 2.1' etc.
  units: Unit[];
  textbookDocumentId: string;       // Backboard document id
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  learningObjectives: string[];
  activities: Activity[];           // Always 4: text, video, voice, story (in order)
}

// Activity = one of 4 types
export type Activity =
  | { type: 'text'; id: string; status: ActivityStatus }
  | { type: 'video'; id: string; status: ActivityStatus; youtubeId?: string }
  | { type: 'voice'; id: string; status: ActivityStatus; activitySubtype: VoiceSubtype }
  | { type: 'story'; id: string; status: ActivityStatus; theme: string };

export type ActivityStatus = 'locked' | 'available' | 'in-progress' | 'complete';
export type VoiceSubtype = 'explain-back' | 'debate' | 'comprehension' | 'pronunciation';

// Generated content (cached in Zustand, optionally backed by JSON seed)
export interface TextLessonContent {
  studentId: string;
  lessonId: string;
  title: string;
  bodyMarkdown: string;             // markdown with embedded image alt-text
  diagrams: { caption: string; emojiArt: string }[]; // emoji art = no image gen needed
  comprehensionQuestions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  options?: string[];
  correctAnswerIndex?: number;
  correctAnswer?: string;
  explanation: string;              // shown on wrong answer
  learningObjectiveId: string;
}

export interface VideoLessonContent {
  studentId: string;
  lessonId: string;
  youtubeId: string;
  title: string;
  overlayQuestions: VideoOverlayQuestion[];
}
export interface VideoOverlayQuestion {
  pauseAtSeconds: number;
  question: QuizQuestion;
}

export interface StoryGameNode {
  id: string;
  narrative: string;                // personalized to student interests
  illustrationUrl: string | null;
  illustrationFallbackEmoji?: string;
  choices: StoryChoice[];
  isTerminal: boolean;
}
export interface StoryChoice {
  text: string;
  isCorrect: boolean;               // wrong choices → teaching moment
  learningObjectiveId: string;
  nextNodeId: string;               // or 'teaching-moment-{id}' for wrong
  feedbackOnSelect: string;
}

// Progress (client-only, Zustand)
export interface StudentProgress {
  studentId: string;
  xp: number;
  streakDays: number;
  completedActivities: string[];   // activity IDs
  quizScores: Record<string, number>; // quizId → 0-100
  skillMastery: Record<string, number>; // skillId → 0-100
}

// Teacher upload state
export interface TextbookUpload {
  id: string;
  filename: string;
  status: 'parsing' | 'ready' | 'failed';
  documentId: string;               // Backboard doc id once ready
  pageCount: number;
}
```

---

## 6. Voice — ElevenLabs vs OpenAI Realtime Decision

| Criterion | ElevenLabs Conv. AI | OpenAI Realtime |
|---|---|---|
| Latency | ~200-400ms | ~300-600ms |
| Voice quality (warmth) | **Higher** — designed for character-like voices, kid-friendly | Good but blander defaults |
| Cost | $0.10-0.15/min | $0.30/min |
| Function calling | Custom tools via webhook | Native, simpler wiring |
| EAL persona via system prompt | **Yes** — agent config supports per-conversation overrides | Yes |
| JS SDK | `@elevenlabs/elevenlabs-js` + `@elevenlabs/react` (hooks) | `openai` SDK + WebSocket |
| Time to first working integration | ~2 hr (with React hooks) | ~3 hr (more wiring) |
| Voice variety for 2 students | Pre-pick 2 voices in dashboard | Single voice unless you swap config mid-session |

**RECOMMENDATION: ElevenLabs Conversational AI.**
**Reasons:**
1. Warmer voices — matters more than anything for a kid-tutor demo.
2. Faster integration via `@elevenlabs/react` hooks (`useConversation`).
3. Per-conversation system prompt override means we can adapt to EAL level on the fly without a new agent.
4. Cost difference is irrelevant in a 5-min demo.

**Setup:**
1. Amin creates 1 ElevenLabs agent in dashboard with the **base** Voice Tutor system prompt (see `ultraplan-02-system-prompt.md` §4).
2. Each conversation overrides the system prompt with per-student EAL-adapted version via `Conversation.startSession({ overrides: { agent: { prompt: { prompt: customPrompt } } } })`.
3. Voice activity component uses `useConversation()` hook from `@elevenlabs/react`.
4. **Fallback:** A pre-recorded 30-second `.mp3` of a sample interaction in `public/seed/voice-fallback-{maya|liam}.mp3` that we play if the live agent fails. Toggle via `?voiceMode=simulated` URL param.

---

## 7. Image Generation — Quality Gate

### 7.1 Test Prompts (run during overnight session)

Style-locking prefix (used in EVERY prompt):
```
Children's storybook illustration, soft watercolor and pastel palette,
warm golden lighting, friendly cartoon style, no text, no letters,
safe for children ages 6-12, clean composition, single focal scene.
```

Five test scenes (one per interest theme):
1. **Butterflies** — "A young girl with curly black hair gently watching a monarch butterfly land on a sunflower in a garden"
2. **Space** — "A child in an astronaut suit floating outside a colorful space station, distant Earth visible"
3. **Soccer** — "A kid in a soccer uniform celebrating a goal in a stadium with confetti raining down"
4. **Animals** — "A young explorer with binoculars peeking at a family of foxes in a sunlit forest clearing"
5. **Fantasy** — "A young wizard with a glowing book on a stone bridge over a starlit river"

### 7.2 Acceptance Criteria
ALL 5 must pass:
- (a) **Stylistic consistency** — same illustrative style across all 5
- (b) **Child-appropriate** — no scary/violent/inappropriate content
- (c) **Scene relevance** — depicts what was asked
- (d) **No text/artifacts** — no garbled letters, no extra limbs
- (e) **<10s generation** — DALL-E 3 typically 8-12s; budget allowed

### 7.3 DALL-E 3 Settings (LOCKED if gate passes)
```
model: 'dall-e-3'
quality: 'hd'
style: 'natural'
size: '1024x1024'
n: 1
```

### 7.4 Fallback (if gate fails)
1. Pre-curated library of 30 illustrations per theme in `public/seed/illustrations/{butterflies|space|soccer|animals|fantasy}/*.jpg`. Source: Pexels free-license illustrations + Storyset.com (free with attribution) + Lottiefiles static exports.
2. Story game `generate_story_image` tool returns a **path from this library** chosen by LLM-based theme matching, NOT a generated image.
3. **Loud fallback signal in dev console:** `[IMG-FALLBACK] Using curated lib (gate failed at <timestamp>)`.

### 7.5 Always-On Tertiary Fallback
Even if both AI gen AND library lookup fail (e.g., network), every story node renders with `illustrationFallbackEmoji` (a 4-6 emoji "scene" — e.g., 🦋🌻🌈 — generated by the LLM). The story game must look beautiful at this fallback level too.

---

## 8. Design System Spec (Verbatim from Existing Codebase)

### 8.1 Source of Truth Files (to copy)
| Source | Destination |
|---|---|
| `<enya>/frontend/app/globals.css` | `app/globals.css` (copy verbatim, then extend) |
| `<enya>/frontend/tailwind.config.js` | `tailwind.config.js` (copy verbatim) |
| `<enya>/frontend/components.json` | `components.json` (copy verbatim) |
| `<enya>/frontend/shared/components/ui/*` | `shared/components/ui/*` (copy entire directory verbatim — 36 files) |
| `<enya>/frontend/shared/lib/utils.ts` | `shared/lib/utils.ts` (cn() helper) |

> `<enya>` = `/Users/rishabhverma/Desktop/Enya/platform-mvp/frontend`

### 8.2 Color Tokens (OKLCH — verbatim from `globals.css`)

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);          /* near-black charcoal */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.967 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.967 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.967 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);      /* red */
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.015 286.067);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);

  /* Yellow brand palette (50-950) */
  --color-yellow-50:  oklch(0.99 0.0261 104.54);
  --color-yellow-100: oklch(0.98 0.0681 103.09);
  --color-yellow-200: oklch(0.96 0.1352 104.6);
  --color-yellow-300: oklch(0.93 0.1738 101.77);
  --color-yellow-400: oklch(0.9 0.1805 96.68);
  --color-yellow-500: oklch(0.83 0.171572 82.0575);   /* PRIMARY BRAND */
  --color-yellow-600: oklch(0.72 0.156385 69.6841);
  --color-yellow-700: oklch(0.59 0.1416 58.07);
  --color-yellow-800: oklch(0.51 0.1218 54.9);
  --color-yellow-900: oklch(0.44 0.1025 54.97);
  --color-yellow-950: oklch(0.3 0.0734 55.14);

  /* Duolingo-style 3D button tokens (HSL) */
  --button-neutral: 0 0% 98%;
  --button-neutral-border: 0 0% 83%;
  --button-neutral-shadow: 0 0% 83%;
  --button-neutral-text: 0 0% 40%;
  --button-primary: 48 100% 96%;
  --button-primary-border: 45 93% 47%;
  --button-primary-shadow: 45 93% 47%;
  --button-primary-text: 26 83% 14%;
  --button-success: 142 76% 96%;
  --button-success-border: 142 76% 36%;
  --button-success-shadow: 142 76% 36%;
  --button-success-text: 142 76% 16%;
  --button-error: 0 86% 97%;
  --button-error-border: 0 84% 60%;
  --button-error-shadow: 0 84% 60%;
  --button-error-text: 0 74% 42%;
  --button-secondary: 213 97% 97%;
  --button-secondary-border: 213 94% 68%;
  --button-secondary-shadow: 213 94% 68%;

  /* Sidebar tokens */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.21 0.006 285.885);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.705 0.015 286.067);
}
```

### 8.3 Border Radius Scale
```
--radius-sm:   0.25rem    (calc(var(--radius) - 4px))
--radius-md:   0.375rem   (calc(var(--radius) - 2px))
--radius-lg:   0.625rem   (var(--radius))
--radius-xl:   1.025rem   (calc(var(--radius) + 4px))
--radius-2xl:  1.425rem   (calc(var(--radius) + 8px))
--radius-3xl:  1.825rem   (calc(var(--radius) + 12px))
--radius-4xl:  2.225rem   (calc(var(--radius) + 16px))
```

### 8.4 Typography
- **Font:** Inter (NOT Poppins — codebase truth wins). Weights 400, 500, 600, 700. Variable: `--font-inter`. Loaded in `app/layout.tsx` via `next/font/google` with `display: 'swap'` and fallback `arial, system-ui, sans-serif`.
- **Display use:** `font-semibold`, `font-bold` for headings. `text-3xl lg:text-4xl` for hero. `text-xl` for section headers. `text-sm` for body. `text-xs` for metadata.
- **Polish layer (NEW):** For student dashboard hero greeting, use **react-bits ShinyText** (animated gradient sweep) on the personalized greeting; **GradientText** for student name. Teacher dashboard stays plain.

### 8.5 Button — Verbatim CVA Variants

**Base classes** (apply to every variant):
```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md
text-sm font-medium transition-all duration-150 active:scale-[0.97]
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
disabled:pointer-events-none disabled:opacity-50
```

**Enya 3D variants** (Duolingo-style — these are the "wow" buttons):
- `enya_neutral` — gray, for cancel/back
- `enya_primary` — yellow, for primary CTAs (e.g., "Start Lesson")
- `enya_secondary` — blue, for secondary CTAs
- `enya_success` — green, for correct answers / completion
- `enya_error` — red, for wrong answer / destructive

Each enya variant has the pattern:
```
rounded-xl border-2 border-[hsl(var(--button-X-border))]
bg-[hsl(var(--button-X))] text-[hsl(var(--button-X-text))] font-bold
shadow-[0_4px_0_0_hsl(var(--button-X-shadow))]
active:shadow-none active:translate-y-[4px]
focus-visible:ring-2 focus-visible:ring-[hsl(var(--button-selected-border))]
focus-visible:ring-offset-2
```

**Standard variants** (also kept):
- `default`: `bg-yellow-500 text-primary-foreground hover:bg-yellow-400`
- `destructive`: `bg-destructive text-white hover:bg-destructive/90`
- `outline`: `border border-input bg-background hover:bg-accent hover:text-accent-foreground`
- `secondary`, `tertiary`, `ghost`, `link` — copy verbatim from source

**Sizes:** `default` (h-9 px-4), `sm` (h-8 px-3 text-xs), `lg` (h-10 px-8), `icon` (h-9 w-9).

### 8.6 Cards (verbatim)
```
bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-4 shadow-sm
```
For dashboard widgets, override with `border-2 rounded-3xl` (Enya widget style).

### 8.7 Animation Patterns
| Use | Library | Approach |
|---|---|---|
| Button press | Tailwind classes | `active:translate-y-[4px] active:shadow-none` (built into enya variants) |
| Card hover | Tailwind | `transition-all duration-200 hover:scale-[1.02] hover:shadow-md` |
| Page enter | motion | `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}` |
| Progress fill | motion | `animate={{ width: \`${pct}%\` }} transition={{ duration: 0.5, ease: 'easeOut' }}` |
| Modal open | Radix data-state | `data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0` |
| Confetti on quiz win | canvas-confetti (npm) | One-shot on correct streak ≥ 3 |
| Story node transition | motion AnimatePresence | Cross-fade narrative + slide choices in |

---

## 9. Student Dashboard Personalization Mechanism

**Goal:** When the demo presenter switches from Maya → Liam, the **student** dashboard looks **noticeably different** (color, BG image, accent). Teacher dashboard stays standard Enya yellow/zinc branding always.

### 9.1 How Theming Works
1. Each `StudentProfile` carries a `theme` object (see §5).
2. Student dashboard layout wraps content in `<div data-student={studentId} style={{ ... themeOverrides }}>`.
3. CSS variables overridden at this scope cascade to all children:
   ```css
   [data-student="maya"] {
     --student-primary: oklch(0.78 0.15 340);   /* warm pink */
     --student-accent:  oklch(0.85 0.18 50);    /* coral */
     --student-bg-pattern: url('/seed/themes/butterflies-pattern.svg');
   }
   [data-student="liam"] {
     --student-primary: oklch(0.55 0.22 260);   /* deep blue */
     --student-accent:  oklch(0.75 0.18 195);   /* cyan */
     --student-bg-pattern: url('/seed/themes/starfield-pattern.svg');
   }
   ```
4. Hero banner background uses `var(--student-hero-image)` set inline from `theme.heroImageUrl` (AI-generated during course creation, fallback to pattern SVG).

### 9.2 What Changes per Student
| Element | Maya (butterflies) | Liam (space) |
|---|---|---|
| Hero BG | AI image: garden + butterflies, soft watercolor | AI image: cosmic nebula, vibrant |
| Primary accent | Warm pink/coral | Deep blue/cyan |
| Pattern | Subtle butterfly silhouettes | Subtle starfield dots |
| Greeting font | Whimsical (handwritten serif) — load Caveat from Google fonts | Futuristic (Orbitron) |
| XP coin icon | Butterfly | Rocket |
| Streak flame | Pink heart | Blue lightning |
| Sound on correct (story game) | Soft chime | Sci-fi blip |

### 9.3 Pattern SVG Sources
- Butterflies: simple SVG repeat — Demi authors or AI-gen
- Starfield: simple radial gradient + dots SVG

---

## 10. Filesystem Structure (final)

```
Enya Lite/
├── app/
│   ├── layout.tsx                          # Root, fonts, providers
│   ├── globals.css                         # Verbatim copy + extensions
│   ├── page.tsx                            # Landing → role switcher
│   ├── teacher/
│   │   ├── layout.tsx                      # Teacher chrome
│   │   ├── page.tsx                        # Teacher chat home
│   │   ├── courses/page.tsx                # Course list
│   │   ├── courses/[id]/page.tsx           # Course detail
│   │   ├── analytics/page.tsx              # Analytics dashboard
│   │   ├── classroom/page.tsx              # Classroom mgmt
│   │   └── resources/page.tsx              # Resource library
│   ├── student/
│   │   ├── layout.tsx                      # Student chrome (themed)
│   │   ├── [studentId]/page.tsx            # Student dashboard
│   │   ├── [studentId]/onboarding/page.tsx # Placement quiz
│   │   ├── [studentId]/lesson/[lessonId]/text/page.tsx
│   │   ├── [studentId]/lesson/[lessonId]/video/page.tsx
│   │   ├── [studentId]/lesson/[lessonId]/voice/page.tsx
│   │   └── [studentId]/lesson/[lessonId]/story/page.tsx
│   └── api/
│       ├── backboard/                      # Backboard SDK proxy
│       │   ├── thread/route.ts
│       │   ├── message/route.ts
│       │   └── upload-document/route.ts
│       ├── teacher/
│       │   ├── parse-document/route.ts     # POST — calls Docling
│       │   ├── generate-course-outline/route.ts
│       │   ├── audit-content/route.ts
│       │   ├── adjust-eal/route.ts
│       │   ├── search-curriculum/route.ts
│       │   ├── map-curriculum/route.ts
│       │   ├── classroom/route.ts
│       │   ├── bulk-update-eal/route.ts
│       │   ├── search-resources/route.ts
│       │   ├── generate-quiz/route.ts
│       │   ├── preview-student/route.ts
│       │   ├── generate-report/route.ts
│       │   └── simplify-text/route.ts
│       ├── student/
│       │   ├── generate-text-lesson/route.ts
│       │   ├── generate-video-questions/route.ts
│       │   ├── search-youtube/route.ts
│       │   ├── generate-story-node/route.ts
│       │   ├── generate-story-image/route.ts
│       │   ├── submit-quiz-answer/route.ts
│       │   ├── progress/route.ts
│       │   ├── placement-quiz/route.ts
│       │   ├── voice-session/route.ts      # ElevenLabs signed URL
│       │   └── dashboard/route.ts
│       └── youtube/
│           ├── search/route.ts
│           └── transcript/route.ts
├── shared/
│   ├── components/
│   │   ├── ui/                             # 36 shadcn components (verbatim)
│   │   ├── magic/                          # Magic UI components (added)
│   │   ├── aceternity/                     # Aceternity components (added)
│   │   └── enya/                           # Custom Enya wrappers
│   ├── lib/
│   │   ├── utils.ts                        # cn() helper
│   │   ├── backboard.ts                    # Backboard SDK wrapper + retries
│   │   ├── elevenlabs.ts                   # Voice client
│   │   ├── openai-image.ts                 # DALL-E direct
│   │   └── docling-client.ts               # POST localhost:8000/parse
│   ├── hooks/                              # Subset of 14 hooks (use-zod-form, use-mobile, use-list)
│   ├── stores/                             # Zustand stores (Demi)
│   │   ├── role-store.ts
│   │   ├── student-store.ts
│   │   ├── progress-store.ts
│   │   └── thread-store.ts
│   ├── services/                           # Client-side service layer (Demi)
│   │   ├── backboard-service.ts
│   │   ├── student-service.ts
│   │   ├── course-service.ts
│   │   ├── progress-service.ts
│   │   └── voice-service.ts
│   └── types/
│       └── index.ts                        # All types from §5
├── features/
│   ├── role-switcher/                      # Top-nav role flipper
│   ├── teacher-chat/                       # Teacher chat assistant UI
│   ├── teacher-document-upload/            # Textbook upload
│   ├── teacher-analytics/                  # Analytics dashboard
│   ├── student-dashboard/                  # Personalized hero + course list
│   ├── student-onboarding/                 # Placement quiz flow
│   ├── activity-text-lesson/               # Text lesson page feature
│   ├── activity-video-lesson/              # Video w/ overlay questions
│   ├── activity-voice-tutor/               # ElevenLabs voice activity
│   └── activity-story-game/                # Branching story
├── public/
│   ├── seed/
│   │   ├── students.json                   # Maya + Liam profiles
│   │   ├── courses.json                    # Pre-seeded photosynthesis course
│   │   ├── lessons-maya/*.json             # Pre-generated content for Maya
│   │   ├── lessons-liam/*.json             # Pre-generated content for Liam
│   │   ├── illustrations/                  # Image fallback library
│   │   ├── themes/                         # SVG patterns
│   │   ├── voice-fallback-{maya,liam}.mp3
│   │   └── youtube-fallbacks.json          # 3 pre-vetted videos
│   ├── icons/, fonts/, etc.
├── docling-sidecar/                        # Python FastAPI for parsing
│   ├── main.py
│   └── requirements.txt
├── tailwind.config.js
├── components.json
├── package.json
├── next.config.mjs
├── tsconfig.json
├── .env.local                              # API keys (NOT committed)
└── README.md
```

---

## 11. Environment Variables (.env.local)

```
BACKBOARD_API_KEY=
BACKBOARD_ASSISTANT_ID=                     # Created during overnight session
OPENAI_API_KEY=                             # For DALL-E direct
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=                        # Created during overnight session
YOUTUBE_API_KEY=
DOCLING_SIDECAR_URL=http://localhost:8000

# Demo flags
NEXT_PUBLIC_USE_SEED_FALLBACK=false         # Flip to true if APIs flaky
NEXT_PUBLIC_VOICE_MODE=live                 # 'live' | 'simulated'
NEXT_PUBLIC_IMAGE_MODE=auto                 # 'auto' | 'curated' | 'emoji'
```

---

## 12. Definition of Done — Demo-Critical Checklist

The demo passes if and only if:

1. ✅ Role switcher flips Teacher ↔ Student[Maya] ↔ Student[Liam] in <1s with no console errors.
2. ✅ Teacher uploads PDF → sees parsing progress → AI generates course outline visible in chat.
3. ✅ Teacher creates a student via chat → student appears in `/student/[id]` route.
4. ✅ Teacher runs pedagogical audit on uploaded textbook → structured response with scores and recommendations renders.
5. ✅ Switch to Maya → her dashboard has butterfly theme, pink accents, AI-generated hero image.
6. ✅ Switch to Liam → his dashboard has space theme, blue accents, different hero.
7. ✅ Open Maya's text lesson → markdown content with butterfly analogies + A1 vocab visible. Same lesson opened as Liam → space analogies + B1 vocab.
8. ✅ Open video lesson → YouTube plays → pauses at 30s → overlay quiz question → answer → resume.
9. ✅ Open voice activity → ElevenLabs connects → student speaks → AI tutor responds with EAL-adapted speech. Bounded to 3-5 min.
10. ✅ Open story game → first node renders with image (or fallback) and 3 choices → click correct → next node. Click wrong → teaching moment → retry.
11. ✅ All 4 activities for Maya can complete in sequence end-to-end. Same for Liam (at least one).
12. ✅ Visual polish ≥ shadcn baseline (yellow brand, 3D buttons, animated hero greeting, smooth transitions). No console errors during demo path.

---

## 13. Risk Register & Mitigations

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Backboard API rate limit during demo | Med | High | Pre-seed all generated content as JSON; toggle `NEXT_PUBLIC_USE_SEED_FALLBACK=true` |
| DALL-E gate fails | Med | Med | Curated image library + emoji tertiary fallback (§7.4-7.5) |
| ElevenLabs WebSocket drops | Med | Med | Pre-recorded MP3 fallback + URL param toggle |
| YouTube API quota | Low | Med | Pre-vetted 3 videos in `youtube-fallbacks.json` per topic |
| Docling sidecar slow | Med | Low | Pre-parse demo textbook, cache chunks at startup |
| Magic UI / Aceternity / react-bits install hell | Med | Low | Overnight session pins exact versions + commits a working example of each |
| Student dashboard themes don't visually pop | Med | High (judging) | Akin must verify side-by-side switch is visually obvious — see Akin task A-08 |
| L4 personalization feels "samey" | Med | High | Demi writes a snapshot test that asserts Maya's text vs Liam's text differ by ≥40% (Levenshtein distance) — see Demi task D-09 |

---

## 14. What's Out of Scope (don't waste time on these)

- ❌ Real authentication, signup flows
- ❌ Database, migrations, ORM
- ❌ Multi-tenancy / districts / parents / admins
- ❌ Email, notifications, SMS
- ❌ Mobile responsive past 768px (demo on laptop only)
- ❌ Tests (unit, e2e) except the L4 personalization differential snapshot
- ❌ CI/CD, deployment
- ❌ Internationalization (English only)
- ❌ Accessibility (a11y) beyond what shadcn gives for free
- ❌ Real curriculum standards uploaded as documents — use a small hand-written extract for BC Grade 3 Science
- ❌ Real classroom roster CSV import — UI only, mock data
- ❌ Achievement/XP/streak math correctness — use random plausible values

---

> **Next files to read in order:** `ultraplan-01-overnight-session.md` (what Rishabh's autonomous Claude Code does tonight) → `ultraplan-02-system-prompt.md` (the assistant brain) → your specific task sheet (`03-rishabh`, `04-akin`, `05-demi`, `06-amin`) → `ultraplan-07-demo-script.md` → `ultraplan-08-seed-data.md`.
