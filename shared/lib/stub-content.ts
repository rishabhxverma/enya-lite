/**
 * Realistic-shaped stub content the API routes return when live LLM calls
 * are unavailable. These shapes match the type contracts so the frontend
 * can be developed against them.
 */
import type {
  Course,
  PedagogicalAudit,
  PersonalizedDashboard,
  StoryGameNode,
  StudentAnalytics,
  TextLessonContent,
  VideoLessonContent,
  StudentProfile,
} from "@shared/types";

export const STUB_DOCUMENT_ID = "doc_seed_textbook_photosynthesis";

export const STUB_COURSE_OUTLINE: Course = {
  id: "photosynthesis-101",
  title: "How Plants Make Food",
  topic: "Photosynthesis",
  gradeLevel: 3,
  curriculumStandard:
    "BC Grade 3 Science 2.1 — Living things have features and behaviours that help them survive in their environment",
  textbookDocumentId: STUB_DOCUMENT_ID,
  units: [
    {
      id: "unit-1",
      title: "Plants are amazing food factories",
      description:
        "Students discover that plants make their own food using simple ingredients from their environment.",
      lessons: [
        {
          id: "photosynthesis-1",
          title: "What do plants need?",
          learningObjectives: [
            "Students will identify the four things plants need to grow: sunlight, water, air, and soil",
            "Students will describe what happens to a plant when one of these is missing",
            "Students will use the word 'photosynthesis' to name the process",
          ],
          activities: [
            { type: "text", id: "photosynthesis-1-text", status: "available" },
            {
              type: "video",
              id: "photosynthesis-1-video",
              status: "available",
            },
            {
              type: "voice",
              id: "photosynthesis-1-voice",
              status: "available",
              activitySubtype: "explain-back",
            },
            {
              type: "story",
              id: "photosynthesis-1-story",
              status: "available",
              theme: "personalized",
            },
          ],
        },
        {
          id: "photosynthesis-2",
          title: "Inside a leaf: tiny food factories",
          learningObjectives: [
            "Students will identify chlorophyll as the green substance that captures sunlight",
            "Students will describe the leaf as the location where photosynthesis happens",
            "Students will explain why most leaves are green",
          ],
          activities: [
            { type: "text", id: "photosynthesis-2-text", status: "locked" },
            { type: "video", id: "photosynthesis-2-video", status: "locked" },
            {
              type: "voice",
              id: "photosynthesis-2-voice",
              status: "locked",
              activitySubtype: "comprehension",
            },
            {
              type: "story",
              id: "photosynthesis-2-story",
              status: "locked",
              theme: "personalized",
            },
          ],
        },
        {
          id: "photosynthesis-3",
          title: "Why plants matter for everyone",
          learningObjectives: [
            "Students will explain that plants make oxygen as a byproduct of photosynthesis",
            "Students will describe how animals (including humans) depend on plants",
            "Students will give one example of how to take care of plants",
          ],
          activities: [
            { type: "text", id: "photosynthesis-3-text", status: "locked" },
            { type: "video", id: "photosynthesis-3-video", status: "locked" },
            {
              type: "voice",
              id: "photosynthesis-3-voice",
              status: "locked",
              activitySubtype: "debate",
            },
            {
              type: "story",
              id: "photosynthesis-3-story",
              status: "locked",
              theme: "personalized",
            },
          ],
        },
      ],
    },
  ],
};

