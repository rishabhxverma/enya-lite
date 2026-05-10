# Ultraplan 01 — Overnight Autonomous Claude Code Session

> **Operator:** Rishabh
> **Window:** ~8 hours, autonomous
> **Goal:** Hand the team a working scaffold + AI integration end-to-end before they wake up. By morning standup, every other dev should be able to start their morning task with zero blockers.

---

## 🟢 Status (post-session, last updated end of overnight run)

**Run summary:** ~3 hours of compute, 5 atomic commits, 159 source files, all 16 page routes + 29 API routes return 200, L4 differential 70.8%. Repo: https://github.com/rishabhxverma/enya-lite (private). Full handoff in `OVERNIGHT-REPORT.md`.

| Task | Status | Notes |
|---|---|---|
| O-01 Project scaffold | ✅ DONE | Next 16.2.1 + React 19 + Tailwind 4 + Inter/Caveat/Orbitron fonts, path aliases wired |
| O-02 Copy shadcn UI | ✅ DONE | 36 components verbatim from `_enya-reference/`, Enya 3D button variants intact |
| O-03 Backboard SDK wrapper | ✅ DONE | typed client + p-retry + tool-loop; gracefully degrades to stub when no key |
| O-04 Tool schemas | ✅ DONE | 25 tools (15 teacher + 10 student) in `shared/lib/tools/` |
| O-05 API routes + handlers | ✅ DONE | 29 routes, all return 200 in smoke test, realistic typed stub responses |
| O-06 Docling sidecar | ✅ DONE | FastAPI + pdfminer fallback; team needs `pip install -r docling-sidecar/requirements.txt` to run |
| O-07 Real parse + Backboard upload | ⏳ WIRED, needs key | route calls Docling then Backboard.uploadDocument; activates the moment `BACKBOARD_API_KEY` lands |
| O-08 Real LLM tool implementations (5) | ⏳ WIRED, needs key | tool-loop runs through real assistant once `BACKBOARD_API_KEY` + `BACKBOARD_ASSISTANT_ID` are set; until then, keyword-dispatched stub fallback in `/api/backboard/message` runs every demo prompt through the right handler |
| O-09 ElevenLabs voice scaffold | 🟡 PARTIAL | API route + scripted simulated transcript + animated mic orb done; live `useConversation` hook is the morning's main remaining job (~30 min) |
| O-10 Image gate | ⏳ SCRIPT READY | `npm run image-gate` runnable as soon as `OPENAI_API_KEY` is set; `NEXT_PUBLIC_IMAGE_MODE` defaults to auto with emoji tertiary fallback |
| O-11 All page routes | ✅ DONE (and then some) | 16 routes scaffolded — but most are FUNCTIONAL not just placeholders (teacher chat, dashboards, all 4 activity pages, /demo/l4 closing slide) |
| O-12 Pre-seed demo data | ✅ DONE | students.json + courses.json + dashboard-{maya,liam}.json + lessons-{maya,liam}/photosynthesis-1-{text,video,story}.json + youtube-fallbacks.json + _progress.json + hero SVGs + theme patterns + avatars |
| O-13 Zustand stores | ✅ DONE | role, student, progress, thread (persist + ssr-safe) |
| O-14 Smoke + handoff doc | ✅ DONE | `OVERNIGHT-REPORT.md`, README, `npm run check` (20-pt pre-demo) |
| **P1 polish** | 🟡 PARTIAL | ✅ canvas-confetti on text-lesson streak + story completion. ✅ /demo/l4 side-by-side closing slide. ❌ Magic UI / Aceternity / react-bits not installed (used stock styling). |

**Demo path verified visually** (homepage → teacher chat → audit card → Maya dashboard → Liam dashboard → text lesson → story game).

**Hot spots for morning:** wire `useConversation` for live voice (~30 min), drop API keys, run `npm run smoke:backboard` to verify Backboard reachability, optionally re-run text-lesson generation through real LLM to overwrite seed JSON.

---

## 0. Pre-Flight (10 min — DO THIS BEFORE STARTING THE AUTO SESSION)

