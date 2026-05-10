# Ultraplan 03 — Rishabh's Tasks (Full Stack + AI Integration)

> **Role:** Full-stack lead. Owner of the AI infrastructure, all API routes, and the frontend↔backend wiring.
> **Phase split:** OVERNIGHT (autonomous Claude Code session, 8 hr — owns `ultraplan-01-overnight-session.md`) + MORNING (in-person, 7 hr — tasks below).
> **Pre-reqs:** All overnight tasks O-01..O-14 P0 complete. If any P0 incomplete at standup, that becomes Rishabh's first task.

---

## 🟢 Status (post-overnight)

R-04 through R-09 were front-loaded into the overnight run because the autonomous session finished P0 in ~3 hours. Most of the morning's wiring work is already on disk.

| Task | Status | Notes |
|---|---|---|
| R-01 Morning triage | ⏳ Pending | Read `OVERNIGHT-REPORT.md`, run `npm run check` (20-pt pre-demo). All checks were green at session end. |
| R-02 Patch broken P0 | ⏳ Pending | No known patches needed. Verify with smoke scripts. |
| R-03 Pre-generate demo content | 🟡 Partial | Seed files exist with high-quality Rishabh-authored content. Once `BACKBOARD_API_KEY` lands, optionally re-run a script to overwrite with real Claude-Sonnet generations for "live" wow factor. |
| R-04 Wire teacher chat | ✅ DONE | `features/teacher-chat/` fully functional. Empty state with chips, drag-drop upload, all 5 tool result cards, keyword-dispatched stub fallback when no key. Replace fallback with live `runToolLoop` when `BACKBOARD_ASSISTANT_ID` is set — already wired in `/api/backboard/message`. |
| R-05 Wire student dashboard | ✅ DONE | `features/student-dashboard/` — themed hero, quick stats row, today's lesson card, motivational nudges. `useStudentDashboard` hook handles seed → API → fallback chain. |
| R-06 Wire text lesson | ✅ DONE | `features/activity-text-lesson/` — react-markdown body, themed accents, emoji diagram cards, 3 interactive comprehension questions, confetti on full streak, completion + XP wired into progress store. |
| R-07 Wire video lesson | ✅ DONE | `features/activity-video-lesson/` — react-youtube + auto-pause overlay quiz Dialog at scripted timestamps, resume on answer. |
| R-08 Wire voice activity | 🟡 Partial | Splash + animated mic orb + countdown timer + scripted simulated transcript + summary card all done. **Morning task:** swap simulated branch for live `useConversation` from `@elevenlabs/react` (~30 min). API route already returns the signed URL + persona prompt when keys are present. |
| R-09 Wire story game | ✅ DONE | `features/activity-story-game/` — branching nodes, gentle teaching-moment modal, confetti on completion, emoji-scene fallback when illustration missing. Loads from seed JSON; falls back to live API when seed missing. |
| R-10 Final integration smoke + rehearsal | ⏳ Pending | Walk demo path + test fallback toggles + pin commits. |
| R-11 Streaming tool-call states (P1) | ❌ Not done | Optional polish; current single POST/await pattern works fine. |
| **D-06b** Client seed-fallback runtime toggle | ⏳ NEW (Demi reassignment) | `localStorage.USE_SEED_FALLBACK='true'` should make every client service hit `/seed/*.json` directly. ~20 min. |
| **D-09** SWR caching hooks | ⏳ NEW (Demi reassignment) | Wrap dashboard/course/progress reads so role flips don't re-hit endpoint. ~25 min. |
| **D-13** Demo standby | ⏳ NEW (Demi reassignment) | Sit next to Amin during rehearsals, fix bugs live. ~60 min spread across afternoon. |

**Repo:** https://github.com/rishabhxverma/enya-lite (private, master tracked).

---

## Reading Order
1. `ultraplan-00-architecture.md` (architecture + types)
2. `ultraplan-01-overnight-session.md` (your overnight plan)
3. `ultraplan-02-system-prompt.md` (assistant + tools)
4. This file