export const STUB_AUDIT: PedagogicalAudit = {
  blooms: {
    score: 72,
    distribution: {
      remember: 32,
      understand: 28,
      apply: 18,
      analyze: 12,
      evaluate: 6,
      create: 4,
    },
    comment:
      "Solid focus on Remember/Understand. Could push more Apply and Analyze tasks for stronger transfer.",
  },
  scaffolding: {
    score: 78,
    comment:
      "Concepts are introduced before being used. The chlorophyll discussion would benefit from a labelled diagram earlier.",
  },
  vocabularyLoad: {
    score: 64,
    tierDistribution: { tier1: 64, tier2: 28, tier3: 8 },
    comment:
      "Slightly heavy on tier-3 words for Grade 3 EAL Emerging students. Consider preteaching 6 key terms.",
  },
  culturalSensitivity: {
    score: 58,
    flags: [
      "Multiple baseball-stadium analogies — unfamiliar for newcomer learners.",
      "Family example assumes a single-family-home context.",
    ],
    comment:
      "Replace narrow examples with universal alternatives (e.g., shared community gardens, multi-generational households).",
  },
  curriculumAlignment: {
    score: 84,
    matches: [
      {
        standard: "BC Grade 3 Science 2.1",
        lesson: "What do plants need?",
        rationale:
          "Students explicitly identify the inputs and outputs of photosynthesis through guided observation.",
      },
      {
        standard: "BC Grade 3 Science 3.2",
        lesson: "Why plants matter for everyone",
        rationale:
          "Discusses interdependence between plants and humans/animals.",
      },
    ],
    gaps: [
      "No coverage of seasonal variation despite curriculum expectation 4.1.",
    ],
  },
  recommendations: [
    {
      priority: "high",
      description: "Replace baseball examples with universal contexts.",
      suggestedAction:
        "Swap 'stadium concourse' analogy with 'community garden' for newcomer-friendliness.",
    },
    {
      priority: "high",
      description: "Preteach 6 tier-2/3 vocabulary items before Lesson 2.",
      suggestedAction:
        "Add a 'Word wall' insert with chlorophyll, glucose, oxygen, carbon dioxide, absorb, release.",
    },
    {
      priority: "medium",
      description: "Add Apply-level activity to Lesson 1.",
      suggestedAction:
        "Insert a hands-on 'sun vs shade' plant observation between text and video activities.",
    },
    {
      priority: "low",
      description: "Address seasonal variation gap.",
      suggestedAction:
        "Add a 1-paragraph aside in Lesson 3 about deciduous trees.",
    },
  ],
};

export const STUB_DASHBOARDS: Record<string, PersonalizedDashboard> = {
  maya: {
    studentId: "maya",
    greeting: "Hi Maya! 🦋 Ready for today's adventure?",
    todaysRecommendation: {
      lessonId: "photosynthesis-1",
      title: "What do plants need?",
      reason:
        "You loved the butterfly garden activity. Today's lesson is about how flowers grow!",
    },
    xp: 240,
    streakDays: 3,
    motivationalNudges: [
      "Yesterday you finished 2 activities. Great work!",
      "Try the voice activity today — your tutor wants to hear you!",
    ],
    themedHeroImageUrl: "/seed/themes/maya-hero.jpg",
  },
  liam: {
    studentId: "liam",
    greeting: "Hey Liam! 🚀 Ready for today's mission?",
    todaysRecommendation: {
      lessonId: "photosynthesis-1",
      title: "Plants: The Original Energy Engineers",
      reason:
        "Last time you nailed the chemistry quiz. Today we explore how plants pull off the same trick.",
    },
    xp: 720,
    streakDays: 7,
    motivationalNudges: [
      "You're on a 7-day streak — keep it going!",
      "Today's story has a Mars colony scenario. Captain mode: engaged.",
    ],
    themedHeroImageUrl: "/seed/themes/liam-hero.jpg",
  },
};

export const STUB_TEXT_LESSONS: Record<
  string,
  Record<string, TextLessonContent>