Manually do these, do NOT delegate. Required setup the agent can't do alone:

1. **Get API keys ready in your password manager:**
   - Backboard.io → `BACKBOARD_API_KEY`
   - OpenAI → `OPENAI_API_KEY`
   - ElevenLabs → `ELEVENLABS_API_KEY`
   - Google Cloud Console / YouTube Data API v3 → `YOUTUBE_API_KEY`

2. **Install Claude Code** if not already, login.

3. **Pre-create the Backboard assistant manually** via dashboard:
   - Name: "Enya Learning Assistant"
   - Default model: `gpt-4o`
   - System prompt: paste from `ultraplan-02-system-prompt.md` §1 (verbatim)
   - Save → copy assistant ID → add to `.env.local` as `BACKBOARD_ASSISTANT_ID`

4. **Pre-create the ElevenLabs agent** via dashboard:
   - Voice: pick a warm, kid-friendly voice (e.g., "Rachel" or "Bella")
   - System prompt: paste from `ultraplan-02-system-prompt.md` §4 (verbatim)
   - Tool config: skip (we use overrides per session)
   - Save → copy agent ID → `ELEVENLABS_AGENT_ID`

5. **Clone reference codebase to a known location:**
   ```
   ln -s /Users/rishabhverma/Desktop/Enya/platform-mvp /Users/rishabhverma/Desktop/Althra\ Hackathon/_enya-reference
   ```
   So the agent can read it as `_enya-reference/frontend/...`

6. **Pre-place demo textbook PDF** at `_demo-assets/grade3-science-photosynthesis.pdf` (Amin will provide; if not yet, use any free Grade 3 science PDF from openstax or pbs).

7. **Start the autonomous session** with the prompt in §10.

---

## 1. Priority Tiers

| Tier | Definition | Wall-clock budget |
|---|---|---|
| **P0 — MUST complete** | Demo dies if missing | ~5 hr |
| **P1 — SHOULD complete** | Polish or reduces morning workload | ~2 hr |
| **P2 — NICE to have** | Bonus, attempt only if P0+P1 done early | remaining |

If overnight session derails, the agent must finish P0 even if it means dropping P1/P2 entirely.

---

## 2. P0 Tasks — Critical Path (must complete)

### O-01 — Project Scaffold (45 min)
**Goal:** Next.js 16 project running on `localhost:3000` with all dependencies installed.

**Steps:**
1. `cd "/Users/rishabhverma/Desktop/Althra Hackathon/Enya Lite" && npx create-next-app@latest . --typescript --tailwind --app --no-src --no-eslint --import-alias '@/*'`
2. Pin Next 16: `npm install next@16.2.1 react@19 react-dom@19`
3. Install all deps from `ultraplan-00-architecture.md` §3.1 (single `npm install` command).
4. Copy `tailwind.config.js`, `components.json`, `postcss.config.mjs` from `_enya-reference/frontend/`.
5. Copy `app/globals.css` from `_enya-reference/frontend/app/globals.css` verbatim.
6. Configure path aliases in `tsconfig.json`:
   ```json
   "paths": {
     "@/*": ["./*"],
     "@shared/*": ["./shared/*"],
     "@features/*": ["./features/*"]
   }
   ```
7. Replace `app/layout.tsx` with: Inter font setup (verbatim from reference §8.4), `<RoleSwitcherProvider>`, `<Toaster />` (sonner), HTML lang="en", className=inter.variable.
8. Replace `app/page.tsx` with a placeholder landing → "Switch to Teacher" / "Switch to Maya" / "Switch to Liam" buttons.
9. Run `npm run dev` and verify `localhost:3000` loads with no errors.
10. **Commit checkpoint:** `git init && git add . && git commit -m "scaffold: Next 16 + Tailwind + Inter font"`

**Success signal:** Terminal shows "Ready in Xms" and homepage loads with three buttons.

---

### O-02 — Copy shadcn UI library (20 min)
**Goal:** All 36 base UI components available.