---

## Task R-01 — Morning Triage & Status Sync (30 min, t=0:00–0:30)

**Assigned to:** Rishabh
**Dependencies:** Overnight session complete
**Objective:** Verify what overnight session shipped vs broken, brief team at standup.

**Files to read:**
- `OVERNIGHT-REPORT.md` (written by autonomous session)
- `git log --oneline` since project start

**Implementation spec:**
1. Read OVERNIGHT-REPORT.md.
2. Run `npm run dev` + `npm run sidecar`. Verify:
   - Homepage loads.
   - Role switcher works.
   - All 25 API routes return 200 to a curl smoke test (write `scripts/morning-smoke.sh`).
   - Backboard assistant responds to a test message.
3. Identify:
   - Which P0 tasks are complete vs broken.
   - Which P1/P2 tasks completed (bonuses).
   - Hot spots: any flaky pieces requiring babysitting during demo.
4. At 8:30 standup, brief team: "Working: X. Flaky: Y. Broken: Z."
5. Pin the OVERNIGHT-REPORT.md commit SHA — that's the team's morning baseline.

**Acceptance:** Standup happens, every dev knows their starting point + known issues.

**Demo criticality:** Must Have

---

## Task R-02 — Patch any broken P0 tasks from overnight (60 min, t=0:30–1:30)

**Objective:** If any of O-01 through O-14 P0 tasks are incomplete, fix them now. Time-box per task at 15 min — if not done, mark BLOCKED and revisit later.

**Acceptance:** Either everything from §2 of `ultraplan-01` works, or a documented downgrade plan exists (e.g., "voice activity uses simulated MP3 only").

**Demo criticality:** Must Have

---

## Task R-03 — Pre-generate Demo Content via Real APIs (45 min, t=1:30–2:15)

**Dependencies:** R-01, R-02
**Objective:** Run `scripts/pregenerate-content.ts` against the live Backboard API to populate `public/seed/lessons-{maya|liam}/*.json` with REAL generated content. This is the safety net — if any API craps out during demo, we toggle `NEXT_PUBLIC_USE_SEED_FALLBACK=true` and load these files.

**Files to create/modify:**
- `scripts/pregenerate-content.ts` (extend if exists)
- `public/seed/lessons-maya/*.json`
- `public/seed/lessons-liam/*.json`

**Implementation spec:**
1. Define matrix: 2 students × 3 lessons × 4 activities = 24 generations.
2. For each combo, call the real generation endpoint (with student profile in payload).
3. Validate response against the matching zod schema.
4. Write to `public/seed/lessons-{studentId}/{lessonId}-{activityType}.json` with file shape `{ generatedAt: ISOString, content: ContentType, version: 1 }`.
5. Log a summary: "Generated 24/24, all valid. Avg time: X seconds."
6. **Specifically validate L4 differential** — diff Maya's text-photosynthesis vs Liam's text-photosynthesis. Levenshtein distance must be >40% of total length. If not, regenerate with stronger interest hooks in the prompt.

**Acceptance criteria:**
- 24 JSON files exist, all parse against types.
- Diff between same-lesson different-student content is visibly substantial.
- Loading any seed file in `<TextLesson />` renders correctly.

**Estimated time:** 45 min (most spent waiting on LLM)

**Demo criticality:** Must Have (this is our resilience layer)

---

## Task R-04 — Wire Teacher Chat Component to Backboard (60 min, t=2:15–3:15)

**Dependencies:** R-01, Akin must have stub chat UI in place at `features/teacher-chat/`
**Objective:** The teacher chat component sends messages to Backboard, handles tool-calling loop, displays inline tool results (uploaded file status, course outline preview, audit cards).

**Files to modify:**
- `features/teacher-chat/teacher-chat.tsx` (Akin owns the layout; Rishabh owns the data layer)
- `features/teacher-chat/use-teacher-chat.ts` (new hook — Rishabh)
- `app/api/backboard/message/route.ts` (POST relay)

**Implementation spec:**