> = {
  maya: {
    "photosynthesis-1": {
      studentId: "maya",
      lessonId: "photosynthesis-1",
      title: "How Plants Eat Sunlight",
      bodyMarkdown: `## A butterfly's secret

When a butterfly drinks from a flower, the flower gives sweet juice. But how does the flower make this juice?

The flower uses **sunlight**! Plants make their own food. They are amazing.

## What plants need

Plants need four things. They are:

- **Sun** ☀️ (for light)
- **Water** 💧 (from rain)
- **Air** 💨 (we cannot see it)
- **Soil** 🌱 (for their roots)

When a plant has all four, it grows big.

## A new word: photosynthesis

The big word is **photosynthesis**.

It sounds hard but it is simple. The plant makes food from sun, water, and air. That is photosynthesis.

Butterflies love plants. Plants need sun. Now you know!`,
      diagrams: [
        {
          caption: "Plants need four things to grow",
          emojiArt: "☀️  +  💧  +  💨  +  🌱  →  🌸",
        },
      ],
      comprehensionQuestions: [
        {
          id: "q1",
          prompt: "What helps the plant the most?",
          type: "multiple-choice",
          options: ["The sun", "The moon", "The wind", "The night"],
          correctAnswerIndex: 0,
          explanation: "Yes! The sun gives light. Plants need light to make food.",
          learningObjectiveId: "lo-1",
        },
        {
          id: "q2",
          prompt: "What is the big word for how plants make food?",
          type: "fill-blank",
          correctAnswer: "photosynthesis",
          explanation:
            "Photosynthesis. Plants use sun, water, and air to make food.",
          learningObjectiveId: "lo-3",
        },
        {
          id: "q3",
          prompt: "True or false: Plants can grow without water.",
          type: "true-false",
          correctAnswer: "false",
          explanation:
            "False. Plants need water. Without water they cannot live.",
          learningObjectiveId: "lo-1",
        },
      ],
    },
  },
  liam: {
    "photosynthesis-1": {
      studentId: "liam",
      lessonId: "photosynthesis-1",
      title: "Plants: The Original Energy Engineers",
      bodyMarkdown: `## Engineering with sunlight

Long before astronauts figured out how to grow food on a space station, plants had perfected a process humans still can't fully replicate. Plants are bio-chemical engineers — and their fuel is sunlight.

## The four inputs

Every plant operates on four resources working together:

- **Solar energy** ☀️ — captured by green chlorophyll molecules
- **Water** 💧 — pulled up from the roots
- **Carbon dioxide** 💨 — absorbed from the air
- **Soil nutrients** 🌱 — providing trace minerals

Missing any one and the plant's energy production halts. It's basically a self-sustaining solar plant — no batteries required.

## Photosynthesis: the chemistry

The formal name for this process is **photosynthesis**. Inside leaf cells, chlorophyll converts solar photons into chemical energy, splitting water molecules and recombining the products with carbon dioxide to form glucose. Oxygen is released as a byproduct — the air you're breathing right now was likely produced by a plant.

If you ever design a Mars colony, plants are doing more than feeding the crew — they're keeping the atmosphere breathable.`,
      diagrams: [
        {
          caption:
            "Photosynthesis is a chemical conversion: light + water + CO₂ → glucose + O₂",
          emojiArt: "☀️ + 💧 + 💨  →  🍇 + 🫧",
        },
      ],
      comprehensionQuestions: [
        {
          id: "q1",
          prompt: "Which molecule captures solar energy inside the leaf?",
          type: "multiple-choice",
          options: ["Glucose", "Chlorophyll", "Carbon dioxide", "Mitochondria"],
          correctAnswerIndex: 1,
          explanation:
            "Correct — chlorophyll absorbs photons and kicks off the chemical conversion.",
          learningObjectiveId: "lo-1",
        },
        {
          id: "q2",
          prompt: "What gas is released as a byproduct of photosynthesis?",
          type: "fill-blank",
          correctAnswer: "oxygen",
          explanation:
            "Oxygen. Plants exchange CO₂ for O₂ — making them critical for breathable atmospheres.",
          learningObjectiveId: "lo-3",
        },
        {
          id: "q3",
          prompt:
            "True or false: Plants could survive on a Mars colony with only soil and water — no sunlight needed.",
          type: "true-false",
          correctAnswer: "false",
          explanation:
            "False. Without solar energy or artificial light, photosynthesis cannot occur.",
          learningObjectiveId: "lo-2",
        },
      ],
    },
  },
};

export const STUB_VIDEO_LESSONS: Record<
  string,
  Record<string, VideoLessonContent>