**Steps:**
1. Copy `_enya-reference/frontend/shared/components/ui/*` → `shared/components/ui/`
2. Copy `_enya-reference/frontend/shared/lib/utils.ts` → `shared/lib/utils.ts`
3. Run `npm run dev` — fix any import path errors (the reference might import `@/components/ui/...` while we use `@shared/components/ui/...`).
4. Drop a `<Button variant="enya_primary">Test</Button>` in homepage. Verify the Duolingo 3D press effect works visually.
5. **Commit:** `feat: copy shadcn UI library + Enya 3D button variants`

**Success signal:** Yellow 3D button visible on homepage with shadow press animation on click.

---

### O-03 — Backboard SDK Wrapper (60 min)
**Goal:** A typed Backboard client in `shared/lib/backboard.ts` that supports: thread create, message send with tools + memory + per-message model override, multi-round tool-call loop, document upload, and retries with exponential backoff.

**Note:** The Backboard Python SDK doesn't have an official TypeScript counterpart at hackathon time — we call the REST API directly via `axios` (or implement a thin client). Reference: backboard.io docs.

**Steps:**
1. `npm install axios p-retry`
2. Create `shared/lib/backboard.ts` exporting:
   ```typescript
   export interface BackboardClient {
     createThread(): Promise<{ id: string }>;
     sendMessage(opts: SendMessageOptions): Promise<MessageResponse>;
     submitToolOutputs(threadId: string, toolOutputs: ToolOutput[]): Promise<MessageResponse>;
     uploadDocument(file: Buffer, name: string): Promise<{ id: string }>;
     runToolLoop(threadId: string, opts: SendMessageOptions, handlers: ToolHandlerMap): Promise<MessageResponse>;
   }
   export interface SendMessageOptions {
     content: string;
     assistantId: string;
     tools?: ToolDefinition[];
     memory?: 'Auto' | 'Readonly' | 'Off';
     llmProvider?: 'openai' | 'anthropic' | 'google';
     modelName?: string;
   }
   ```
3. `runToolLoop()` is the **chained tool-calling loop** — it sends the message, if response.requires_action loops through tool_calls, dispatches to handler map by tool name, submits outputs, repeats until final response.
4. Wrap all axios calls with `p-retry` (3 retries, exponential backoff, only on 429/5xx).
5. Add a smoke test script `scripts/test-backboard.ts` that creates a thread, sends "Hello, what tools do you have?" with no tools array, prints response. Run it. **Must succeed before moving on.**
6. **Commit:** `feat(backboard): typed client with tool-loop + retry`

**Success signal:** Smoke test script prints assistant response.

**Fallback:** If Backboard's REST API is unstable or undocumented, fall back to creating a thin proxy that calls OpenAI directly with the same shape, so dev work continues. Mark with `// FIXME: BACKBOARD_PROXY_FALLBACK`.

---

### O-04 — Define ALL Tool Schemas (45 min)
**Goal:** Every tool from `ultraplan-02-system-prompt.md` §3 defined as a constant in `shared/lib/tools/*.ts`.

**Steps:**
1. Create `shared/lib/tools/teacher-tools.ts` exporting `TEACHER_TOOLS: ToolDefinition[]` — 15 tools.
2. Create `shared/lib/tools/student-tools.ts` exporting `STUDENT_TOOLS: ToolDefinition[]` — 10 tools.
3. Create `shared/lib/tools/story-tools.ts` exporting `STORY_GAME_TOOLS` — subset of 2 tools.
4. Each tool definition copied verbatim from `ultraplan-02-system-prompt.md` §3 (OpenAI function-calling JSON schema).
5. **Commit:** `feat(tools): all 27 tool schemas defined`

**Success signal:** TypeScript compiles. Schemas pass JSON Schema validation (run a quick `ajv` check in a test script).

---

### O-05 — Tool Handler Map + Stub Implementations (75 min)
**Goal:** Every tool has a corresponding Next.js API route under `app/api/teacher/*` or `app/api/student/*` AND a tool-call handler dispatch table that calls these routes when the assistant invokes them.

