# Ultraplan 06 — Amin's Tasks (CEO / Business Dev)

> **Role:** Founder. The "this needs to be Enya-quality" voice. Cannot code UI components but everything else is fair game — and your work directly drives demo quality.
> **You DO:** Refine system prompts, design tool descriptions, create seed data, write demo script, prepare physical demo materials, configure Backboard/ElevenLabs dashboards, coordinate, rehearse.
> **You DON'T:** Code UI/components, write API routes, debug Zustand. (Those are Akin/Rishabh/Demi.)

---

## Reading Order
1. `ultraplan-00-architecture.md` — full read so you know what's locked
2. `ultraplan-02-system-prompt.md` — your primary editing surface
3. `ultraplan-08-seed-data.md` — your authoring surface
4. `ultraplan-07-demo-script.md` — your performance script
5. This file

---

## Pre-flight (the night before, ~30 min)

1. Test login to: Backboard.io dashboard, ElevenLabs dashboard, Google Cloud Console, OpenAI platform.
2. Verify API keys (you'll be the keeper of API access).
3. Have demo PDF ready: a Grade-3-appropriate science textbook or unit. Suggest: pull a 20-page extract from "OpenStax Elementary Science" (free) or a creative-commons grade-3 photosynthesis unit. Save as `_demo-assets/grade3-science-photosynthesis.pdf`.
4. Have backup laptop charged with same project + API keys.

---

## Task AM-01 — Backboard Assistant Configuration (45 min, t=–1d evening / before overnight)

**Objective:** Create THE ONE Backboard assistant the entire app uses, with the locked system prompt.

**Steps:**
1. Log into Backboard.io dashboard.
2. Click "Create Assistant".
3. Settings:
   - **Name:** "Enya Learning Assistant"
   - **Default model:** `gpt-4o`
   - **Memory:** Enabled (use Memory Pro tier if available)
   - **Description:** "AI literacy tutor + curriculum architect for K-12 EAL classrooms"
4. **System Prompt:** Paste verbatim from `ultraplan-02-system-prompt.md` §1. NO modifications — Rishabh has API tests written against this exact text.
5. Save → copy the assistant ID → message it to Rishabh for `.env.local`.
6. **Test:** From the dashboard chat, send "Hello, what can you help me with?" Verify response is friendly and asks what the user wants to do (matches §1 GREETING rule).
7. Send "Audit my materials" with no doc — verify it asks you to upload first.
8. Document: paste the assistant ID into `_meta/api-credentials.md` (NOT committed; lives only in shared 1Password).

**Acceptance:** Assistant exists, ID shared with Rishabh, smoke test passed.

---

## Task AM-02 — ElevenLabs Agent Configuration (30 min, before overnight)

**Objective:** Create the voice tutor agent with the locked persona.

**Steps:**
1. Log into ElevenLabs dashboard → Conversational AI section.
2. Click "Create Agent".
3. Settings:
   - **Name:** "Enya Voice Tutor"
   - **Voice:** Test 3-4 voices, pick the warmest, most kid-friendly, female-coded. Suggested: "Bella" or "Rachel". The voice should NOT sound robotic. Test with a sample child-directed sentence.
   - **Language:** English
   - **First message:** Leave empty (we override per-conversation).
4. **System Prompt:** Paste verbatim from `ultraplan-02-system-prompt.md` §4. NO modifications.
5. **LLM model:** Pick `gpt-4o-mini` for fast turn-taking (we don't need full GPT-4 for short voice exchanges).
6. **Tools:** None (we don't use ElevenLabs function calling for this hackathon — keeps it simple).
7. Save → copy agent ID to Rishabh for `.env.local`.
8. **Test:** Use the dashboard's "Test agent" feature. Speak: "Hi, I'm Maya, I'm in Grade 3. Can you help me explain photosynthesis?" Verify the agent responds warmly and uses simple language.

**Acceptance:** Agent exists, voice quality approved by you, smoke test passed.

---

## Task AM-03 — Master the Demo PDF (30 min, before overnight)

**Objective:** You must KNOW the contents of the textbook PDF cold so you can answer judges' questions like "what was on page 3?"

**Steps:**
1. Read the demo PDF you'll upload.
2. List the major sections, key vocabulary, illustrations.
3. Have a fallback PDF in case the primary one fails to parse (different copy of similar content).
4. Time the upload yourself with a stopwatch — should parse in <60s. If slower, ask Rishabh to optimize.

---

## Task AM-04 — Refine + Finalize Tool Descriptions (60 min, t=0:00–1:00 morning)

**Objective:** The `description` field of every tool tells the LLM when to use it. Bad descriptions = wrong tool calls. You polish these BEFORE Rishabh starts wiring them.

**Files to edit:**
- `shared/lib/tools/teacher-tools.ts`
- `shared/lib/tools/student-tools.ts`

**Steps:**
1. Read every tool definition. For each:
   - Description should clearly say: WHAT the tool does + WHEN to call it + any pre-conditions.
   - Parameter descriptions: clarify ambiguous fields. (e.g., `targetUnitCount` should say "Default 3-5; use teacher's stated preference if mentioned".)
2. Test by chatting with the Backboard assistant in dashboard:
   - "Create a course about photosynthesis for Grade 3" → should invoke `generate_course_outline`. If it asks unnecessary clarifying questions, the description needs more guidance.
   - "Audit this textbook" (after upload) → should invoke `audit_content_pedagogically`.
   - "What can Maya see for the lesson about photosynthesis?" → should invoke `preview_student_experience`.
3. Iterate descriptions until 5/5 demo prompts route to the right tool first try.

**Acceptance:** All 25 tools have descriptions you've stress-tested. Commit message: `docs(tools): finalize tool descriptions`.

**Demo criticality:** Must Have

---

## Task AM-05 — Author Seed Data — Students (30 min, t=1:00–1:30)

**Objective:** Maya + Liam profiles must be rich, believable, and visually pop.

**File:** `public/seed/students.json`

Use the schema in `ultraplan-08-seed-data.md` §1. For each student, fill:
- Name, grade, EAL level (matching architecture §1)
- Interests (specific, not generic — "monarch butterflies", not "nature")
- Cultural background (1-2 sentences with detail — country, language, family situation)
- Learning goals (3 bullets, observable)
- Theme: choose accent colors that work in OKLCH (use a color picker), pick a `backgroundPattern` enum value, point at the AI-generated hero image (will be filled in after AM-08)

Acceptance: Both profiles read like real, personable third-graders — not stock characters.

**Demo criticality:** Must Have

---

## Task AM-06 — Author Seed Course (30 min, t=1:30–2:00)

**Objective:** Pre-built course outline for the demo (used as fallback or initial state if generation flow times out during demo).

**File:** `public/seed/courses.json`

Use schema from `ultraplan-08-seed-data.md` §2. Build 1 course:
- Topic: "How Plants Make Food (Photosynthesis)"
- Grade: 3
- Curriculum standard: BC Grade 3 Science 2.1 ("Living things have features and behaviours that help them survive in their environment")
- 1 unit: "Plants are amazing food factories"
  - 3 lessons:
    - "What do plants need?" (sunlight, water, air, soil)
    - "Inside a leaf: tiny food factories"
    - "Why plants matter for everyone"
  - Each lesson has 4 activities (text, video, voice, story)

Provide: id, title, learningObjectives (3-5 per lesson, observable verbs).

**Demo criticality:** Must Have

---

## Task AM-07 — Author Story Game Skeletons for Maya + Liam (60 min, t=2:00–3:00)

**Objective:** Pre-write 2 complete story arcs (Maya's butterfly garden + Liam's space station) so the demo shows fully personalized stories even if generation fails.

**File:** `public/seed/lessons-maya/photosynthesis-1-story.json` + `public/seed/lessons-liam/photosynthesis-1-story.json`

Use schema from `ultraplan-08-seed-data.md` §5.

**Maya's story** (5 nodes, butterfly theme):
- Node 1: Maya finds a wilting butterfly in the garden. The butterfly says it needs help — its favorite flowers aren't growing. Why might that be?
  - Choices map to: missing sunlight (correct) / missing wind / missing visitors / it's just sad (wrong - teaching moment)
- Node 2: After identifying the issue, Maya walks deeper into the garden where a tiny green leaf invites her into the "sunshine kitchen" — what is the kitchen using?
  - Sunlight, water, air (correct) / Just water / Magic / Soil only
- ... 3 more nodes building to a celebration where the butterfly says thanks

**Liam's story** (5 nodes, space station theme):
- Node 1: Liam is the captain of a space station that grows plants for astronauts. The hydroponics bay sounds an alarm. The plants are dying. What's the FIRST thing to check?
  - Light source (correct) / Music level / Crew rosters / Door locks (wrong - teaching moment)
- ... continues with space-station-themed photosynthesis lessons

Each node has rich illustration descriptions (for AI gen or curated lookup). Each wrong choice has a kind feedbackOnSelect explaining the misconception.

**Acceptance:** Two complete story JSONs that work standalone and read like actual children's stories, not robotic.

**Demo criticality:** Must Have

---

## Task AM-08 — Generate Theme Hero Images (30 min, t=3:00–3:30)

**Objective:** AI-generate the personalized dashboard hero images for Maya + Liam.

**Steps:**
1. Once Rishabh confirms image gate result (DALL-E mode locked):
2. Run `scripts/generate-theme-heroes.ts` (or via OpenAI playground if needed):
   - **Maya prompt:** Style prefix from `ultraplan-00-architecture.md` §7.1 + "A vibrant garden full of colorful butterflies, a girl with curly black hair and a sketchbook, soft watercolor textures, golden afternoon light, panoramic composition wider than tall"
   - **Liam prompt:** Style prefix + "A futuristic space station orbiting Earth at sunrise, vibrant nebula colors in the background, a young boy in a sleek spacesuit looking out a porthole, panoramic"
   - Use `size: "1792x1024"` (wide format for hero)
3. Download both images. Save:
   - `public/seed/themes/maya-hero.jpg`
   - `public/seed/themes/liam-hero.jpg`
4. Update `students.json` — set `theme.heroImageUrl` to these paths.

**Acceptance:** Two distinct, beautiful, kid-appropriate hero images load on dashboards.

**Demo criticality:** Must Have

**Fallback:** If image gen unreliable, source from Pexels (search "child butterfly garden" + "child space astronaut") and run them through a watercolor filter (e.g., paint-effect.com).

---

## Task AM-09 — Author + Record Voice Fallback MP3s (45 min, t=3:30–4:15)

**Objective:** 30-60 second pre-recorded interactions for Maya + Liam, used if the live ElevenLabs connection fails.

**Steps:**
1. Write 2 short scripts (~30s each):
   - **Maya script** (Emerging A1, photosynthesis, "explain back" subtype):
     - Tutor: "Hi Maya! I love your garden picture! Can you tell me — what helps the plant grow big?"
     - Student: "Sun?"
     - Tutor: "Yes! The sun helps. What else does the plant need?"
     - Student: "Water!"
     - Tutor: "Great! Sun and water. You explained it so well. The plant uses these to make its food. You're a smart helper, Maya!"
   - **Liam script** (Proficient B1, photosynthesis, "debate"):
     - Tutor: "Liam, I'll take a position: I think plants don't really need sunlight — they could grow with just water. Can you argue against me?"
     - Student: "That's wrong! Plants need sunlight for photosynthesis. Without sunlight they can't make glucose."
     - Tutor: "Hmm, but couldn't they get energy from water alone?"
     - Student: "No, water doesn't provide energy. Sunlight is the energy source the chlorophyll captures."
     - Tutor: "You're right — I conceded! Energy comes from light. Nice argument."
2. Record using ElevenLabs TTS API or paste into ElevenLabs Studio:
   ```
   POST /v1/text-to-speech/{voice-id}
   Body: { text: scriptText, model_id: 'eleven_turbo_v2_5' }
   Save .mp3 → public/seed/voice-fallback-maya.mp3 (and liam)
   ```
   For Maya's tutor lines: use a slow voice setting. For Liam's: natural pace.
3. For the student lines, use a different voice (kid-coded TTS or just record yourself — these are mock).
4. Stitch tutor + student lines into a single MP3 with brief pauses (use Audacity or `ffmpeg -i tutor1.mp3 -i student1.mp3 ... merged.mp3`).

**Acceptance:** Two MP3s play cleanly, sound natural, demonstrate EAL adaptation differential.

**Demo criticality:** Must Have

---

## Task AM-10 — Curate Image Library (if needed, conditional) (60 min, t=4:15–5:15)

**Objective:** If image gate failed (`NEXT_PUBLIC_IMAGE_MODE=curated`), build the fallback library.

**Steps:**
1. For each theme (butterflies, space, soccer, animals, fantasy):
   - Browse Pexels.com — search "<theme> illustration" filter Photos→Illustrations
   - Download 6-10 images (more for the active demo themes butterflies + space)
   - Verify all are CC0 / Pexels-license (free for commercial)
2. Place in `public/seed/illustrations/{theme}/{n}.jpg`.
3. Create `public/seed/illustrations/manifest.json`:
   ```json
   {
     "butterflies": [
       { "path": "/seed/illustrations/butterflies/1.jpg", "tags": ["garden", "monarch", "flowers"] },
       ...
     ],
     "space": [...]
   }
   ```
4. Each entry: 3-5 descriptive tags so the LLM can match scenes.

**Acceptance:** 30 images per theme (or as many as gate-needed themes), all licensed, all tagged.

**Demo criticality:** Conditional Must Have

---

## Task AM-11 — Demo Rehearsal Round 1 (45 min, t=5:15–6:00)

**Objective:** Walk the demo end-to-end with the team, time it, polish the script.

**Steps:**
1. Open `ultraplan-07-demo-script.md`.
2. With the team watching, you (the demo presenter) walk every step.
3. Time each segment. Total target: <8 min.
4. Capture issues:
   - Things that load slow → flag for Rishabh
   - UI that doesn't pop → flag for Akin
   - State bugs → flag for Demi
   - Words that hit awkwardly in your script → revise
5. Update `ultraplan-07-demo-script.md` with timing annotations and rewrites.

---

## Task AM-12 — Demo Rehearsal Round 2 (30 min, t=6:00–6:30)

**Objective:** Second walkthrough with all fixes from R1 applied.

**Acceptance:** End-to-end demo runs cleanly in <8 min. Presenter (you) has muscle memory for the path.

---

## Task AM-13 — Live Demo + Q&A (the moment, t=6:30 onward)

**Objective:** Win the hackathon.

**Pre-demo (5 min before):**
1. Run `npm run check` — verify all green.
2. Close all unrelated browser tabs.
3. Disable notifications system-wide.
4. Set `NEXT_PUBLIC_USE_SEED_FALLBACK=false` (live mode).
5. Plug in laptop power (don't trust battery during demo).
6. Open the seed-fallback override in console as a hot escape: have `window.localStorage.setItem('USE_SEED_FALLBACK','true')` in a clipboard manager — one paste away from rescue.

**During demo:**
- Follow `ultraplan-07-demo-script.md` strictly.
- If anything fails, use the inline fallback move from §3 of demo script.
- Smile. Be present. Talk to the judges, not the laptop.

**Q&A prep:**
- Rehearse answers to: "How is this different from Khanmigo / TeachAI?" "How do you measure EAL growth?" "How do teachers actually use this?" "What's your moat?" "Is this just GPT-4 with prompts?"

---

## Reusable Code Inventory (Amin)

You don't write code. You don't need this section. (But: if you want to learn, `_enya-reference/.../shared/types/dto/Student.ts` and `Course.ts` show how the production app models students/courses — useful for grounding your seed data.)

---

## Amin's Daily Schedule

| Time | Task |
|---|---|
| Night before | AM-01 (Backboard), AM-02 (ElevenLabs), AM-03 (PDF prep) |
| 8:30 AM | Standup |
| 9:00 AM | AM-04 (refine tool descriptions) |
| 10:00 AM | AM-05 (students.json) |
| 10:30 AM | AM-06 (course.json) |
| 11:00 AM | AM-07 (story games) |
| 12:00 PM | LUNCH |
| 12:30 PM | AM-08 (hero images) |
| 1:00 PM | AM-09 (voice fallback MP3) |
| 1:45 PM | AM-10 (image library if needed) |
| 2:45 PM | AM-11 (rehearsal R1) |
| 3:30 PM | (free time — help where needed; debug seed data; coordinate) |
| 5:00 PM | AM-12 (rehearsal R2) |
| 5:30 PM | AM-13 — DEMO |

---

## What Amin Coordinates (constant background task)

Throughout the day, you are the team's communication hub:
- Standup at 8:30 AM, you facilitate. 5 min max.
- Hourly check-ins (5-min standups at top of each hour) — keep team aligned, surface blockers.
- You decide what gets cut if behind schedule. Use this rule: "Will judges notice?" If no → cut. If yes → keep.
- You are the final voice on visual quality. If something looks unfinished, you tell Akin to polish or replace.
- You hold the demo script and revise it as the build evolves.