`useTeacherChat()` hook signature:
```typescript
interface UseTeacherChat {
  messages: ChatMessage[];
  isLoading: boolean;
  pendingToolCalls: ToolCall[];
  send: (content: string, attachments?: { uploadId: string; filename: string }[]) => Promise<void>;
  uploadFile: (file: File) => Promise<{ uploadId: string }>;
  resetThread: () => void;
}
```

Implementation:
1. Hook owns the thread ID via `useThreadStore('teacher-main')`.
2. On `send()`:
   - Optimistically append user message to local state.
   - POST to `/api/backboard/message` with `{ threadId, content, role: 'teacher' }`.
   - Server-side: calls `runToolLoop` with `TEACHER_TOOLS` and `TEACHER_HANDLERS`.
   - Stream tool-call states back via SSE OR poll. **For hackathon: use a single POST that returns the FULL response after the tool loop completes** (simpler, acceptable latency for demo). Add a "loading message" with spinner while waiting.
3. Tool-call results (e.g., course outline, audit) come back as part of the assistant's final message text but ALSO as `toolResults: { toolName, args, result }[]` in the response. The UI uses `toolResults` to render inline cards (e.g., `<CourseOutlinePreview outline={result.course} />`).
4. `uploadFile()`:
   - POST to `/api/teacher/parse-document` with the file (multipart).
   - Returns `uploadId` (matches the documentId from Backboard).
   - The file is now in Backboard documents; subsequent generation tools reference it by ID.

**Tool result UI mapping** (Akin builds these components, you wire them up):
| Tool name | Result component |
|---|---|
| parse_uploaded_document | `<UploadStatusCard />` |
| generate_course_outline | `<CourseOutlinePreview />` |
| audit_content_pedagogically | `<PedagogicalAuditCard />` |
| create_student_profile | `<StudentProfileCard />` |
| get_student_analytics | `<AnalyticsSummaryCard />` |
| Other tools | `<ToolResultJson />` (fallback — pretty-printed JSON for hackathon) |

**Acceptance criteria:**
- Sending "What can you help me with?" returns a friendly greeting from the assistant.
- Sending "Audit my textbook for Bloom's taxonomy" (after a file is uploaded) triggers the audit tool, the audit card renders inline.
- Sending "Create a Grade 3 photosynthesis course" with the demo PDF uploaded triggers parse → outline → outline card renders.

**Demo criticality:** Must Have

---

## Task R-05 — Wire Student Dashboard Chat / Personalized Greeting (45 min, t=3:15–4:00)

**Dependencies:** R-01, Demi's stores complete (D-01..D-04)
**Objective:** Student dashboard greets the student personally on load, surfaces today's recommended lesson.

**Files to modify:**
- `features/student-dashboard/student-greeting.tsx` (Akin scaffolds; Rishabh wires data)
- `features/student-dashboard/use-student-dashboard.ts`

**Implementation spec:**
1. On dashboard mount, call `/api/student/dashboard` with `{ studentId }`.
2. The route calls Backboard with `[get_personalized_dashboard]` tool, memory=Readonly. Returns `{ greeting, todaysRecommendation, xp, streakDays, motivationalNudges, themedHeroImageUrl }`.
3. Cache the response per-student in Zustand for 5 min so switching back doesn't re-hit the API.
4. Wrap greeting in `<ShinyText>` (react-bits) — animated gradient sweep.
5. Wrap student name in `<GradientText>`.
6. If `themedHeroImageUrl` is null, fall back to `theme.backgroundPattern` SVG.

**Acceptance criteria:**
- Maya's dashboard loads with butterfly-themed greeting in <2s. Liam's loads with space-themed greeting.
- Greetings differ in vocabulary (Maya = simpler).
- Hero image loads or pattern fallback shows with no broken-image icon.

**Demo criticality:** Must Have

---

## Task R-06 — Wire Text Lesson Page (45 min, t=4:00–4:45)

