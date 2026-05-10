# Ultraplan 04 — Akin's Tasks (Frontend)

> **Role:** UI/UX implementation. Owner of layouts, pages, components, responsiveness, visual polish.
> **You DO:** every page, every component, every animation, every theme.
> **You DON'T:** Backboard SDK, API route logic, system prompt, business state machines (Demi handles state, Rishabh handles APIs).

---

## Reading Order
1. `ultraplan-00-architecture.md` — particularly §8 (Design System) and §9 (Student Theming)
2. This file
3. Your assigned components below
4. `ultraplan-07-demo-script.md` — to understand visual flow

---

## Pre-flight: Verify Overnight Output Before Starting (5 min, t=0:00)

1. `cd "/Users/rishabhverma/Desktop/Althra Hackathon/Enya Lite" && npm run dev`.
2. Visit `localhost:3000`. Hit a few routes.
3. Confirm `shared/components/ui/` has 36 components (`ls shared/components/ui | wc -l`).
4. Confirm Inter font is loaded (check homepage `<html>` className contains `--font-inter`).
5. Confirm a `<Button variant="enya_primary">test</Button>` somewhere shows the 3D press effect.

**If any fail, ping Rishabh.** Otherwise proceed.

---

## Task A-01 — Root Layout + Role Switcher Polish (30 min, t=0:30–1:00)

**Objective:** Polish the root layout so the role switcher is the demo presenter's primary control. Big, obvious, instant.

**Files to modify:**
- `app/layout.tsx` (already scaffolded)
- `features/role-switcher/role-switcher.tsx` (already scaffolded)
- `features/role-switcher/role-pill.tsx` (NEW)

**Implementation spec:**
1. Top bar (`<header>`): height 64px, full-width, sticky, z-50, `bg-background/95 backdrop-blur` for that glassmorphism feel, `border-b`.
2. Layout: left = Enya logo (use lucide `Sparkles` icon + "Enya" text in `font-bold text-xl`), center = nothing, right = `<RoleSwitcher>`.
3. RoleSwitcher renders 3 pill buttons: `[Teacher]` `[Maya]` `[Liam]`. Active pill = `enya_primary` variant. Inactive = `enya_neutral`.
4. Each pill has: avatar (small, 24px), name, hover scale-105 (with motion).
5. Click → updates `useRoleStore`, navigates to `/teacher` or `/student/{id}` accordingly.
6. **Polish touch:** When switching, fade out the page content, fade back in with the new role. Use `<AnimatePresence mode="wait">` wrapping `{children}` in layout.

**Reusable code:**
- COPY/ADAPT: `_enya-reference/frontend/shared/components/ui/dropdown-menu.tsx` is overkill — pills are simpler. Use plain buttons.
- Avatars: pull from `public/seed/students.json` `avatarUrl`.

**Acceptance criteria:**
- 3 pills visible top-right. Clicking switches roles in <500ms with smooth fade.
- Active state visually unambiguous.
- No layout shift between role changes.

**Demo criticality:** Must Have

---

## Task A-02 — Teacher Layout Chrome (30 min, t=1:00–1:30)

**Objective:** Teacher pages share a consistent shell with sidebar nav.

**Files to modify:**
- `app/teacher/layout.tsx`
- `features/teacher-shell/sidebar-nav.tsx` (NEW)

**Implementation spec:**
1. Two-column layout: left sidebar (260px wide, `bg-sidebar text-sidebar-foreground border-r`), right main (`flex-1 overflow-auto`).
2. Sidebar items (top-down):
   - Section: "TEACH" → Chat, Courses, Resources
   - Section: "MANAGE" → Students, Classrooms, Analytics
   - Section: "SETTINGS" → Profile (placeholder)
3. Each item: lucide icon + label. Active state: `bg-sidebar-accent text-sidebar-accent-foreground rounded-md`.
4. Use `next/link` with `usePathname()` for active detection.
5. **No collapsible sidebar for hackathon — fixed open at 260px.**

**Reusable code:**
- ADAPT: `_enya-reference/frontend/shared/components/ui/sidebar.tsx` — strip down to bare essentials.