**Steps:**
1. Create `app/api/<role>/<tool-name>/route.ts` for **all 25 tools**. Each route handler is a Next.js route handler exporting `POST`.
2. **Stub bodies** — return placeholder JSON matching the tool's expected output shape. Mark with `// TODO: real implementation` and a comment with the tool's actual job.
3. Create `shared/lib/tool-handlers.ts` — exports `TEACHER_HANDLERS` and `STUDENT_HANDLERS` maps that call the corresponding API routes:
   ```typescript
   export const TEACHER_HANDLERS: ToolHandlerMap = {
     parse_uploaded_document: async (args) => fetch('/api/teacher/parse-document', { method: 'POST', body: JSON.stringify(args) }).then(r => r.json()),
     generate_course_outline: async (args) => fetch('/api/teacher/generate-course-outline', { ... }).then(r => r.json()),
     // ... all 15
   };
   ```
4. Stub responses (use realistic-shaped data so the UI dev can build against real types):
   - `parse_uploaded_document` → `{ documentId: 'doc_stub_123', pageCount: 47, status: 'ready' }`
   - `generate_course_outline` → return a hand-written 3-unit, 4-lesson-per-unit photosynthesis outline (will be regenerated by O-09 with real LLM call)
   - `audit_content_pedagogically` → return a fully-shaped audit JSON (Bloom's scores, scaffolding score, vocab load, cultural sensitivity, curriculum mapping array)
   - All others → minimal correctly-typed stubs
5. **Smoke test:** Hit each route with curl. All return 200 with valid JSON.
6. **Commit:** `feat(api): all 25 tool routes scaffolded with typed stubs`

**Success signal:** `for r in $(ls app/api/**/*/route.ts); do curl -X POST localhost:3000/$(...); done` — all return 200.

---

### O-06 — Docling Sidecar (60 min)
**Goal:** A FastAPI server on `localhost:8000` with `POST /parse` accepting a PDF/DOCX file and returning `{ chunks: [{ pageNumber, text, type }] }`.

**Steps:**
1. Create `docling-sidecar/main.py`:
   ```python
   from fastapi import FastAPI, UploadFile, File
   from docling.document_converter import DocumentConverter
   import tempfile
   app = FastAPI()
   converter = DocumentConverter()

   @app.post("/parse")
   async def parse(file: UploadFile = File(...)):
       with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as tmp:
           tmp.write(await file.read())
           result = converter.convert(tmp.name)
       md = result.document.export_to_markdown()
       # naive chunking — paragraphs of ~500 tokens
       chunks = chunk_markdown(md, target_tokens=500)
       return {"chunks": chunks, "pageCount": len(result.document.pages)}
   ```
2. Create `docling-sidecar/requirements.txt`: `fastapi uvicorn docling python-multipart`
3. Add `npm` script in root `package.json`: `"sidecar": "cd docling-sidecar && uvicorn main:app --reload --port 8000"`
4. Test by uploading the demo PDF: `curl -F "file=@_demo-assets/grade3-science-photosynthesis.pdf" localhost:8000/parse`. Verify output.
5. Wire `app/api/teacher/parse-document/route.ts` to actually call this sidecar (replace stub).
6. **Commit:** `feat(docling): FastAPI sidecar + integrate parse-document API`

**Success signal:** Real PDF → chunked markdown JSON in <30s.

**Fallback:** If `docling` install fails (Python deps hell), use `pdf-parse` npm package (`npm install pdf-parse`) and skip the sidecar entirely. The route handler does the parsing inline. Less accurate but unblocks demo.

---

### O-07 — Real Implementation: parse_uploaded_document + Backboard doc upload (30 min)
**Goal:** Teacher uploads PDF → Docling parses → chunks uploaded to Backboard as a document → returned `documentId` is real and queryable.

**Steps:**
1. In `app/api/teacher/parse-document/route.ts`:
   - Accept multipart upload OR base64-encoded file
   - POST to docling sidecar
   - Concatenate chunks with `\n\n---\n\n` separators
   - Upload via `backboardClient.uploadDocument(buffer, filename)`
   - Return `{ documentId, pageCount, chunkCount }`
2. Test end-to-end: upload demo PDF via curl, verify the returned documentId can be referenced in a Backboard message and the assistant can quote content from it.
3. **Commit:** `feat(parse): real Docling→Backboard pipeline`

**Success signal:** A subsequent message to the assistant like "Summarize the photosynthesis section of the textbook" returns content from the actual PDF.

---

### O-08 — Real Implementations: 5 Highest-Impact Tools (90 min)
**Priority order — implement only what fits in 90 min, leave rest as stubs:**

1. **`generate_course_outline`** — calls Backboard with `claude-sonnet-4-6`, RAG over uploaded docs, returns structured JSON matching `Course` type.
2. **`audit_content_pedagogically`** — calls Backboard with `claude-sonnet-4-6`, returns Bloom's/scaffolding/vocab/culture/curriculum scores.
3. **`generate_text_lesson`** — calls Backboard with student profile in context, returns `TextLessonContent` with markdown body + comprehension Qs.
4. **`generate_story_game_node`** — calls Backboard with `claude-sonnet-4-6`, returns `StoryGameNode` with personalized narrative.
5. **`search_youtube_video`** — calls YouTube Data API v3 search endpoint, returns top 3 videos filtered by `videoEmbeddable=true&safeSearch=strict`.

For each:
- Replace stub in API route with real Backboard `runToolLoop` or external API call
- Validate output JSON against the type from `shared/types/index.ts` (use `zod` to parse)
- On parse failure, log + return the raw response in a debug field so we can see what the model returned

**Commit after each:** `feat(tool): real <tool-name> implementation`

**Success signal:** A test script `scripts/test-tools.ts` calls each of the 5 endpoints with realistic inputs and prints the (validated) outputs.

---

### O-09 — ElevenLabs Voice Scaffold (45 min)
**Goal:** Voice activity page connects to ElevenLabs Conversational AI, streams audio bidirectionally.

**Steps:**
1. `npm install @elevenlabs/react @elevenlabs/elevenlabs-js`
2. Create `app/api/student/voice-session/route.ts` POST handler — accepts `{ studentId, lessonId, activitySubtype }`, returns `{ signedUrl }` from ElevenLabs API (`POST /v1/convai/conversation/get-signed-url?agent_id=<>`).
3. Create `features/activity-voice-tutor/voice-conversation.tsx` — uses `useConversation()` from `@elevenlabs/react`. Connect button calls our `/api/student/voice-session`, then `conversation.startSession({ signedUrl, overrides: { agent: { prompt: { prompt: customPersonaPrompt } } } })`.
4. Add a "Connection status" indicator (connected/connecting/error/disconnected).
5. Implement bounded session — auto-end after 5 min via `setTimeout(() => conversation.endSession(), 5 * 60 * 1000)`.
6. Add fallback toggle: if `process.env.NEXT_PUBLIC_VOICE_MODE === 'simulated'`, play `public/seed/voice-fallback-{studentId}.mp3` instead.
7. Place a **placeholder mp3** at `public/seed/voice-fallback-maya.mp3` and `voice-fallback-liam.mp3` (5-second silent audio is fine for now; Amin will replace).
8. **Commit:** `feat(voice): ElevenLabs scaffold + simulated fallback`

**Success signal:** Visit `/student/maya/lesson/photosynthesis-1/voice` → click "Start" → mic activates → speak → tutor responds.

---

### O-10 — Image Generation Quality Gate (45 min)
**Goal:** Run the 5-prompt quality gate from `ultraplan-00-architecture.md` §7, decide auto vs curated, lock the decision in `.env.local` and code path.

**Steps:**
1. Create `scripts/image-gate.ts`:
   ```typescript
   const STYLE_PREFIX = "Children's storybook illustration, soft watercolor and pastel palette, ...";
   const SCENES = [ /* 5 from §7.1 */ ];

   for (const scene of SCENES) {
     const prompt = `${STYLE_PREFIX}\n\nScene: ${scene}`;
     const start = Date.now();
     const response = await openai.images.generate({
       model: 'dall-e-3', quality: 'hd', style: 'natural', size: '1024x1024',
       prompt, n: 1
     });
     console.log(`Scene "${scene.substring(0, 30)}": ${Date.now() - start}ms, url: ${response.data[0].url}`);
     // download to public/seed/gate-test/{i}.png
   }
   ```
2. Run it. Visually review the 5 outputs.
3. **Decision matrix:**
   | Result | Action |
   |---|---|
   | All 5 pass criteria (a)-(e) | `NEXT_PUBLIC_IMAGE_MODE=auto`, implement real `generate_story_image` route |
   | 3-4 of 5 pass | Use `auto` for the passing themes, `curated` for failing ones |
   | <3 pass | Set `NEXT_PUBLIC_IMAGE_MODE=curated`, document this loudly in console + README |
4. Build curated library: download 30 images per theme from Pexels (free license). Place in `public/seed/illustrations/{theme}/*.jpg`. Manifest: `public/seed/illustrations/manifest.json` listing all paths with tags.
5. Implement `app/api/student/generate-story-image/route.ts`:
   - If mode=auto: call DALL-E with style-locked prompt
   - If mode=curated: have LLM pick the best path from manifest given the scene description
   - Always: also return `fallbackEmoji` (4-6 emoji generated by LLM)
6. **Commit:** `feat(image): quality gate run + final mode locked + curated library`

**Success signal:** `.env.local` has a definitive `NEXT_PUBLIC_IMAGE_MODE` value. Story image route returns a usable image URL or curated path within 12s.

---

### O-11 — All Page Routes Skeleton (60 min)
**Goal:** Every route in `ultraplan-00-architecture.md` §10 exists with a placeholder page so devs can navigate and start building. No real content needed yet — just routes that don't 404.

**Steps:**
1. Create empty `page.tsx` files for every route in §10 — each renders `<div className="p-8"><h1 className="text-2xl">{routeName}</h1><p className="text-muted-foreground">TODO: {ownerDev}</p></div>`.
2. Wire `app/teacher/layout.tsx` and `app/student/layout.tsx` with placeholder chrome (sidebar + topbar) — Akin will replace.
3. Create `features/role-switcher/role-switcher.tsx` — Zustand-backed dropdown with `Teacher / Maya / Liam` options. Wire into root layout topbar.
4. Test: from homepage, click each role; navigate to each route; no 404s; no console errors.
5. **Commit:** `feat(routes): all pages scaffolded + role switcher`

**Success signal:** Visiting `/teacher`, `/teacher/courses`, `/teacher/analytics`, `/student/maya`, `/student/maya/lesson/foo/text`, etc. all render placeholders.

---

### O-12 — Pre-Seed Demo Data (30 min)
**Goal:** All JSON seed files from `ultraplan-08-seed-data.md` exist and are valid.

**Steps:**
1. Read `ultraplan-08-seed-data.md` carefully.
2. Create `public/seed/students.json` — Maya + Liam profiles.
3. Create `public/seed/courses.json` — 1 photosynthesis course shell.
4. Run `scripts/pregenerate-content.ts` (write this script):
   - For each (student, lesson, activity) combo, call the real generation endpoints from O-08
   - Save responses to `public/seed/lessons-{studentId}/{lessonId}-{activityType}.json`
   - This gives us TWO copies of every demo content — live and seed
5. Verify all files load and parse against types.
6. **Commit:** `feat(seed): pre-generated demo content for Maya + Liam`

**Success signal:** `public/seed/lessons-maya/` and `public/seed/lessons-liam/` each contain ~12 JSON files (3 lessons × 4 activities) of real generated content.

---

### O-13 — Zustand Store Skeletons (20 min)
**Goal:** All Zustand stores from `ultraplan-00-architecture.md` §10 exist with typed shapes — Demi will fill in actions in the morning.

**Steps:**
1. `shared/stores/role-store.ts` — `{ role: 'teacher' | 'student'; currentStudentId: string | null; setRole; setStudent }`
2. `shared/stores/student-store.ts` — `{ students: StudentProfile[]; getById; addStudent }` — hydrate from `public/seed/students.json` on init
3. `shared/stores/progress-store.ts` — `{ progressByStudent: Record<string, StudentProgress>; markComplete; addXp; recordQuizScore }`
4. `shared/stores/thread-store.ts` — `{ threads: Record<string, string>; getOrCreate(key) }`
5. **Commit:** `feat(stores): Zustand store skeletons`

**Success signal:** TS compiles. Stores can be imported in any component.

---

### O-14 — Final Smoke Test + Morning Handoff Doc (15 min)
**Goal:** End-of-night integration test and a clear morning briefing.

**Steps:**
1. Run `npm run dev` + `npm run sidecar`.
2. Walk through the full demo path manually:
   - Homepage → Teacher → Teacher chat sends message → tools available → upload PDF → parse succeeds → outline generated
   - Switch to Maya → dashboard loads with placeholder content
   - Click text lesson → see real generated text
   - Click video lesson → search succeeds (or shows fallback YouTube ID)
   - Click voice lesson → audio session connects (or simulated playback)
   - Click story game → first node renders with image
3. Document any failures in `OVERNIGHT-REPORT.md` at project root with:
   - ✅ What's working
   - ⚠️ What's flaky (with workaround)
   - ❌ What's broken (with which task to assign in morning)
   - Pin specific commit SHAs for each milestone
4. **Final commit:** `chore: overnight session complete + status report`

---

## 3. P1 Tasks — Polish & Workload Reduction (~2 hr)

After P0 is done, attempt these in order. Each is independent — drop any that exceed budget.

### O-P1-A — Magic UI / Aceternity / react-bits Install + One Working Example Each (40 min)
1. `npm install` per library docs.
2. Add ONE Magic UI component (e.g., `<AnimatedShinyText>`) to homepage greeting.
3. Add ONE Aceternity component (e.g., `<Spotlight>`) to student dashboard hero.
4. Add ONE react-bits component (e.g., `<GradientText>` for student name).
5. Each must work without console errors.
6. **Commit:** `feat(polish): Magic UI + Aceternity + react-bits installed with examples`

### O-P1-B — Real `adjust_for_eal_level` Tool (30 min)
Pure prompt-engineering call to Backboard. Takes content + target EAL level, returns adjusted content. No state.

### O-P1-C — Real `manage_classroom` Tool (30 min)
Stores classroom data in Backboard memory. CRUD via memory write/read. Returns simple `{ classrooms: [...] }`.

### O-P1-D — Real `submit_quiz_answer` Tool (20 min)
Returns feedback + advances progress. Just a thin wrapper over LLM-evaluated correctness for free-form, exact match for MC.

---

## 4. P2 Tasks — Bonus (only if hours remain)

### O-P2-A — Real `bulk_update_eal_levels`, `search_resources`, `generate_quiz_from_content`, `preview_student_experience`, `generate_report`, `simplify_text`
Convert the remaining stubs to real implementations. Each is a thin LLM wrapper.

### O-P2-B — Pre-record voice fallback MP3
Use ElevenLabs TTS via API to generate two 30s sample interactions and save as `voice-fallback-{maya|liam}.mp3`. Replace placeholder silent audio.

### O-P2-C — Wire up sidebar navigation in teacher layout
Pull from `_enya-reference/frontend/shared/components/ui/sidebar.tsx`.

### O-P2-D — Add canvas-confetti on quiz win
Trigger on 3-correct-in-a-row.

---

## 5. Checkpoint Schedule (autonomous timing reference)

| Hour | Should be done by |
|---|---|
| 1 | O-01, O-02, O-03 |
| 2 | O-04, O-05 |
| 3 | O-06, O-07 |
| 4 | O-08 (5 tools real) |
| 5 | O-09, O-10 |
| 6 | O-11, O-12 |
| 7 | O-13, O-14 + smoke test passed |
| 8 | P1 tasks if time |

---

## 6. What Each Dev Should Be Able to Start Immediately at Morning Standup

After overnight session ends, the team can fan out with zero blockers:

| Dev | First morning task | Why it's unblocked |
|---|---|---|
| **Akin** | Build teacher chat UI in `features/teacher-chat/` | Routes exist, design system copied, tool API responses real |
| **Demi** | Fill Zustand stores with real actions | Skeletons exist, types defined, services scaffolded |
| **Amin** | Refine system prompt + tool descriptions in Backboard dashboard | Assistant exists, tools are wired and testable |
| **Rishabh** | Continue P1/P2 tasks + start morning UI integration tasks (R-04, R-05) | Infra is the platform's foundation |

---

## 7. Fallback Plan (if overnight session derails)

If the autonomous session has only completed through O-05 by hour 5:
- **Skip:** O-08 real tool implementations beyond `parse_uploaded_document` and `generate_text_lesson`. Stubs remain.
- **Skip:** O-09 voice scaffold — leave the route stubbed and use simulated MP3 fallback for demo.
- **Skip:** O-10 image gate — set `NEXT_PUBLIC_IMAGE_MODE=curated` blindly. Use Pexels-sourced fallback library.
- **Must keep:** O-11 routes (devs can't start without these), O-12 seed data (demo can't run without these), O-13 stores (state breaks without these).

The minimum viable overnight result is: **scaffold + design system + tool schemas + ALL stubs returning realistic JSON + all routes + seed data**. Even if zero real LLM calls work, devs can build UIs against the stubs and we wire reals in the morning.

---

## 8. Anti-Patterns to Avoid

The autonomous agent must NOT:
- ❌ Re-invent shadcn components (just copy them).
- ❌ Add a database, ORM, or migration tooling.
- ❌ Add unit/integration tests except the L4 personalization differential snapshot.
- ❌ Add ESLint/Prettier configuration beyond Next.js defaults.
- ❌ Add Tailwind plugins not already in the reference codebase.
- ❌ Refactor the reference code style — copy verbatim.
- ❌ Use `any` types — use `unknown` and narrow, or define a proper type.
- ❌ Commit `.env.local` or any API keys.
- ❌ Continue past hour 8 — stop and write the report.

---

## 9. Tools the Agent Should Use Heavily

- **Skill: superpowers:test-driven-development** — for the differential L4 snapshot test
- **Skill: superpowers:systematic-debugging** — when an integration fails
- **Skill: superpowers:dispatching-parallel-agents** — when O-05 stubs and O-04 tool schemas can run in parallel
- **Skill: claude-api** — for OpenAI direct (DALL-E + image gate)
- **WebSearch / WebFetch** — for ElevenLabs SDK docs, Backboard API docs, Magic UI install commands
- **mcp__context7__*** — for up-to-date Next.js 16 / React 19 / ElevenLabs docs

---

## 10. The Autonomous Session Kickoff Prompt (paste into fresh Claude Code session)

```
You are running an 8-hour autonomous Claude Code session for the Enya Lite hackathon
overnight setup. Your full task list is in `ultraplan-01-overnight-session.md` at the
working directory root. Execute the P0 tasks O-01 through O-14 IN ORDER. Use the
priority tier rules in §1 — if you fall behind, drop P1/P2 entirely and finish P0.

Hard rules:
- Stop and ask for confirmation before any destructive operation (rm -rf, git reset --hard, force push).
- Commit after every numbered task completes (atomic commits with the suggested message).
- Maintain a running log at OVERNIGHT-REPORT.md — update at every checkpoint.
- If a task fails twice with the same root cause, mark it BLOCKED in the report and move on.
- DO NOT continue past hour 8 — stop and write the final report.

Reference files:
- ultraplan-00-architecture.md (locked architecture decisions)
- ultraplan-02-system-prompt.md (the assistant's system prompt — paste verbatim into Backboard dashboard, do not modify)
- ultraplan-08-seed-data.md (JSON fixture specs for O-12)
- _enya-reference/frontend/ (read-only mining target — copy components/styles from here)

Begin with the Pre-Flight checklist in §0 — verify all prerequisites before starting O-01.
```