**Dependencies:** R-01, R-03, Akin's TextLesson component scaffolded
**Objective:** Text lesson page renders generated content for the current student × lesson.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/text/page.tsx`
- `features/activity-text-lesson/text-lesson.tsx`
- `features/activity-text-lesson/use-text-lesson.ts`

**Implementation spec:**
1. On mount, hook tries: (a) seed file `public/seed/lessons-{studentId}/{lessonId}-text.json`. (b) live API call to `/api/student/generate-text-lesson` if seed missing or `NEXT_PUBLIC_USE_SEED_FALLBACK=false`.
2. Render markdown body with `react-markdown` (`npm install react-markdown`) plus `remark-gfm` for tables/lists.
3. Render `diagrams` array as styled cards with the emoji art centered, large font, with caption below.
4. Render `comprehensionQuestions` at the bottom — each is an interactive `<QuizQuestion />` (Demi builds; Rishabh integrates).
5. On answer submit, call `/api/student/submit-quiz-answer`, show feedback inline.
6. Track completion: mark activity complete when ≥2 of 3 questions answered correctly. Update progress store.

**Acceptance criteria:**
- Maya's text lesson opens, renders butterfly-themed photosynthesis text in A1 vocab in <1s (seed) or <8s (live).
- Liam's text lesson opens, renders space-themed photosynthesis text in B1 vocab.
- Comprehension questions interactive; correct answers show green feedback; incorrect show explanation.

**Demo criticality:** Must Have

---

## Task R-07 — Wire Video Lesson Page with Overlay Questions (60 min, t=4:45–5:45)

**Dependencies:** R-01, R-03, Akin's VideoLesson component scaffolded
**Objective:** YouTube video plays, pauses at scripted timestamps, shows overlay quiz, resumes after answer.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/video/page.tsx`
- `features/activity-video-lesson/video-lesson.tsx`
- `features/activity-video-lesson/use-video-lesson.ts`

**Reusable code from existing codebase:**
- COPY: `_enya-reference/frontend/features/student-course-view/components/youtube-player.tsx` → `features/activity-video-lesson/youtube-player.tsx`
  - Modifications: Strip Enya-specific completion tracking that depends on the old API. Keep: pause detection, time tracking, responsive sizing.

**Implementation spec:**
1. On mount, load video data:
   - Try seed `public/seed/lessons-{studentId}/{lessonId}-video.json` first
   - If missing, call `/api/student/search-youtube` then `/api/student/generate-video-questions` sequentially
   - If both fail, use fallback from `public/seed/youtube-fallbacks.json`
2. Render `<YouTubePlayer videoId={youtubeId} onTimeUpdate={handleTimeUpdate} ref={playerRef} />`.
3. Maintain state: `currentTime` (updated every 250ms via `getCurrentTime()`), `pendingOverlayQuestion: VideoOverlayQuestion | null`, `answeredQuestionIds: Set<string>`.
4. On every time tick, check overlayQuestions: if any has `pauseAtSeconds <= currentTime` AND not in `answeredQuestionIds` AND `pendingOverlayQuestion === null`:
   - `playerRef.current.pauseVideo()`
   - `setPendingOverlayQuestion(matchingQuestion)`
5. Render overlay as `<Dialog modal>` over the video — uses shadcn Dialog.
6. On answer: POST to `submit-quiz-answer`, show feedback, on close `playerRef.current.playVideo()` and add to `answeredQuestionIds`.
7. Mark activity complete when video reaches 90% AND all questions answered.

**Acceptance criteria:**
- Video starts playing on click.
- Pauses at the right moment for the first overlay question (e.g., 30s).
- Quiz overlay visually overlaps the video; video paused.
- Answer → feedback → video resumes from where it paused.
- Completing video + questions marks activity complete.

**Demo criticality:** Must Have

---

## Task R-08 — Wire Voice Activity Page (60 min, t=5:45–6:45)