**Acceptance criteria:** Sidebar visible on every `/teacher/*` route. Clicking each item navigates correctly.

**Demo criticality:** Must Have

---

## Task A-03 — Student Layout Chrome + Themed Container (45 min, t=1:30–2:15)

**Objective:** Student pages use a personalized theme container that swaps CSS vars based on `studentId` in the URL.

**Files to modify:**
- `app/student/layout.tsx`
- `features/student-shell/themed-container.tsx` (NEW)
- `app/globals.css` (add per-student theme blocks)

**Implementation spec:**
1. `app/student/[studentId]/layout.tsx` reads `params.studentId`, looks up `StudentProfile` via `useStudentStore`.
2. Wraps children in `<ThemedContainer studentId={id}>`:
   ```tsx
   <div data-student={id} className="min-h-screen relative">
     <div className="absolute inset-0 -z-10 opacity-40 bg-[image:var(--student-bg-pattern)] bg-repeat" />
     <div className="relative z-0">{children}</div>
   </div>
   ```
3. Add to `app/globals.css`:
   ```css
   [data-student="maya"] {
     --student-primary: oklch(0.78 0.15 340);
     --student-accent: oklch(0.85 0.18 50);
     --student-bg-pattern: url('/seed/themes/butterflies-pattern.svg');
     --student-greeting-font: 'Caveat', cursive;
   }
   [data-student="liam"] {
     --student-primary: oklch(0.55 0.22 260);
     --student-accent: oklch(0.75 0.18 195);
     --student-bg-pattern: url('/seed/themes/starfield-pattern.svg');
     --student-greeting-font: 'Orbitron', sans-serif;
   }
   ```
