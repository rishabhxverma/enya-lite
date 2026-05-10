# Ultraplan 07 — Demo Script + Fallback Paths

> **Presenter:** Amin (lead voice). **Co-presenter / driver:** Rishabh (clicks, manages laptop).
> **Total target time:** 6 minutes pitch + 2 minutes Q&A buffer = 8 min.
> **Audience:** Hackathon judges (probably 1-2 educators, 1-2 technologists, 1-2 investors/operators).

---

## 0. The Pitch in 30 Seconds (memorize)

> "Every K-12 classroom has students at wildly different EAL levels reading the same generic textbook. Teachers do not have time to personalize. Enya Learning generates **a different lesson for every student** — same topic, but the text, the video questions, the voice tutor, the story game are all built around that specific kid's interests and language level. Watch."

---

## 1. Setup (60 seconds before judges arrive)

| # | Action | Owner |
|---|---|---|
| 1 | `npm run check` — confirm all green | Demi |
| 2 | Open browser to `localhost:3000` | Rishabh |
| 3 | Confirm seed fallback toggle in console clipboard | Rishabh |
| 4 | Close all other tabs/notifications | Rishabh |
| 5 | Pre-open: terminal with `npm run demo:l4` ready to invoke | Rishabh |
| 6 | Confirm mic + speakers work for voice activity | Amin |
| 7 | Confirm wifi stable | Anyone |

---

## 2. The Live Walkthrough (timed segments)

### Segment 1 — Hook + Teacher Mode (0:00 – 1:30, 90s)

**Amin says:**
> "Meet Sarah, a Grade 3 teacher in Vancouver. She has 27 students. Five are EAL learners, all at different levels, all from different cultures. Today she's planning a unit on photosynthesis. Watch what happens when she opens Enya."

**Action:** Click landing page → click "Teacher" pill in top-right → land on `/teacher`.

**Visual beat:** The friendly empty-state Enya welcome screen. Suggestion chips visible.

**Amin says:**
> "Enya is a chat-first interface. The teacher just talks to it. Today she wants to build a course."

**Action:** Click suggestion chip "Create a new course".

**Action:** When chat input appears, drag the prepared `grade3-science-photosynthesis.pdf` from desktop into the upload zone. (Pre-staged in finder for one-drag.)

**Visual beat:** UploadStatusCard appears with progress bar → "Parsed! 47 pages, 142 chunks indexed".

**Amin says:**
> "Enya parsed the textbook with Docling, embedded it, and indexed every chunk for retrieval. Now we tell it the parameters."

**Action:** Type "Make this a 1-unit, 3-lesson course for Grade 3, mapped to BC Science 2.1." Send.

**Visual beat:** Loading dots → CourseOutlinePreview card renders with the unit/lessons tree.

**Amin says:**
> "Outline generated, mapped to provincial standards. But here's the magic — that course doesn't exist yet for any specific student. Watch what happens when we add a student."

---

### Segment 2 — Student Profile + Pedagogical Audit (1:30 – 2:45, 75s)

**Action:** Type "Create a student profile. Maya, Grade 3, just arrived from Syria, speaks Arabic and is at Emerging level. Loves butterflies and art. Quiet learner." Send.

**Visual beat:** StudentProfileCard renders showing Maya's full profile with butterfly-themed avatar.

**Amin says:**
> "Profile stored in Enya's memory. Now let's also add Liam — Grade 6, born in Canada, B1 Proficient, into space and robotics, energetic. Different student. Different needs."

**Action:** Type "Add Liam, Grade 6, Proficient, born in Canada, loves space and robotics." Send.

**Visual beat:** Second StudentProfileCard.

**Amin says:**
> "And before we hand kids any of this content, Enya can audit our textbook against pedagogical best practices."

**Action:** Type "Audit this textbook for Bloom's taxonomy alignment, scaffolding, and cultural sensitivity." Send.

