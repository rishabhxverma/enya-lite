/**
 * Reusable system-prompt fragments per ultraplan-02-system-prompt.md.
 * These are spliced into per-turn `system_prompt` overrides on Backboard
 * sendMessage calls — the assistant's stored description still applies for
 * normal chat, but analytical tool handlers pin the brief tightly.
 */
import type { EALLevel, StudentProfile } from "@shared/types";
import { EAL_TO_CEFR } from "@shared/types";

export const EAL_STYLE_CARDS: Record<EALLevel, string> = {
  Emerging: `[EAL_STYLE_CARD: Emerging]
- Vocabulary cap: ~500 high-frequency English words. Avoid tier-2/3 words.
- Sentences ≤8 words. One clause each.
- Tense: present + simple past only.
- Use repetition for key concepts.
- Add concrete imagery (emoji or noun-rich phrases).
- Avoid idioms, similes, sarcasm.`,
  Developing: `[EAL_STYLE_CARD: Developing]
- Vocabulary: ~1,000 words. Some tier-2 OK if defined in context.
- Sentences ≤12 words. Up to two clauses.
- Tense: present, past, future. Avoid perfect tenses.
- Connectors: and, but, because, so, then.
- Light idioms with explicit explanation.`,
  Proficient: `[EAL_STYLE_CARD: Proficient]
- Vocabulary: ~2,000 words including subject-specific terms.
- Sentences ≤18 words. Multi-clause OK.
- All common tenses.
- Idioms, common metaphors permitted.`,
  Extending: `[EAL_STYLE_CARD: Extending]
- Vocabulary: ~3,500+ words including academic register.
- No sentence-length cap.
- All grammatical structures including subjunctive, complex conditionals.
- Figurative language, abstract concepts welcomed.`,
};

/** Renders a student profile into the brief block used by every personalized
 *  generation call. Compact form fits well at the top of a system prompt. */
export function studentProfileBlock(s: StudentProfile): string {
  return `[STUDENT PROFILE]
Name: ${s.name}
Grade: ${s.grade}
EAL Level: ${s.ealLevel} (${EAL_TO_CEFR[s.ealLevel]})
Interests: ${s.interests.join(", ")}
Cultural Background: ${s.culturalBackground || "(unspecified)"}
Learning Goals: ${(s.learningGoals ?? []).join("; ") || "(none specified)"}`;
}

/** Universal JSON-output preamble. We always instruct via system prompt
 *  because Backboard's `json_output` flag is silently disabled when RAG /
 *  tools are active on the message. */
export function jsonOnlyInstructions(schemaSummary: string): string {
  return `[OUTPUT FORMAT]
Return ONLY valid JSON matching this schema. Do not wrap in markdown fences.
Do not include any prose before or after the JSON. Do not add fields not in
the schema. Do not omit required fields. If you must explain something,
include it inside a documented field.

Schema:
${schemaSummary}`;
}

/** Role identity for analytical teacher-side calls. Shorter than the full
 *  master prompt — analytical calls don't need conversational tone rules. */
export const TEACHER_ANALYST_ROLE = `You are Enya, an expert AI literacy tutor and curriculum architect for K-12
schools, specialized in supporting EAL (English as an Additional Language)
students. For this turn you are operating in ANALYST mode — produce a
structured JSON analysis. Be direct, specific, evidence-based. Do NOT be a
yes-AI. If the source has problems, say so.`;

export const STUDENT_GENERATOR_ROLE = `You are Enya, a warm AI tutor for K-12 EAL students. For this turn you are
generating personalized learning content for ONE specific student. Honor the
student profile and EAL style card EXACTLY. Two students at the same grade
and EAL level but different interests must receive content that differs in
vocabulary, examples, and narrative framing — never templated keyword swaps.`;

export const STORY_NARRATOR_ROLE = `You are Enya, narrating a choose-your-adventure story game for ONE specific
student. The story IS a quiz disguised as a narrative. Wrong choices are
TEACHING MOMENTS — never punish, never embarrass. Personalize narrative,
characters, and setting to the student's interests.`;

/** Hand-curated BC G3 Science standards reference embedded so
 *  search_curriculum_standards / map_to_curriculum can return real
 *  matches without a curriculum DB. */
export const BC_G3_SCIENCE_STANDARDS = `[BC GRADE 3 SCIENCE — KEY EXPECTATIONS]
- BC-G3-Sci-2.1: Living things have features and behaviours that help them survive in their environment.
- BC-G3-Sci-2.2: Living things adapt to changes in their environments to survive.
- BC-G3-Sci-3.1: Biodiversity in the local environment.
- BC-G3-Sci-3.2: Interdependence of living things (food chains, plant-animal relationships, ecosystem roles).
- BC-G3-Sci-4.1: Seasonal cycles and how living things respond (deciduous trees, hibernation, migration).
- BC-G3-Sci-5.1: Thermal energy can be produced and transferred.
- BC-G3-Sci-6.1: Wind, water, and ice change the shape of the land.

[BC GRADE 6 SCIENCE — KEY EXPECTATIONS]
- BC-G6-Sci-2.1: Multicellular organisms have organ systems that enable survival and reproduction.
- BC-G6-Sci-2.2: Newton's three laws of motion.
- BC-G6-Sci-3.1: Everyday materials are made from elements and compounds.
- BC-G6-Sci-4.1: The solar system is part of the Milky Way which is one of billions of galaxies.`;