> = {
  maya: {
    "photosynthesis-1": {
      studentId: "maya",
      lessonId: "photosynthesis-1",
      youtubeId: "UPBMG5EYydo",
      title: "How Plants Make Food",
      overlayQuestions: [
        {
          pauseAtSeconds: 30,
          question: {
            id: "vq1",
            prompt: "What did the plant just need from the sun?",
            type: "multiple-choice",
            options: ["Light", "Sound", "A song", "Wind"],
            correctAnswerIndex: 0,
            explanation: "The sun gives light. Plants use light to make food.",
            learningObjectiveId: "lo-1",
          },
        },
        {
          pauseAtSeconds: 90,
          question: {
            id: "vq2",
            prompt: "What two things does the plant get from rain and air?",
            type: "multiple-choice",
            options: [
              "Water and air",
              "Music and food",
              "Color and shape",
              "Trees and birds",
            ],
            correctAnswerIndex: 0,
            explanation:
              "Plants get water from the rain. Plants get air all around them.",
            learningObjectiveId: "lo-1",
          },
        },
        {
          pauseAtSeconds: 180,
          question: {
            id: "vq3",
            prompt: "Why is the leaf green?",
            type: "fill-blank",
            correctAnswer: "chlorophyll",
            explanation: "Chlorophyll. It is the green helper inside the leaf.",
            learningObjectiveId: "lo-2",
          },
        },
      ],
    },
  },
  liam: {
    "photosynthesis-1": {
      studentId: "liam",
      lessonId: "photosynthesis-1",
      youtubeId: "UPBMG5EYydo",
      title: "How Plants Make Food",
      overlayQuestions: [
        {
          pauseAtSeconds: 30,
          question: {
            id: "vq1",
            prompt: "What form of energy is the plant capturing right now?",
            type: "multiple-choice",
            options: [
              "Solar (light) energy",
              "Sound energy",
              "Mechanical energy",
              "Electrical energy",
            ],
            correctAnswerIndex: 0,
            explanation:
              "Correct — chlorophyll converts solar energy into chemical energy.",
            learningObjectiveId: "lo-1",
          },
        },
        {
          pauseAtSeconds: 90,
          question: {
            id: "vq2",
            prompt: "What two raw materials are entering the leaf in this scene?",
            type: "multiple-choice",
            options: [
              "Water and carbon dioxide",
              "Glucose and oxygen",
              "Nitrogen and hydrogen",
              "Methane and water",
            ],
            correctAnswerIndex: 0,
            explanation:
              "Water from the roots and CO₂ from the air — the inputs to the photosynthesis equation.",
            learningObjectiveId: "lo-1",
          },
        },
        {
          pauseAtSeconds: 180,
          question: {
            id: "vq3",
            prompt:
              "Identify the molecule responsible for capturing photons in the leaf cell.",
            type: "fill-blank",
            correctAnswer: "chlorophyll",
            explanation:
              "Chlorophyll absorbs primarily red and blue wavelengths, reflecting green — which is why leaves look green.",
            learningObjectiveId: "lo-2",
          },
        },
      ],
    },
  },
};

export const STUB_STORY_NODE_MAYA: StoryGameNode = {
  id: "maya-1-n1",
  narrative:
    "Maya walks into her garden one morning. The sun is bright. She sees a small butterfly with a tired wing. The butterfly says, 'My favorite flowers are not happy. Can you help?' Maya looks at the flowers. They are not opening. They look small.",
  illustrationUrl: "/seed/illustrations/butterflies/garden-tired-butterfly.jpg",
  illustrationFallbackEmoji: "🌸🦋☀️🌿",
  isTerminal: false,
  choices: [
    {
      text: "Did the flowers get too much sun?",
      isCorrect: false,
      learningObjectiveId: "lo-1",
      nextNodeId: "maya-1-n1",
      feedbackOnSelect:
        "Hmm, plants love the sun. Sun makes them happy. The flowers need sun to grow. Try another idea!",
    },
    {
      text: "Did the flowers need more water?",
      isCorrect: true,
      learningObjectiveId: "lo-1",
      nextNodeId: "maya-1-n2",
      feedbackOnSelect: "",
    },
    {
      text: "Did the butterfly do something wrong?",
      isCorrect: false,
      learningObjectiveId: "lo-1",
      nextNodeId: "maya-1-n1",
      feedbackOnSelect:
        "Oh no, the butterfly did nothing wrong. Butterflies help flowers. Let's think about what the flowers need.",
    },
  ],
};

