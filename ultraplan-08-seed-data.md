# Ultraplan 08 — Seed Data Specifications

> **Owner:** Amin authors content; Rishabh generates LLM-derived content via R-03; Demi enforces shape via zod parse.
> **Purpose:** Every JSON file the demo loads from disk so it can run without live AI calls. Toggled by `NEXT_PUBLIC_USE_SEED_FALLBACK`.

All paths relative to project root: `/Users/rishabhverma/Desktop/Althra Hackathon/Enya Lite/`.

---

## 1. `public/seed/students.json`

**Shape:** Array of `StudentProfile` (per architecture §5).

**Required entries:** Maya + Liam.

```json
[
  {
    "id": "maya",
    "name": "Maya Haddad",
    "avatarUrl": "/seed/avatars/maya.svg",
    "grade": 3,
    "ealLevel": "Emerging",
    "interests": ["butterflies", "art", "drawing", "gardens"],
    "culturalBackground": "Newcomer from Aleppo, Syria. Arabic is her first language. Lives with mother and grandmother in Vancouver. Quiet observer; expresses herself best through drawings.",
    "learningGoals": [
      "Build confidence speaking simple English aloud",
      "Connect new English words to familiar objects",
      "Use drawings to support understanding"
    ],
    "theme": {
      "primaryColor": "oklch(0.78 0.15 340)",
      "accentColor": "oklch(0.85 0.18 50)",
      "backgroundPattern": "butterflies",
      "heroImageUrl": "/seed/themes/maya-hero.jpg",
      "fontPairing": "whimsical"
    }
  },
  {
    "id": "liam",
    "name": "Liam Chen-Patel",
    "avatarUrl": "/seed/avatars/liam.svg",
    "grade": 6,
    "ealLevel": "Proficient",
    "interests": ["space exploration", "robotics", "video games", "building things"],
    "culturalBackground": "Born in Toronto. Father from Hong Kong, mother from Mumbai. Trilingual at home (English, Cantonese, Hindi). Confident, energetic, competitive learner who loves a challenge.",
    "learningGoals": [
      "Use precise scientific vocabulary in writing and speech",
      "Construct evidence-based arguments",
      "Connect concepts across science domains"
    ],
    "theme": {
      "primaryColor": "oklch(0.55 0.22 260)",
      "accentColor": "oklch(0.75 0.18 195)",
      "backgroundPattern": "starfield",
      "heroImageUrl": "/seed/themes/liam-hero.jpg",
      "fontPairing": "futuristic"
    }
  }
]
```

**Avatars:** Generate two simple SVG avatars (initials in themed colors) or AI-generate two friendly cartoon portraits. Save as `/seed/avatars/maya.svg` and `/seed/avatars/liam.svg`.

---

## 2. `public/seed/courses.json`

**Shape:** Array of `Course` (per architecture §5).

**Required entries:** 1 course — Photosynthesis.

```json
[
  {
    "id": "photosynthesis-101",
    "title": "How Plants Make Food",
    "topic": "Photosynthesis",
    "gradeLevel": 3,
    "curriculumStandard": "BC Grade 3 Science 2.1 — Living things have features and behaviours that help them survive in their environment",
    "textbookDocumentId": "doc_seed_textbook_photosynthesis",
    "units": [
      {
        "id": "unit-1",
        "title": "Plants are amazing food factories",
        "description": "Students discover that plants make their own food using simple ingredients from their environment.",
        "lessons": [
          {
            "id": "photosynthesis-1",
            "title": "What do plants need?",
            "learningObjectives": [
              "Students will identify the four things plants need to grow: sunlight, water, air, and soil",
              "Students will describe what happens to a plant when one of these is missing",
              "Students will use the word 'photosynthesis' to name the process"
            ],
            "activities": [
              { "type": "text",  "id": "photosynthesis-1-text",  "status": "available" },
              { "type": "video", "id": "photosynthesis-1-video", "status": "available" },
              { "type": "voice", "id": "photosynthesis-1-voice", "status": "available", "activitySubtype": "explain-back" },
              { "type": "story", "id": "photosynthesis-1-story", "status": "available", "theme": "personalized" }
            ]
          },
          {
            "id": "photosynthesis-2",
            "title": "Inside a leaf: tiny food factories",
            "learningObjectives": [
              "Students will identify chlorophyll as the green substance that captures sunlight",
              "Students will describe the leaf as the location where photosynthesis happens",
              "Students will explain why most leaves are green"
            ],
            "activities": [
              { "type": "text",  "id": "photosynthesis-2-text",  "status": "locked" },
              { "type": "video", "id": "photosynthesis-2-video", "status": "locked" },
              { "type": "voice", "id": "photosynthesis-2-voice", "status": "locked", "activitySubtype": "comprehension" },
              { "type": "story", "id": "photosynthesis-2-story", "status": "locked", "theme": "personalized" }
            ]
          },
          {
            "id": "photosynthesis-3",
            "title": "Why plants matter for everyone",
            "learningObjectives": [
              "Students will explain that plants make oxygen as a byproduct of photosynthesis",
              "Students will describe how animals (including humans) depend on plants",
              "Students will give one example of how to take care of plants"
            ],
            "activities": [
              { "type": "text",  "id": "photosynthesis-3-text",  "status": "locked" },
              { "type": "video", "id": "photosynthesis-3-video", "status": "locked" },
              { "type": "voice", "id": "photosynthesis-3-voice", "status": "locked", "activitySubtype": "debate" },
              { "type": "story", "id": "photosynthesis-3-story", "status": "locked", "theme": "personalized" }
            ]
          }
        ]
      }
    ]
  }
]
```