**Dependencies:** R-01, O-09 from overnight, Akin's VoiceActivity scaffolded
**Objective:** Voice activity page connects to ElevenLabs, conducts bounded conversation, shows live status.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/voice/page.tsx`
- `features/activity-voice-tutor/voice-conversation.tsx`
- `features/activity-voice-tutor/use-voice-conversation.ts`

**Implementation spec:**
1. On mount, render a "Start Voice Activity" splash with: activity subtype description, expected duration, "Start" button (`<Button variant="enya_primary">Start</Button>`).
2. On start:
   - POST to `/api/student/voice-session` with `{ studentId, lessonId, activitySubtype }`.
   - Returns `{ signedUrl, agentPersonaPrompt, maxDurationSeconds }`.
   - Use `useConversation()` from `@elevenlabs/react`.
   - Call `conversation.startSession({ signedUrl, overrides: { agent: { prompt: { prompt: agentPersonaPrompt } } } })`.
3. Maintain state machine: `idle` → `connecting` → `listening` → `speaking` → `ended` (success/timeout/error).
4. UI:
   - Big animated mic icon that pulses while `listening`, stays solid while `speaking`.
   - Live transcript on the right (use `conversation.getMessages()` or message events).
   - Timer in top-right showing time remaining.
   - "End conversation" button.
5. **Bounded:** auto-end after `maxDurationSeconds` (5 min default).
6. **On end:** show summary card — "You did great with X. The AI tutor noted Y." (use a final summary message from the agent).
7. **Fallback path:** if `process.env.NEXT_PUBLIC_VOICE_MODE === 'simulated'` OR live connection fails twice, switch to playing `public/seed/voice-fallback-{studentId}.mp3` and showing a static transcript.

**Acceptance criteria:**
- Click "Start" → mic asks permission → connects in <3s.
- Speaking the student's part triggers agent response.
- Voice tutor uses EAL-appropriate vocabulary (verify in test by listening to Maya session vs Liam session).
- 5-min timer ends session cleanly.
- Simulated fallback works when toggled.

**Demo criticality:** Must Have (with fallback as safety)

---

## Task R-09 — Wire Story Game Page (75 min, t=6:45–8:00)

**Dependencies:** R-01, R-03, O-10 image gate, Akin's StoryGame scaffolded
**Objective:** Branching story game with personalized narrative, illustrations, gentle teaching on wrong choices.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/story/page.tsx`
- `features/activity-story-game/story-game.tsx`
- `features/activity-story-game/use-story-game.ts`
- `features/activity-story-game/story-node.tsx`
- `features/activity-story-game/story-choice.tsx`

**Implementation spec:**
1. Story state: `nodes: StoryGameNode[]` (history), `currentNode: StoryGameNode | null`, `isLoading`, `isComplete`.
2. On mount: try seed `public/seed/lessons-{studentId}/{lessonId}-story.json` → `{ initialNode: StoryGameNode, allNodes?: Record<string, StoryGameNode> }`. If missing, call `/api/student/generate-story-node` with `isFirstNode: true`.
3. Render `<StoryNode>`:
   - Top: `<motion.img>` of illustration, fades in, with caption-less alt text.
   - Middle: narrative paragraphs (motion fade-in word-by-word for first node only — "wow" effect).
   - Bottom: 2-4 `<StoryChoice>` buttons, each large (`enya_secondary` variant), full-width, with the choice text.
4. On choice click:
   - Show pressed state.
   - If `choice.isCorrect`:
     - Sound: success chime (`new Audio('/seed/sfx/correct-{theme}.mp3').play()` if available, silent fallback).
     - Award XP via progress store.
     - If next node has ID, fetch it (seed first, fallback live API). If `isComplete`, show ending screen.
   - If wrong:
     - Sound: gentle "thunk" (NOT a buzzer).
     - Show `feedbackOnSelect` as a soft modal: "Hmm, let's think about this differently. <feedback>." with "Try again" CTA.
     - Don't penalize XP.
     - Return to same node (with the wrong choice visually disabled).
5. Image fallback chain:
   - `node.illustrationUrl` → render `<img>`
   - If null OR image fails to load (onerror): show `node.illustrationFallbackEmoji` in a stylized large-emoji card