**Visual beat:** PedagogicalAuditCard renders with 5 score rings (Bloom's, Scaffolding, Vocab Load, Cultural Sensitivity, Curriculum Alignment) + 3-5 prioritized recommendations.

**Amin says:**
> "It scores the textbook on Bloom's taxonomy distribution, scaffolding quality, vocabulary load, cultural sensitivity, and curriculum alignment. Then it gives the teacher specific recommendations. This isn't generic feedback — this is grounded in what we just uploaded."

**[Optional flex:]**
> "Look — it flagged that the original textbook examples are baseball-heavy, which won't land for newcomer kids. It suggests universal alternatives. That's the kind of mentoring most teachers don't have time for."

---

### Segment 3 — Switch to Maya — The L4 Reveal (2:45 – 4:30, 105s)

**Amin says:**
> "Now the magic. Let's see what Maya gets."

**Action:** Click the "Maya" pill in top-right.

**Visual beat:** Page fades. Reloads with **butterfly-themed dashboard** — pink hero, AI watercolor garden background, "Hi Maya! 🦋 Ready for today's adventure?" in handwritten-style font. Quick stats with butterfly icons.

**Amin says:**
> "Maya's dashboard is themed to her interests. The greeting is at her language level. The AI generated this hero image specifically for her. Now let's open her photosynthesis lesson."

**Action:** Click "Continue Learning" on the today's-lesson card → navigates to text lesson.

**Visual beat:** Text lesson loads. Title: "How Plants Eat Sunlight". Body uses butterfly-on-flower analogies: "When a butterfly drinks from a flower, the flower gives sweet juice. Plants make their own juice — from sunlight!"

**Amin says:**
> "Read this — A1 vocabulary, butterfly metaphors, simple sentences. This text didn't exist before — Enya generated it for Maya, just now."

**Action:** Scroll down past the diagram (emoji art: ☀️ → 🌿 → 🌸).

**[OPTIONAL — only if time permits, ~10s]:** Click answer on first comprehension question. Show green correct feedback.

**Action:** Click the activity nav: "Watch" tab.

**Visual beat:** Video lesson page. YouTube player visible.

**Amin says:**
> "The video lesson is a curriculum-aligned YouTube video. Watch what happens at 30 seconds."

**Action:** Click play. Wait 30s — let it actually play (this is the riskiest live demo moment; if YouTube doesn't load, fall back).

**Visual beat:** Around 30s, video pauses. Overlay quiz appears with butterfly-themed image and a question like "What did the plant just take in?" with options.

**Amin says:**
> "Pauses at the right moment. Asks Maya — at her level — about what she just saw. Click the right answer..."

**Action:** Click correct option → green feedback → modal closes → video resumes briefly.

**Action:** Pause manually. Click activity nav "Speak".

---

### Segment 4 — Voice Activity — The Goosebump Moment (4:30 – 5:30, 60s)

**Visual beat:** Voice splash screen — big mic icon, "Voice Practice: Explain Back".

**Amin says:**
> "Voice activity. Maya is going to explain photosynthesis back to the AI tutor — at her level."

**Action:** Click "Start Conversation". Mic permission grant.

**Visual beat:** Mic orb pulses. Tutor speaks (audio): "Hi Maya! I love your butterfly garden. Can you tell me — what helps the flower grow?"

**Amin** (speaking AS Maya into the mic, slightly accented): "Sun?"

**Visual beat:** Tutor responds: "Yes! The sun helps. What else does the plant need?"

**Amin:** "Water."

**Visual beat:** Tutor: "Great! Sun and water. The plant uses these to make its food. You explained it so well!"

**Amin says (turning to judges):**
> "Notice the speech pace and vocabulary — that's Emerging level. Watch what happens with Liam."

**Action:** Click "End Conversation".

**Action:** Click Liam pill in top-right.

---

### Segment 5 — Same Lesson, Liam's View (5:30 – 6:30, 60s)

**Visual beat:** Page fades. Liam's dashboard: blue/cyan, cosmic nebula hero, "Hey Liam! 🚀 Ready for the mission?" in futuristic font.

**Amin says:**
> "Same app. Different student. Completely different theme."

**Action:** Click "Continue Learning" → text lesson loads.

**Visual beat:** Liam's text lesson — title "Plants: The Original Energy Engineers" — body uses rocket-fuel and energy-conversion analogies. B1 vocabulary visible.

**Amin says:**
> "Same lesson, totally different content. Look at the vocabulary — 'photosynthesis converts solar energy via chlorophyll-bearing cells'. That's B1 register. He'd be bored by Maya's version. Maya would be lost reading his."

**Action:** Click "Apply" tab → story game opens.

**Visual beat:** Liam's story game first node: space station hydroponics bay, plants are dying, you're the captain. 4 choices.

**Amin says:**
> "And this is the activity that secretly tests learning — a choose-your-adventure where wrong answers become teaching moments."

**Action:** Click an intentionally-wrong choice.

**Visual beat:** Teaching Moment modal: "Hmm, let's think about this differently. Door locks don't affect plant growth — but light source might. Try again?"

**Amin says:**
> "No shame. No buzzer. Just a gentle redirect. He picks again..."

**Action:** Click correct choice → green shimmer → next story node appears.

---

### Segment 6 — Close (6:30 – 7:00, 30s)

**Action:** Switch terminal — run `npm run demo:l4`.

**Visual beat:** Terminal prints side-by-side proof: Maya's content vs Liam's content. Differential ratio: ~70%.

**Amin says:**
> "Two students, one topic, one teacher upload. Two completely different learning experiences. Generated by AI, grounded in the textbook, mapped to provincial curriculum. This is L4 personalization — and we built it in seven hours on a single Backboard.io assistant. Thanks!"

**[Lights/cameras/applause/checks/funding/take-our-money]**

---

## 3. Fallback Paths — In-Demo Recovery Moves

Each potential failure has a **silent recovery move** the team practices before demo. NEVER apologize, NEVER explain a fallback. Just glide.

| If this breaks... | Silent recovery |
|---|---|
| **Backboard times out on first message** | Type same message again. Backboard cold-start can take ~10s on first call — mention this is "first-call activation" if asked. Otherwise just wait and re-send. |
| **PDF parse hangs** | Already tested in seed; if hanging mid-demo, refresh page once. Worst case: type "let's use the textbook I uploaded earlier" — Backboard memory has the doc from rehearsal. |
| **Course outline generation fails** | We have `public/seed/courses.json` — Demi's seed-fallback toggles via `localStorage.USE_SEED_FALLBACK=true` in console. The course outline card renders from the seed. |
| **Audit doesn't render properly** | Switch to `localStorage.USE_SEED_FALLBACK=true` and the seeded audit card appears. Continue. |
| **Maya's text lesson loads slowly** | Pre-cached in seed; should load <500ms with fallback ON. If LIVE generation, just say "Generating live for Maya..." while it loads — that's actually a stronger pitch ("live!"). |
| **YouTube video won't play** | Use the pre-vetted fallback YouTube IDs in `youtube-fallbacks.json` (auto-loads). If YouTube itself is down for the venue: skip the play, just show the overlay question pop up at 30s WITHOUT video, and verbally explain. |
| **Voice activity fails to connect** | Click "End Conversation" → toggle `NEXT_PUBLIC_VOICE_MODE=simulated` (need page reload, costs 5s) OR just play the pre-recorded MP3 by visiting `/seed/voice-fallback-maya.mp3` directly. **Practice the silent skip:** "Voice tutor active — listen to a sample interaction" and play the MP3 over speakers. |
| **Story game image broken** | Image fallback chain auto-handles: emoji card. Looks intentional. Move on. |
| **Story game node generation slow** | Seed-fallback has the full Maya + Liam stories pre-generated. If live gen fails, the seed kicks in via the loader. |
| **Switching student doesn't visually change theme** | Refresh the page. The CSS-vars-on-data-attribute should always work; refresh forces re-evaluation. |
| **Total disaster** | Switch to `localStorage.USE_SEED_FALLBACK=true`, refresh, walk through using all-seed content. The seed content IS real (pre-generated by live API in R-03). Demo still works; we just don't show live generation. |

**The escape hatch:** Set `localStorage.USE_SEED_FALLBACK = 'true'` in browser console. ENTIRE demo runs from seed. Nothing is fake-data — it was all generated live earlier and saved.

---

## 4. Anticipated Questions + Pre-Built Answers

| Question | Answer |
|---|---|
| "Is this just GPT-4 with prompts?" | "It's GPT-4 + Claude + Gemini, orchestrated through Backboard with per-turn tool calling, RAG over the teacher's actual textbook, and per-student persistent memory. The novelty is the L4 personalization principle — every student gets unique content. We're not templating." |
| "How do you measure EAL growth?" | "Today: quiz performance trending across CEFR-aligned proficiency markers, time-on-task, and adaptive question difficulty. Future: spaced repetition + speech assessment via the voice activity transcript analysis." |
| "How is this different from Khanmigo?" | "Khanmigo is a tutor on top of fixed Khan Academy content. Enya generates the content per-student from the teacher's OWN material. Different DNA — content production layer, not just tutor layer." |
| "Won't teachers just trust AI blindly?" | "Every generation is reviewable. The teacher approves the course outline, can request audits, and previews exactly what each student will see before publishing. We're building tools for teacher judgment, not replacing it." |
| "Privacy / data on minors?" | "Built so all student data lives in tenant-scoped storage (Backboard's per-assistant memory in production). For hackathon: no real student data. Production: COPPA-aligned, parental consent flow." |
| "What's the moat?" | "(a) Curriculum + EAL pedagogy expertise embedded in the prompts. (b) Multi-modal personalization stack (text + video + voice + game) — each modality has its own personalization logic. (c) Teacher-trust UX — audit-first." |
| "What about hallucinations on curriculum content?" | "All student-facing factual content is grounded in the teacher's uploaded material via RAG. The LLM is constrained to the source. Audit step explicitly checks alignment." |
| "Tech stack quickly?" | "Next.js, Backboard.io for AI orchestration, ElevenLabs for voice, Docling for PDF parsing, DALL-E for personalized illustrations. ~15 hours of build time including the 8-hour overnight scaffold." |

---

## 5. The Demo Hardware Setup

- **Laptop:** Rishabh's primary. Tested. Charged. Plugged in.
- **Backup laptop:** Amin's, identical project pulled, API keys configured. In-bag.
- **External display / projector:** Use HDMI adapter; mirror display, not extend (avoids weird cursor moves).
- **Audio:** Use external speakers if room is large. Test the voice activity audio output volume.
- **Mic:** Built-in laptop mic for voice activity. Verify it picks up at presenter distance.
- **Wifi:** Use venue wifi. If sketchy, use Rishabh's hotspot — pre-configure laptop to know this network.
- **Screen brightness:** 100%. Cursor: enlarged (`System Settings → Accessibility → Display → Cursor size`).

---

## 6. Visual Wow Moments to Emphasize (cheat sheet for presenter)

In order of "judges will gasp at":
1. **Maya → Liam theme switch** — biggest visual. Pause. Let them see it.
2. **Voice activity live response** — say nothing. Let it play.
3. **AI-generated hero images** — point them out: "Notice this image was generated for Maya specifically."
4. **L4 differential terminal** — keep it on screen for the closing line.
5. **Teaching moment on wrong choice** — judges who are educators will GET this.
6. **Pedagogical audit card** — the 5 scores + recommendations are very "Enya-quality" — this is your DNA showing.

---

## 7. Common Demo Mistakes to Avoid

- ❌ Don't read the on-screen text aloud. Talk over it.
- ❌ Don't pause too long during loading — fill with narration.
- ❌ Don't say "let's hope this works" — demo psychology kills the magic.
- ❌ Don't go over 6 minutes. Even 6:30 starts losing judges.
- ❌ Don't drill into ONE feature too deep — show breadth.
- ❌ Don't apologize for what's missing. Show what works.
- ❌ Don't use the laptop trackpad for fast clicks; use a mouse if possible.

---

## 8. Post-Demo (immediately after)

- Smile. Stand back. Let judges ask.
- Hand off to Rishabh / Demi for any technical questions.
- Have business cards / one-pager ready (Amin pre-printed 20 copies).
- If judges show interest, suggest a follow-up call. Get contact info.
- Win.