4. Load Caveat + Orbitron from Google Fonts in `app/layout.tsx` (next/font/google) — minimal weight set (only what's used).
5. Top nav stays the same role switcher; the main content area gets themed.
6. The hero section component (next task) uses these CSS vars for accents.

**Acceptance criteria:**
- Switching from Maya to Liam visibly changes the background pattern.
- The greeting font changes.
- Pattern is subtle (40% opacity), not overwhelming.

**Demo criticality:** Must Have (this is the visual personalization payoff)

---

## Task A-04 — Student Dashboard Page (90 min, t=2:15–3:45)

**Objective:** The "wow" page. Personalized hero, today's lesson card, XP/streak quick stats, course progress, recommended-next card.

**Files to modify:**
- `app/student/[studentId]/page.tsx`
- `features/student-dashboard/student-greeting.tsx` (NEW — Rishabh wires data)
- `features/student-dashboard/todays-lesson-card.tsx` (NEW)
- `features/student-dashboard/quick-stats-row.tsx` (NEW)
- `features/student-dashboard/course-progress-card.tsx` (NEW)
- `features/student-dashboard/dashboard-hero.tsx` (NEW)

**Implementation spec:**

**Page layout (vertical sections):**
1. **Hero** (full-width, 320px tall): AI-generated background image OR pattern fallback. On top, padded:
   - Personalized greeting: "Good morning, {studentName}! Ready for today's adventure?" — use `<ShinyText>` (react-bits) on the greeting; `<GradientText>` on the name.
   - Subtitle: "{interest-themed motivational nudge}"
   - Use Aceternity `<Spotlight>` overlay for visual flair.
2. **Quick Stats Row** (4 cards, equal width, 110px tall):
   - XP card with rocket icon (Liam) / butterfly icon (Maya), big number, "Total XP"
   - Streak card with flame, days count, "Day streak"
   - Skills card: count of mastered skills
   - Time card: minutes learned this week
3. **Today's Lesson Card** (large, 240px tall): occupies full width minus padding.
   - Course title
   - Lesson name
   - 4 mini activity dots (Read • Watch • Speak • Apply) showing completion
   - Big "Continue Learning" enya_primary button → routes to next incomplete activity
4. **Course Progress Card** (split into 2 columns): on left, course title + overall % bar (motion animated); on right, list of units with mini check-marks.
5. **Recommended Section** (3 cards in a row): "Try this next" — interest-themed mini-courses (use seed data).

**Component details:**

`<DashboardHero />`:
```tsx
<div className="relative h-[320px] rounded-3xl overflow-hidden border-2"
     style={{ backgroundImage: `url(${theme.heroImageUrl ?? ''})`, backgroundSize: 'cover' }}>
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
  <Spotlight className="absolute -top-40 left-0" fill={theme.accentColor} />
  <div className="relative z-10 flex flex-col h-full justify-end p-8 text-white">
    <ShinyText className="text-3xl lg:text-5xl font-bold">{greeting}</ShinyText>
    <p className="text-lg mt-2 opacity-90">{nudge}</p>
  </div>
</div>
```

`<QuickStatsRow />`: 4 `<Card>`s side-by-side with motion stagger entrance.

`<TodaysLessonCard />`: rounded-3xl, prominent CTA, uses `enya_primary` button with shine animation on hover.

**Reusable code:**
- ADAPT (don't copy directly — too much existing baggage):
  - `_enya-reference/.../student-dashboard/components/student-dashboard-banner.tsx` — for hero pattern
  - `_enya-reference/.../student-dashboard/components/student-dashboard-quick-stats.tsx` — quick stats layout
  - `_enya-reference/.../student-dashboard/components/student-course-card.tsx` — course card pattern
- INSTALL: Aceternity Spotlight component (copy from aceternity.com/components/spotlight)
- INSTALL: react-bits ShinyText, GradientText

**Acceptance criteria:**
- Maya's dashboard: pink hero, butterfly icons, AI watercolor garden bg, "Hi Maya! 🦋 Ready..." in Caveat-ish font.
- Liam's dashboard: blue hero, rocket icons, AI cosmic bg, "Hey Liam! 🚀 Ready..." in Orbitron-ish font.
- All sections visible without scrolling on 1440x900 monitor.
- Continue Learning button navigates to next incomplete activity.

**Demo criticality:** Must Have

---

## Task A-05 — Teacher Chat Page (90 min, t=3:45–5:15)

**Objective:** Conversational AI chat interface — the central teacher tool.

**Files to modify:**
- `app/teacher/page.tsx`
- `features/teacher-chat/teacher-chat.tsx` (Akin builds layout/UI; Rishabh wires data)
- `features/teacher-chat/message-bubble.tsx` (NEW)
- `features/teacher-chat/message-input.tsx` (NEW)
- `features/teacher-chat/file-upload-zone.tsx` (NEW)
- `features/teacher-chat/tool-result-cards/*.tsx` (NEW — 5 cards)

**Implementation spec:**

**Layout:**
- Two-column: left = chat (flex-1), right = "Active context" sidebar (320px, optional, collapsed by default).
- Chat: vertical scroll, messages from top, input pinned to bottom.
- Input area: textarea (auto-grow, max 6 rows), file upload button, send button. Width 100% with max-w-3xl mx-auto.

**Message bubbles:**
- User: right-aligned, `bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%]`
- Assistant: left-aligned, `bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[70%]`
- Tool result inline: a Card below the assistant message, full width, with the tool's purpose-built component
- Loading: animated dots (3 dots fading in sequence, motion)

**Tool Result Cards (build all 5):**

1. **`<UploadStatusCard>`** — shows during/after parse_uploaded_document
   - `parsing`: progress bar + "Parsing your textbook..." + estimated 30-60s
   - `ready`: green check + "Parsed! 47 pages, 142 chunks indexed" + button "Use this for course generation"
   - `failed`: red X + error + "Try again" button

2. **`<CourseOutlinePreview>`** — shows the generated course
   - Header: course title + grade + standard badge
   - Tree of units → lessons (use `<Accordion>` from shadcn)
   - Each lesson shows the 4 activity icons inline
   - Bottom: "Approve" (`enya_success`) + "Edit" (`enya_neutral`) buttons

3. **`<PedagogicalAuditCard>`** — shows audit results
   - 5 score cards in a row (Bloom's, Scaffolding, Vocab, Cultural, Curriculum) — each with score (0-100), color-coded ring (green ≥80, amber 60-79, red <60), 1-line comment
   - Below: "Recommendations" section — 3-5 prioritized items, each with priority badge + description + suggested action
   - All scrollable vertically

4. **`<StudentProfileCard>`** — shows after create_student_profile
   - Avatar (auto-generated initial-based or AI-illustrated TBD)
   - Name, grade, EAL badge
   - Interest pills
   - Cultural background as small italic text
   - "View as student" link button

5. **`<AnalyticsSummaryCard>`** — shows after get_student_analytics
   - Top: 3 KPIs (avg quiz score, time spent, EAL trend ↑/↓)
   - Middle: skill mastery radar chart (recharts)
   - Bottom: 1-2 narrative insights (from the assistant, plain text)

6. **`<ToolResultJson>`** — fallback for tools without bespoke cards. Pretty-print JSON with `react-json-view-lite`.

**Input area:**
- File upload: `react-dropzone` zone OR an icon button next to send. On file select, upload immediately via `chat.uploadFile(file)`, show a chip "[textbook.pdf]" above the input. Multiple files allowed.
- Textarea: `<Textarea>` from shadcn. Submit on Enter (Shift+Enter for newline).
- Send: `enya_primary` button with paper-plane icon.

**Empty state (first load):**
- Big friendly Enya logo
- "Hi! I'm Enya. What can I help you with today?"
- 4 suggestion chips: "Create a new course" / "Audit my materials" / "Set up a classroom" / "Review student progress" — clicking sends that message.

**Reusable code:**
- ADAPT: `_enya-reference/frontend/features/educator-dashboard/components/document-uploader.tsx` for upload zone

**Acceptance criteria:**
- Empty state shows on `/teacher` first visit.
- Clicking a suggestion chip auto-sends.
- Typing → enter → message appears.
- Uploading PDF → chip appears → send → UploadStatusCard renders inline.
- After course-generation flow, CourseOutlinePreview renders with the actual outline (Rishabh provides the data via R-04).
- Audit flow: PedagogicalAuditCard renders.

**Demo criticality:** Must Have

---

## Task A-06 — Text Lesson Page UI (60 min, t=5:15–6:15)

**Objective:** Beautiful text lesson reader with embedded diagrams + interactive comprehension Qs.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/text/page.tsx`
- `features/activity-text-lesson/text-lesson.tsx`
- `features/activity-text-lesson/markdown-renderer.tsx` (NEW)
- `features/activity-text-lesson/diagram-card.tsx` (NEW)
- `features/activity-text-lesson/comprehension-section.tsx` (NEW)
- `features/activity-text-lesson/quiz-question.tsx` (NEW — shared with story game)

**Implementation spec:**

**Page layout:**
- Activity nav at top (4 chips, Read/Watch/Speak/Apply, current is highlighted, others link to other activities for this lesson)
- Reading area: max-w-3xl mx-auto, generous padding (px-6 py-8), 18px base font for younger / readable line-height
- Title: text-3xl lg:text-4xl font-bold, themed accent color
- Body: rendered markdown — h2 = section header (text-2xl mt-8), p = body (leading-relaxed), strong = highlighted in `--student-accent` color
- Diagrams interspersed: rendered as cards with the emoji art big and centered, caption below
- Bottom: comprehension section — 3 questions, vertical stack

**`<MarkdownRenderer />`:**
Use `react-markdown` + `remark-gfm`. Custom components mapping:
- `h2` → `<h2 className="text-2xl font-bold mt-8 mb-3" style={{ color: 'var(--student-primary)' }}>`
- `p` → `<p className="my-4 text-base leading-relaxed">`
- `strong` → `<strong style={{ color: 'var(--student-accent)' }}>`
- `code` → `<code className="bg-muted rounded px-1.5 py-0.5 text-sm">`
- `ul` → `<ul className="my-4 ml-6 list-disc space-y-1">`

**`<DiagramCard />`:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  className="my-8 mx-auto max-w-md p-6 rounded-3xl border-2 bg-card"
>
  <div className="text-4xl text-center tracking-wider whitespace-nowrap overflow-x-auto">{diagram.emojiArt}</div>
  <p className="text-center text-sm text-muted-foreground mt-3">{diagram.caption}</p>
</motion.div>
```

**`<QuizQuestion />`** (shared component, used in text lesson + onboarding):
- Question text: text-lg font-semibold
- For multiple-choice: 2x2 grid (or stacked on mobile) of `<OptionCard>` — adapt from `_enya-reference/.../onboarding/components/student/option-card.tsx`
- For true/false: 2 big buttons side by side
- For fill-blank: `<Input>` field
- After answer: feedback box appears below — green bg if correct, amber if wrong (NOT red — too punitive for kids), with `explanation` text
- "Next question" button to advance; or "Finish lesson" if last

**Reusable code:**
- ADAPT: `option-card.tsx` from `_enya-reference/.../onboarding/components/student/`
- ADAPT: `_enya-reference/.../student-course-view/components/quiz-modal.tsx` (for transitions/animations)

**Acceptance criteria:**
- Maya's text lesson: butterfly-themed body, emoji diagrams, A1 vocab visible. Pink accents on bold/headers.
- Liam's text lesson: space-themed body, B1 vocab. Blue accents.
- All 3 questions interactive; correct shows green; wrong shows amber + explanation.
- Activity completion triggers progress update (Demi handles).

**Demo criticality:** Must Have

---

## Task A-07 — Video Lesson Page UI (60 min, t=6:15–7:15)

**Objective:** Centered YouTube player + overlay quiz dialog when paused.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/video/page.tsx`
- `features/activity-video-lesson/video-lesson.tsx`
- `features/activity-video-lesson/overlay-question.tsx` (NEW)

**Implementation spec:**
1. Same activity nav at top.
2. Video container: aspect-video, max-w-4xl mx-auto, rounded-2xl overflow-hidden border-2 shadow-lg.
3. Below player: "Lesson notes" panel — collapsible, shows lesson learning objectives.
4. Pause indicator overlay: when player is paused awaiting answer, dim the video with `bg-black/40` overlay + show `<OverlayQuestion>` modal.

**`<OverlayQuestion />`:**
- Use shadcn `<Dialog>` with custom trigger (controlled).
- `DialogContent`: max-w-lg, the question text (text-xl font-semibold), 2-4 option cards (large, full-width).
- On answer → wait 1s with feedback visible → close dialog → resume video (Rishabh handles the resume).
- "Skip" button at bottom-right (small, ghost variant) — for demo backup.

**Reusable code:**
- COPY/ADAPT: `_enya-reference/.../student-course-view/components/youtube-player.tsx` (Rishabh handles wiring; Akin styles the container)

**Acceptance criteria:**
- Player loads inline, plays.
- At pause moments, overlay appears smoothly (motion fade).
- Answering closes overlay; video resumes.
- Layout doesn't shift between play/pause states.

**Demo criticality:** Must Have

---

## Task A-08 — Voice Activity Page UI (60 min, t=7:15–8:15)

**Objective:** Pre-session splash + active conversation UI + post-session summary.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/voice/page.tsx`
- `features/activity-voice-tutor/voice-splash.tsx` (NEW)
- `features/activity-voice-tutor/voice-active.tsx` (NEW)
- `features/activity-voice-tutor/voice-summary.tsx` (NEW)
- `features/activity-voice-tutor/mic-orb.tsx` (NEW — animated mic indicator)

**Implementation spec:**

**State machine UI** (driven by `voiceState` from Rishabh's hook):
- `idle` → `<VoiceSplash />`: big mic icon, activity description, expected duration, "Start Conversation" `enya_primary` button.
- `connecting` → spinner + "Connecting to your tutor..."
- `listening` / `speaking` → `<VoiceActive />`
- `ended` → `<VoiceSummary />`: "Great job!" + 1 thing the tutor noted + XP earned + "Continue" button to next activity.

**`<MicOrb />`** (the centerpiece of the active state):
- 200x200 px circle, centered.
- When `listening`: pulses with student's voice (use Web Audio API analyzer node — get amplitude, scale orb 1.0-1.15 with motion).
- When `speaking`: solid pulse pattern (no mic input, just tutor TTS playing) — use a constant sine animation on scale.
- Color: `var(--student-primary)` glow.
- Inside: lucide `Mic` icon (32px) when listening, lucide `Volume2` when speaking.

**`<VoiceActive />` layout:**
- Center: MicOrb
- Left rail (collapsible): live transcript scroll — alternating user/tutor messages (last 5 visible)
- Top right: timer "MM:SS" remaining (countdown from 5 min)
- Bottom: "End conversation" `enya_neutral` button

**`<VoiceSplash />`:**
```tsx
<div className="max-w-2xl mx-auto p-8 text-center">
  <div className="w-24 h-24 mx-auto rounded-full bg-[var(--student-primary)] flex items-center justify-center">
    <Mic className="w-10 h-10 text-white" />
  </div>
  <h1 className="text-3xl font-bold mt-6">Voice Practice: {activitySubtypeLabel}</h1>
  <p className="mt-3 text-muted-foreground">{description}</p>
  <ul className="mt-6 space-y-2 text-sm text-muted-foreground inline-block text-left">
    <li>⏱️ ~5 minutes</li>
    <li>🎙️ I'll listen and respond — speak naturally</li>
    <li>👂 You can end the conversation anytime</li>
  </ul>
  <Button variant="enya_primary" size="lg" className="mt-8" onClick={onStart}>Start Conversation</Button>
</div>
```

**Acceptance criteria:**
- Splash visible on first visit; clear CTA.
- Active state: mic orb pulses with voice.
- Transcript scrolls.
- Timer counts down.
- Summary appears at end with positive framing.

**Demo criticality:** Must Have

---

## Task A-09 — Story Game Page UI (90 min, t=8:15–9:45 — but only 7-hour total so this overlaps)

**REVISED SCHEDULE** — given 7-hour budget, Akin tasks A-06/07/08/09 will be tight. Drop A-08 polish and ship voice-splash-only if needed; A-09 is critical.

**Objective:** Branching story interface that feels like a kid's book + game hybrid.

**Files to modify:**
- `app/student/[studentId]/lesson/[lessonId]/story/page.tsx`
- `features/activity-story-game/story-game.tsx`
- `features/activity-story-game/story-node-view.tsx`
- `features/activity-story-game/story-choice-button.tsx`
- `features/activity-story-game/teaching-moment-modal.tsx` (NEW)
- `features/activity-story-game/story-completion.tsx` (NEW)

**Implementation spec:**

**Layout per node:**
- Top: `<StoryNodeView>`:
  - Illustration (max-w-2xl, rounded-3xl border-2, aspect-[4/3] object-cover)
  - If image fails → `<EmojiSceneCard>` (big emoji art card)
  - Below image: narrative text in serif font (`font-serif italic` looks story-like), text-lg lg:text-xl, leading-loose, max-w-2xl
- Bottom: choices stacked vertically, full-width, max-w-2xl mx-auto, `enya_secondary` variant, `text-base whitespace-normal h-auto py-4` (allow multi-line choices)

**Choice interaction:**
- On click correct: button shimmers green via motion → 600ms delay → fade out current node → fade in next node
- On click wrong: button shakes (motion `x: [0, -8, 8, -8, 8, 0]`) → after 200ms, open `<TeachingMomentModal>`

**`<TeachingMomentModal />`:**
- Soft amber background (NOT red)
- Cute character/emoji at top (`🦉` for Maya — wise butterfly; `🤖` for Liam — robot guide)
- "Hmm, let's think about this differently..."
- The `feedbackOnSelect` text
- "Try again" button (enya_primary) — closes modal, returns to same node (with that wrong choice now disabled visually)

**`<StoryCompletion />`:**
- Confetti burst (`canvas-confetti` package)
- Big "🎉 You completed [adventure name]!"
- XP earned, skill unlocked
- Recap: 3 things the student learned (from learning objectives)
- "Continue learning" button → next lesson or back to dashboard

**Image fallback handling:**
```tsx
{node.illustrationUrl ? (
  <img
    src={node.illustrationUrl}
    onError={(e) => {
      e.currentTarget.style.display = 'none';
      // Show emoji fallback
    }}
    alt=""
    className="..."
  />
) : (
  <EmojiSceneCard emoji={node.illustrationFallbackEmoji} />
)}
```

**`<EmojiSceneCard />`:**
- max-w-2xl rounded-3xl bg-gradient-to-br from-[var(--student-primary)/20] to-[var(--student-accent)/20] aspect-[4/3]
- Emoji centered, font-size: 8rem
- Border-2 dashed for whimsy

**Reusable code:**
- ADAPT: `option-card.tsx` for choice button base styling

**Acceptance criteria:**
- Maya's story: butterfly garden, soft watercolor or curated images.
- Liam's story: space station, dramatic illustrations.
- Wrong choice: gentle teaching moment, NEVER feels punishing.
- Image always visible (real, curated, or emoji).
- Final node: confetti + celebration.

**Demo criticality:** Must Have

---

## Task A-10 — Onboarding / Placement Quiz UI (45 min, only if time permits)

**Objective:** Multi-step quiz UI for student onboarding.

**Files to modify:**
- `app/student/[studentId]/onboarding/page.tsx`
- `features/student-onboarding/onboarding-flow.tsx`

**Implementation spec:**
- Step indicator at top (5 dots, current highlighted).
- One question per step, big and centered.
- Progress smooth (motion).
- Final step: "Welcome, {name}! Let's start." → redirects to dashboard.

**Reusable code:**
- COPY: most components from `_enya-reference/.../onboarding/components/student/*`

**Demo criticality:** Nice to Have (skip if behind)

---

## Task A-11 — Pedagogical Audit Visual Polish (30 min, only if time permits)

**Objective:** Make the audit card visually impressive — judges will see this.

- Use AnimatedCircularProgressBar (Magic UI) for each of the 5 scores instead of static rings.
- Use NumberTicker (Magic UI) on the score numbers (count up from 0).
- Use AnimatedList for the recommendations list (entries slide in with stagger).

**Demo criticality:** Polish

---

## Reusable Code Inventory (Akin)

| From | What | How |
|---|---|---|
| `shared/components/ui/*` | All 36 base components | Copy verbatim — already done in O-02 |
| `_enya-reference/.../student-dashboard/components/student-dashboard-banner.tsx` | Hero pattern reference | Adapt aesthetic, build new |
| `_enya-reference/.../student-dashboard/components/skill-mastery-card.tsx` | Skill card pattern | Adapt for QuickStats |
| `_enya-reference/.../onboarding/components/student/option-card.tsx` | Choice card | Direct copy + minor styling for theming |
| `_enya-reference/.../student-course-view/components/youtube-player.tsx` | Video player | Rishabh ports; Akin styles container |
| `_enya-reference/.../student-course-view/components/quiz-modal.tsx` | Quiz modal pattern | Reference for transitions |
| Magic UI components | ShinyText, NumberTicker, AnimatedCircularProgressBar, AnimatedList | Install per-component as needed |
| Aceternity components | Spotlight (hero), AuroraBackground (loading), 3D card (lesson tiles) | Copy from aceternity.com |
| react-bits components | GradientText, BlurText | Install via npm or copy |

---

## Akin's Daily Schedule

| Time | Task |
|---|---|
| 8:30 AM | Standup, review overnight |
| 9:00 AM | A-01 + A-02 (root + teacher chrome) |
| 10:00 AM | A-03 (themed student container) |
| 10:45 AM | A-04 (student dashboard) |
| 12:15 PM | LUNCH |
| 12:45 PM | A-05 (teacher chat) |
| 2:15 PM | A-06 (text lesson UI) |
| 3:15 PM | A-07 (video lesson UI) |
| 4:15 PM | A-08 (voice activity UI) |
| 5:15 PM | A-09 (story game UI) — push through |
| 6:00 PM | A-11 polish if there's time |
| 6:30 PM | Demo |