6. Final node: completion screen — "You completed [adventure title]! +50 XP. Skill unlocked: [skill]."

**Acceptance criteria:**
- Maya's story = butterfly garden adventure with photosynthesis lessons. Liam's = space station.
- Wrong answer feedback is gentle, never shaming.
- Image visible (or pretty fallback). Page never shows broken image.
- After 5-7 nodes, story concludes with celebration.

**Demo criticality:** Must Have

---

## Task R-10 — Final Integration Smoke Test + Demo Rehearsal (30 min, t=8:00–8:30)

**Dependencies:** All other team tasks
**Objective:** Walk the full demo path, fix any final glitches, confirm fallback toggles work.

**Implementation spec:**
1. Walk `ultraplan-07-demo-script.md` end to end on the demo machine.
2. Time each segment. Total should be <8 min.
3. Test fallback toggles:
   - Set `NEXT_PUBLIC_USE_SEED_FALLBACK=true` mid-walk; verify everything still works.
   - Set `NEXT_PUBLIC_VOICE_MODE=simulated`; verify voice plays MP3.
4. Disable wifi briefly; verify seed-only path works.
5. Pin all fixes. Final commit: `chore: demo-ready`.

**Acceptance criteria:** Full demo runs <8 min with no errors.

**Demo criticality:** Must Have

---

## Task R-11 (P1, optional) — Fancy Polish: Streaming Tool-Call States (45 min)

**Objective:** Replace the single POST/await pattern with SSE streaming so the chat shows live "Parsing your textbook..." → "Generating outline..." → "Done!" progression.

**Files to modify:**
- `app/api/backboard/message/route.ts` — return `Response` with SSE-encoded body
- `features/teacher-chat/use-teacher-chat.ts` — consume SSE

**Demo criticality:** Polish

---

## Reusable Code Inventory

Files Rishabh should reference/copy from `_enya-reference/frontend/`:

| Existing file | Purpose | How Rishabh uses it |
|---|---|---|
| `shared/services/quiz-grading-service.ts` | Existing grading patterns | Reference for `submit_quiz_answer` shape |
| `features/student-course-view/components/youtube-player.tsx` | YouTube wrapper | Copy/strip for video lesson |
| `shared/lib/utils.ts` | cn() helper | Copy verbatim |
| `shared/types/dto/QuizQuestion.ts` | Question type | Reference; we use simplified version |
| `shared/types/dto/StudentProgress.ts` | Progress type | Reference; we use simplified version |

---

## Environment Variables Rishabh Owns

Rishabh maintains `.env.local` and shares values via secure channel (1Password / Signal — NOT Slack):
```
BACKBOARD_API_KEY=
BACKBOARD_ASSISTANT_ID=
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
YOUTUBE_API_KEY=
DOCLING_SIDECAR_URL=http://localhost:8000
NEXT_PUBLIC_USE_SEED_FALLBACK=false
NEXT_PUBLIC_VOICE_MODE=live
NEXT_PUBLIC_IMAGE_MODE=auto
```

---

## Rishabh's Daily Schedule

| Time | Task |
|---|---|
| Night before | Run overnight session, reach REM-replacement nirvana |
| 8:00 AM | Wake. Coffee. Read OVERNIGHT-REPORT.md |
| 8:30 AM | Standup, R-01 |
| 9:00 AM | R-02 (patch broken overnight) |
| 10:00 AM | R-03 (pre-generate content) |
| 10:45 AM | R-04 (teacher chat wiring) |
| 11:45 AM | R-05 (student dashboard wiring) |
| 12:30 PM | LUNCH (working lunch — light) |
| 1:00 PM | R-06 (text lesson) |
| 1:45 PM | R-07 (video lesson) |
| 2:45 PM | R-08 (voice activity) |
| 3:45 PM | R-09 (story game) — biggest task |
| 5:00 PM | R-10 (final integration smoke) |
| 5:30 PM | Demo, win, sleep for 16 hours |