**Note:** Lesson 1 is `available`; lessons 2-3 are `locked` for demo simplicity (we don't need to demo every lesson).

---

## 3. `public/seed/lessons-{maya|liam}/{lessonId}-text.json`

**Shape:** `{ generatedAt: string; content: TextLessonContent; version: 1 }`

**Required entries:** 6 files (3 lessons × 2 students).

**Generation strategy (Rishabh during R-03):** Run live generation through `/api/student/generate-text-lesson` for each (student, lesson). Save the response wrapped in the envelope.

**Quality gates:**
- Maya's content uses Emerging (A1) vocabulary, sentences ≤8 words, butterfly/garden references.
- Liam's content uses Proficient (B1) vocabulary, sentences ≤18 words, space/rocket/engineering references.
- Each has 3-4 sections, 1-2 emoji diagrams, 3 comprehension questions.

**Example excerpt (Maya, lesson 1):**

```json
{
  "generatedAt": "2026-05-09T12:00:00Z",
  "version": 1,
  "content": {
    "studentId": "maya",
    "lessonId": "photosynthesis-1",
    "title": "How Plants Eat Sunlight",
    "bodyMarkdown": "## A butterfly's secret\n\nWhen a butterfly drinks from a flower, the flower gives sweet juice. But how does the flower make this juice?\n\nThe flower uses **sunlight**! Plants make their own food. They are amazing.\n\n## What plants need\n\nPlants need four things. They are:\n\n- **Sun** ☀️ (for light)\n- **Water** 💧 (from rain)\n- **Air** 💨 (we cannot see it)\n- **Soil** 🌱 (for their roots)\n\nWhen a plant has all four, it grows big.\n\n## A new word: photosynthesis\n\nThe big word is **photosynthesis**.\n\nIt sounds hard but it is simple. The plant makes food from sun, water, and air. That is photosynthesis.\n\nButterflies love plants. Plants need sun. Now you know!",
    "diagrams": [
      {
        "caption": "Plants need four things to grow",
        "emojiArt": "☀️  +  💧  +  💨  +  🌱  →  🌸"
      }
    ],
    "comprehensionQuestions": [
      {
        "id": "q1",
        "prompt": "What helps the plant the most?",
        "type": "multiple-choice",
        "options": ["The sun", "The moon", "The wind", "The night"],
        "correctAnswerIndex": 0,
        "explanation": "Yes! The sun gives light. Plants need light to make food.",
        "learningObjectiveId": "lo-1"
      },
      {
        "id": "q2",
        "prompt": "What is the big word for how plants make food?",
        "type": "fill-blank",
        "correctAnswer": "photosynthesis",
        "explanation": "Photosynthesis. Plants use sun, water, and air to make food.",
        "learningObjectiveId": "lo-3"
      },
      {
        "id": "q3",
        "prompt": "True or false: Plants can grow without water.",
        "type": "true-false",
        "correctAnswer": "false",
        "explanation": "False. Plants need water. Without water they cannot live.",
        "learningObjectiveId": "lo-1"
      }
    ]
  }
}
```

**Example excerpt (Liam, lesson 1):**

```json
{
  "generatedAt": "2026-05-09T12:00:01Z",
  "version": 1,
  "content": {
    "studentId": "liam",
    "lessonId": "photosynthesis-1",
    "title": "Plants: The Original Energy Engineers",
    "bodyMarkdown": "## Engineering with sunlight\n\nLong before astronauts figured out how to grow food on a space station, plants had perfected a process humans still can't fully replicate. Plants are bio-chemical engineers — and their fuel is sunlight.\n\n## The four inputs\n\nEvery plant operates on four resources working together:\n\n- **Solar energy** ☀️ — captured by green chlorophyll molecules\n- **Water** 💧 — pulled up from the roots\n- **Carbon dioxide** 💨 — absorbed from the air\n- **Soil nutrients** 🌱 — providing trace minerals\n\nMissing any one and the plant's energy production halts. It's basically a self-sustaining solar plant — no batteries required.\n\n## Photosynthesis: the chemistry\n\nThe formal name for this process is **photosynthesis**. Inside leaf cells, chlorophyll converts solar photons into chemical energy, splitting water molecules and recombining the products with carbon dioxide to form glucose. Oxygen is released as a byproduct — the air you're breathing right now was likely produced by a plant.\n\nIf you ever design a Mars colony, plants are doing more than feeding the crew — they're keeping the atmosphere breathable.",
    "diagrams": [
      {
        "caption": "Photosynthesis is a chemical conversion: light + water + CO₂ → glucose + O₂",
        "emojiArt": "☀️ + 💧 + 💨  →  🍇 + 🫧"
      }
    ],
    "comprehensionQuestions": [
      {
        "id": "q1",
        "prompt": "Which molecule captures solar energy inside the leaf?",
        "type": "multiple-choice",
        "options": ["Glucose", "Chlorophyll", "Carbon dioxide", "Mitochondria"],
        "correctAnswerIndex": 1,
        "explanation": "Correct — chlorophyll absorbs photons and kicks off the chemical conversion.",
        "learningObjectiveId": "lo-1"
      },
      {
        "id": "q2",
        "prompt": "What gas is released as a byproduct of photosynthesis?",
        "type": "fill-blank",
        "correctAnswer": "oxygen",
        "explanation": "Oxygen. Plants exchange CO₂ for O₂ — making them critical for breathable atmospheres.",
        "learningObjectiveId": "lo-3"
      },
      {
        "id": "q3",
        "prompt": "True or false: Plants could survive on a Mars colony with only soil and water — no sunlight needed.",
        "type": "true-false",
        "correctAnswer": "false",
        "explanation": "False. Without solar energy or artificial light, photosynthesis cannot occur.",
        "learningObjectiveId": "lo-2"
      }
    ]
  }
}
```

**Differential check:** Levenshtein distance between Maya's `bodyMarkdown` and Liam's > 40% of total length. Demi's L4 test enforces this.

---

## 4. `public/seed/lessons-{maya|liam}/{lessonId}-video.json`

**Shape:** `{ generatedAt; content: VideoLessonContent; version: 1 }`

**Required entries:** 6 files (3 lessons × 2 students).

**Note:** The YouTube video itself is the SAME for both students (both see "How Plants Make Food — SciShow Kids" or similar). What differs is the **overlay questions** — they're personalized.

**Selection criteria for the YouTube video** (Rishabh in R-03 calls `search_youtube_video`, then locks the chosen video into the seed):
- 3-8 minute duration
- Kid-friendly channel (SciShow Kids, Crash Course Kids, National Geographic Kids, BBC Earth Kids)
- Closed captions available
- Embeddable

**Pre-vetted fallback IDs (always work)** — saved separately in `public/seed/youtube-fallbacks.json`:
```json
{
  "photosynthesis": [
    { "youtubeId": "UPBMG5EYydo", "title": "Photosynthesis | Educational Video for Kids", "channel": "Happy Learning English", "duration": 240 },
    { "youtubeId": "D1Ymc311XS8", "title": "Photosynthesis For Kids", "channel": "Peekaboo Kidz", "duration": 312 },
    { "youtubeId": "g78utcLQrJ4", "title": "How Do Plants Make Food", "channel": "FuseSchool", "duration": 350 }
  ]
}
```

**Example excerpt** (Maya, lesson 1, using SciShow Kids video — replace `youtubeId` with whatever Rishabh selects):

```json
{
  "generatedAt": "2026-05-09T12:01:00Z",
  "version": 1,
  "content": {
    "studentId": "maya",
    "lessonId": "photosynthesis-1",
    "youtubeId": "UPBMG5EYydo",
    "title": "How Plants Make Food",
    "overlayQuestions": [
      {
        "pauseAtSeconds": 30,
        "question": {
          "id": "vq1",
          "prompt": "What did the plant just need from the sun?",
          "type": "multiple-choice",
          "options": ["Light", "Sound", "A song", "Wind"],
          "correctAnswerIndex": 0,
          "explanation": "The sun gives light. Plants use light to make food.",
          "learningObjectiveId": "lo-1"
        }
      },
      {
        "pauseAtSeconds": 90,
        "question": {
          "id": "vq2",
          "prompt": "What two things does the plant get from rain and air?",
          "type": "multiple-choice",
          "options": ["Water and air", "Music and food", "Color and shape", "Trees and birds"],
          "correctAnswerIndex": 0,
          "explanation": "Plants get water from the rain. Plants get air all around them.",
          "learningObjectiveId": "lo-1"
        }
      },
      {
        "pauseAtSeconds": 180,
        "question": {
          "id": "vq3",
          "prompt": "Why is the leaf green?",
          "type": "fill-blank",
          "correctAnswer": "chlorophyll",
          "explanation": "Chlorophyll. It is the green helper inside the leaf.",
          "learningObjectiveId": "lo-2"
        }
      }
    ]
  }
}
```

For Liam (lesson 1), questions are at the same pauseAtSeconds but written at B1 level — e.g., "Identify the molecule responsible for capturing photons in the leaf cell."

---

## 5. `public/seed/lessons-{maya|liam}/{lessonId}-story.json`

**Shape:** `{ generatedAt; content: { initialNode: StoryGameNode; allNodes: Record<string, StoryGameNode> }; version: 1 }`

**Required entries:** 6 files. **Critical for demo** (story is segment 5).

**Maya story (lesson 1) — full skeleton:**

```json
{
  "generatedAt": "2026-05-09T12:02:00Z",
  "version": 1,
  "content": {
    "initialNode": {
      "id": "maya-1-n1",
      "narrative": "Maya walks into her garden one morning. The sun is bright. She sees a small butterfly with a tired wing. The butterfly says, 'My favorite flowers are not happy. Can you help?' Maya looks at the flowers. They are not opening. They look small.",
      "illustrationUrl": "/seed/illustrations/butterflies/garden-tired-butterfly.jpg",
      "illustrationFallbackEmoji": "🌸🦋☀️🌿",
      "isTerminal": false,
      "choices": [
        {
          "text": "Did the flowers get too much sun?",
          "isCorrect": false,
          "learningObjectiveId": "lo-1",
          "nextNodeId": "maya-1-n1",
          "feedbackOnSelect": "Hmm, plants love the sun. Sun makes them happy. The flowers need sun to grow. Try another idea!"
        },
        {
          "text": "Did the flowers need more water?",
          "isCorrect": true,
          "learningObjectiveId": "lo-1",
          "nextNodeId": "maya-1-n2",
          "feedbackOnSelect": ""
        },
        {
          "text": "Did the butterfly do something wrong?",
          "isCorrect": false,
          "learningObjectiveId": "lo-1",
          "nextNodeId": "maya-1-n1",
          "feedbackOnSelect": "Oh no, the butterfly did nothing wrong. Butterflies help flowers. Let's think about what the flowers need."
        }
      ]
    },
    "allNodes": {
      "maya-1-n1": "<see initialNode above>",
      "maya-1-n2": {
        "id": "maya-1-n2",
        "narrative": "Maya gets her watering can. She gives the flowers a long drink. They start to look happier. But there is one more problem. The garden is dark in the corner. There is no sunlight! What can Maya do?",
        "illustrationUrl": "/seed/illustrations/butterflies/watering-flowers.jpg",
        "illustrationFallbackEmoji": "💧🌸🌿😊",
        "isTerminal": false,
        "choices": [
          { "text": "Move the dark flowers into the sun", "isCorrect": true, "nextNodeId": "maya-1-n3", "learningObjectiveId": "lo-1", "feedbackOnSelect": "" },
          { "text": "Sing to the flowers", "isCorrect": false, "nextNodeId": "maya-1-n2", "learningObjectiveId": "lo-1", "feedbackOnSelect": "Singing is sweet, but it does not make food for the flower. The flower needs sun to make food." },
          { "text": "Cover them with leaves to protect them", "isCorrect": false, "nextNodeId": "maya-1-n2", "learningObjectiveId": "lo-1", "feedbackOnSelect": "Covering them blocks the sun. Plants need sun to grow. Try again!" }
        ]
      },
      "maya-1-n3": {
        "id": "maya-1-n3",
        "narrative": "Maya carefully moves the flowers into the sun. Now they have water AND sunlight! The butterfly does a happy dance. 'You helped my friends! What is their secret?' the butterfly asks. Maya says...",
        "illustrationUrl": "/seed/illustrations/butterflies/happy-flowers-sun.jpg",
        "illustrationFallbackEmoji": "🌸☀️🦋💃",
        "isTerminal": false,
        "choices": [
          { "text": "They eat sun, water, and air to make food", "isCorrect": true, "nextNodeId": "maya-1-n4", "learningObjectiveId": "lo-3", "feedbackOnSelect": "" },
          { "text": "They are magic", "isCorrect": false, "nextNodeId": "maya-1-n3", "learningObjectiveId": "lo-3", "feedbackOnSelect": "Plants are amazing but it is not magic — it is photosynthesis! They use sun, water, and air." },
          { "text": "They eat the soil", "isCorrect": false, "nextNodeId": "maya-1-n3", "learningObjectiveId": "lo-3", "feedbackOnSelect": "Plants use the soil to hold their roots. But they do not eat the soil. They use sun, water, and air to make food." }
        ]
      },
      "maya-1-n4": {
        "id": "maya-1-n4",
        "narrative": "The butterfly smiles. 'Photosynthesis. That is a big word for a big idea.' All the flowers in the garden open. The butterfly's friends come back. Maya looks at her drawing of the garden. She is proud. She helped because she learned how plants live.",
        "illustrationUrl": "/seed/illustrations/butterflies/full-garden-bloom.jpg",
        "illustrationFallbackEmoji": "🌸🌼🌺🦋✨",
        "isTerminal": true,
        "choices": []
      }
    }
  }
}
```

**Liam story (lesson 1) — same structure, space station theme:**

- n1: Hydroponics bay alarm. Plants dying. Choices around what to investigate first (light source = correct).
- n2: After fixing light, the plants need water (find the leak in irrigation)
- n3: After fixing water, atmosphere is wrong (CO₂ scrubber needs maintenance)
- n4: Mission accomplished — Liam saved the food supply. Captain commends his use of "photosynthetic principles for life support".

(Amin authors the full Liam story per AM-07 pattern.)

---

## 6. `public/seed/dashboard-{maya|liam}.json`

**Shape:** Same as `get_personalized_dashboard` tool return.

**Required entries:** 2 files.

```json
{
  "studentId": "maya",
  "greeting": "Hi Maya! 🦋 Ready for today's adventure?",
  "todaysRecommendation": {
    "lessonId": "photosynthesis-1",
    "title": "What do plants need?",
    "reason": "You loved the butterfly garden activity. Today's lesson is about how flowers grow!"
  },
  "xp": 240,
  "streakDays": 3,
  "motivationalNudges": [
    "Yesterday you finished 2 activities. Great work!",
    "Try the voice activity today — your tutor wants to hear you!"
  ],
  "themedHeroImageUrl": "/seed/themes/maya-hero.jpg"
}
```

```json
{
  "studentId": "liam",
  "greeting": "Hey Liam! 🚀 Ready for today's mission?",
  "todaysRecommendation": {
    "lessonId": "photosynthesis-1",
    "title": "Plants: The Original Energy Engineers",
    "reason": "Last time you nailed the chemistry quiz. Today we explore how plants pull off the same trick."
  },
  "xp": 720,
  "streakDays": 7,
  "motivationalNudges": [
    "You're on a 7-day streak — keep it going!",
    "Today's story has a Mars colony scenario. Captain mode: engaged."
  ],
  "themedHeroImageUrl": "/seed/themes/liam-hero.jpg"
}
```

---

## 7. `public/seed/themes/`

**Required files:**
- `maya-hero.jpg` — AI-generated, panoramic butterfly garden (1792×1024)
- `liam-hero.jpg` — AI-generated, panoramic space station (1792×1024)
- `butterflies-pattern.svg` — subtle repeating pattern, 200×200 tile
- `starfield-pattern.svg` — subtle starfield dots, 200×200 tile

**Pattern SVGs** are simple — just dots/silhouettes at low opacity. Demi or Akin can produce these in 5 min using SVG tools or AI illustration.

---

## 8. `public/seed/illustrations/`

**Conditional on image gate result.** Required if `NEXT_PUBLIC_IMAGE_MODE=curated`.

**Structure:**
```
illustrations/
├── manifest.json
├── butterflies/
│   ├── 1.jpg ... 30.jpg  (or as many as Amin curates)
├── space/
│   ├── 1.jpg ... 30.jpg
├── soccer/
├── animals/
└── fantasy/
```

**`manifest.json` shape:**
```json
{
  "butterflies": [
    { "path": "/seed/illustrations/butterflies/1.jpg", "tags": ["garden", "monarch", "flowers", "happy"] },
    { "path": "/seed/illustrations/butterflies/2.jpg", "tags": ["watering", "girl", "summer"] }
  ],
  "space": [
    { "path": "/seed/illustrations/space/1.jpg", "tags": ["nebula", "spaceship", "exploration"] }
  ]
}
```

LLM in `generate_story_image` route picks a path by matching scene description to tags.

---

## 9. `public/seed/voice-fallback-{maya|liam}.mp3`

Required files (per AM-09):
- `voice-fallback-maya.mp3` — ~30s, A1 vocab, butterfly theme, "explain back" subtype
- `voice-fallback-liam.mp3` — ~30s, B1 vocab, space theme, "debate" subtype

Played when `NEXT_PUBLIC_VOICE_MODE=simulated` OR live connection fails.

---

## 10. `public/seed/youtube-fallbacks.json`

Always loaded as final fallback when YouTube search fails or is too slow.

```json
{
  "photosynthesis": [
    { "youtubeId": "UPBMG5EYydo", "title": "Photosynthesis | Educational Video for Kids", "channel": "Happy Learning English", "duration": 240, "level": "elementary" },
    { "youtubeId": "D1Ymc311XS8", "title": "Photosynthesis For Kids", "channel": "Peekaboo Kidz", "duration": 312, "level": "elementary" },
    { "youtubeId": "g78utcLQrJ4", "title": "How Do Plants Make Food", "channel": "FuseSchool", "duration": 350, "level": "middle" }
  ]
}
```

**IMPORTANT:** Verify each fallback ID is still publicly available, embeddable, and on a kid-safe channel **the morning of the demo**.

---

## 11. `public/seed/_progress.json` (per-student initial progress)

Optional — provides plausible starting state.

```json
{
  "maya": {
    "studentId": "maya",
    "xp": 240,
    "streakDays": 3,
    "completedActivities": [],
    "quizScores": {},
    "skillMastery": { "reading-comprehension": 35, "vocabulary": 20, "speaking": 15, "writing": 25, "listening": 30 }
  },
  "liam": {
    "studentId": "liam",
    "xp": 720,
    "streakDays": 7,
    "completedActivities": [],
    "quizScores": {},
    "skillMastery": { "reading-comprehension": 75, "vocabulary": 80, "speaking": 70, "writing": 65, "listening": 78, "scientific-reasoning": 72 }
  }
}
```

---

## 12. `public/seed/sfx/` (optional polish)

If time permits (Akin task A-09 polish):
- `correct-butterflies.mp3` — soft chime/twinkle (~1s)
- `correct-space.mp3` — sci-fi blip (~1s)
- `wrong-soft.mp3` — gentle "thunk", NOT a buzzer (~0.5s)

Source: free SFX from Pixabay, Freesound (CC0), or generated via ElevenLabs SFX endpoint.

---

## 13. `_demo-assets/grade3-science-photosynthesis.pdf`

**The demo textbook PDF.** Lives outside `public/seed/` because it's not served — it's just on disk for the upload demo.

Suggested source:
- "Plants — Living Things" unit from OpenStax K-2/3-5 (CC-BY)
- BC Curriculum sample lesson on plants (free PDFs available from BC government)
- Or: any 15-25 page PDF covering Grade 3 plant science. Make sure it's coherent so the Bloom's audit has something real to score.

Do NOT use copyrighted publisher textbooks — keep it clean.

---

## 14. Generation Workflow Summary

| File group | Author | When |
|---|---|---|
| `students.json` | Amin (AM-05) | Morning |
| `courses.json` | Amin (AM-06) | Morning |
| `lessons-*-text.json` | Rishabh via R-03 (live LLM gen, saved as seed) | Morning |
| `lessons-*-video.json` | Rishabh via R-03 (live YT search + LLM Q gen, saved) | Morning |
| `lessons-*-story.json` | Amin authors skeleton (AM-07), Rishabh enriches via LLM | Morning |
| `dashboard-*.json` | Rishabh via R-03 (LLM-generated) | Morning |
| `themes/maya-hero.jpg` + `liam-hero.jpg` | Amin via OpenAI image gen (AM-08) | Morning |
| `themes/*-pattern.svg` | Akin or Demi (5 min each) | Morning |
| `illustrations/*` | Amin (AM-10) — conditional | Morning |
| `voice-fallback-*.mp3` | Amin (AM-09) | Morning |
| `youtube-fallbacks.json` | Rishabh | Overnight (O-12) |
| `_progress.json` | Demi or Amin | Morning |
| `sfx/*` | Optional / polish | Late afternoon |

---

## 15. Validation Schema (zod)

In `shared/lib/seed-schema.ts`:

```typescript
import { z } from 'zod';

export const StudentProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string(),
  grade: z.number().int().min(1).max(12),
  ealLevel: z.enum(['Emerging', 'Developing', 'Proficient', 'Extending']),
  interests: z.array(z.string()).min(1),
  culturalBackground: z.string(),
  learningGoals: z.array(z.string()),
  theme: z.object({
    primaryColor: z.string(),
    accentColor: z.string(),
    backgroundPattern: z.enum(['butterflies','starfield','soccer','ocean','forest','plain']),
    heroImageUrl: z.string().nullable(),
    fontPairing: z.enum(['whimsical','futuristic','classic']).optional(),
  })
});

// ... and so on for Course, Lesson, TextLessonContent, VideoLessonContent, StoryGameNode

export const validateAllSeed = async () => {
  const failures: string[] = [];
  // Iterate all required seed paths, fetch + parse, accumulate failures
  return failures;
};
```

`scripts/validate-seed.ts` runs `validateAllSeed()` and prints a green/red dashboard. Run as part of `npm run check` (Demi task D-12).

---

## 16. Final Seed File Checklist (for Demi's pre-demo-check)

```
public/seed/
├── students.json                    ✓ required
├── courses.json                     ✓ required
├── youtube-fallbacks.json           ✓ required
├── _progress.json                   ✓ required
├── avatars/
│   ├── maya.svg                     ✓ required
│   └── liam.svg                     ✓ required
├── themes/
│   ├── maya-hero.jpg                ✓ required
│   ├── liam-hero.jpg                ✓ required
│   ├── butterflies-pattern.svg      ✓ required
│   └── starfield-pattern.svg        ✓ required
├── lessons-maya/
│   ├── photosynthesis-1-text.json   ✓ required
│   ├── photosynthesis-1-video.json  ✓ required
│   ├── photosynthesis-1-story.json  ✓ required (CRITICAL — full story arc)
│   ├── photosynthesis-2-text.json   ⊙ optional
│   ├── ...
│   └── photosynthesis-3-story.json  ⊙ optional
├── lessons-liam/
│   ├── (same structure as Maya)
├── dashboard-maya.json              ✓ required
├── dashboard-liam.json              ✓ required
├── voice-fallback-maya.mp3          ✓ required (fallback safety)
├── voice-fallback-liam.mp3          ✓ required (fallback safety)
├── illustrations/                   ⊙ conditional (only if image gate failed)
│   └── manifest.json
└── sfx/                              ⊙ optional polish
```

**Minimum viable seed for demo:** 14 required files. Without these the seed-fallback path breaks.