export const STUB_STORY_NODE_LIAM: StoryGameNode = {
  id: "liam-1-n1",
  narrative:
    "Captain Liam, the hydroponics bay alarm just sounded. The plants in Pod 3 are wilting and the algorithm can't pinpoint the cause. Crew is looking to you. The diagnostic panel shows four subsystems. What's the first thing to check?",
  illustrationUrl: "/seed/illustrations/space/hydroponics-alarm.jpg",
  illustrationFallbackEmoji: "🚀🛰️🌱🚨",
  isTerminal: false,
  choices: [
    {
      text: "Verify the grow-light array is operating at full intensity",
      isCorrect: true,
      learningObjectiveId: "lo-1",
      nextNodeId: "liam-1-n2",
      feedbackOnSelect: "",
    },
    {
      text: "Pump up the music in the bay",
      isCorrect: false,
      learningObjectiveId: "lo-1",
      nextNodeId: "liam-1-n1",
      feedbackOnSelect:
        "Good captain instinct, but plants don't respond to audio. Energy comes from light — that's the chlorophyll's input.",
    },
    {
      text: "Lock down the door to the bay",
      isCorrect: false,
      learningObjectiveId: "lo-1",
      nextNodeId: "liam-1-n1",
      feedbackOnSelect:
        "Door locks won't affect photosynthesis. The plants need their inputs — start with the energy source.",
    },
    {
      text: "Reroute oxygen to the engine room",
      isCorrect: false,
      learningObjectiveId: "lo-1",
      nextNodeId: "liam-1-n1",
      feedbackOnSelect:
        "Counterproductive — plants RELEASE oxygen as a byproduct, they need CO₂ as input. Try the energy source first.",
    },
  ],
};

export const STUB_ANALYTICS: Record<string, StudentAnalytics> = {
  maya: {
    studentId: "maya",
    quizAverage: 72,
    timeSpentMinutes: 145,
    ealTrend: "up",
    skillRadar: [
      { skill: "Reading", mastery: 38 },
      { skill: "Vocabulary", mastery: 24 },
      { skill: "Speaking", mastery: 18 },
      { skill: "Writing", mastery: 28 },
      { skill: "Listening", mastery: 33 },
    ],
    activityHistory: [
      { date: "2026-05-04", activitiesCompleted: 1 },
      { date: "2026-05-05", activitiesCompleted: 2 },
      { date: "2026-05-06", activitiesCompleted: 0 },
      { date: "2026-05-07", activitiesCompleted: 2 },
      { date: "2026-05-08", activitiesCompleted: 1 },
    ],
  },
  liam: {
    studentId: "liam",
    quizAverage: 88,
    timeSpentMinutes: 312,
    ealTrend: "up",
    skillRadar: [
      { skill: "Reading", mastery: 78 },
      { skill: "Vocabulary", mastery: 82 },
      { skill: "Speaking", mastery: 71 },
      { skill: "Writing", mastery: 67 },
      { skill: "Listening", mastery: 80 },
      { skill: "Sci-Reasoning", mastery: 75 },
    ],
    activityHistory: [
      { date: "2026-05-04", activitiesCompleted: 3 },
      { date: "2026-05-05", activitiesCompleted: 4 },
      { date: "2026-05-06", activitiesCompleted: 2 },
      { date: "2026-05-07", activitiesCompleted: 3 },
      { date: "2026-05-08", activitiesCompleted: 4 },
    ],
  },
};

export function stubDashboardForStudent(
  student: StudentProfile | null
): PersonalizedDashboard {
  if (!student) return STUB_DASHBOARDS.maya;
  if (STUB_DASHBOARDS[student.id]) return STUB_DASHBOARDS[student.id];
  return {
    studentId: student.id,
    greeting: `Hi ${student.name}! Ready for today's adventure?`,
    todaysRecommendation: {
      lessonId: "photosynthesis-1",
      title: "What do plants need?",
      reason: `Today's lesson connects to your interest in ${student.interests[0] ?? "learning"}.`,
    },
    xp: 100,
    streakDays: 1,
    motivationalNudges: [`Welcome, ${student.name}! Let's start with one short activity today.`],
    themedHeroImageUrl: student.theme.heroImageUrl,
  };
}
