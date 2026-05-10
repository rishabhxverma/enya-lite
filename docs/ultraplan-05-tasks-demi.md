# Ultraplan 05 — Demi's Tasks (Backend / State / Performance / Testing)

> **Role:** Owns client state architecture, service layer, progress/quiz logic, performance, and the one critical test (L4 personalization differential).
> **You DO:** Zustand stores, services, persistence helpers, completion/grading logic, the differential snapshot test, performance audits.
> **You DON'T:** UI components (Akin), Backboard integration internals (Rishabh), system prompt (Amin).

---

## ⚠️ Demi unavailable — task redistribution

Demi can't make it. Of his 13 tasks, **9 were front-loaded into the overnight session** and are already done. The remaining 4 are split between Rishabh, Akin, and Amin.

| Task | Status | New owner | Notes |
|---|---|---|---|
| D-01 RoleStore | ✅ DONE overnight | — | `shared/stores/role-store.ts` |
| D-02 StudentStore | ✅ DONE overnight | — | `shared/stores/student-store.ts` (hydrates from `/seed/students.json`) |
| D-03 ProgressStore | ✅ DONE overnight | — | `shared/stores/progress-store.ts` (XP, streak, completed activities, mastery, persisted to localStorage) |
| D-04 ThreadStore | ✅ DONE overnight | — | `shared/stores/thread-store.ts` (sessionStorage + getOrCreate dedup) |
| D-05 Service layer | ✅ DONE overnight | — | `shared/services/{backboard,teacher,student}-service.ts` |
| D-06a Seed-fallback loader (server) | ✅ DONE overnight | — | `shared/lib/seed-loader.ts` reads `public/seed/*.json` from API routes |
| **D-06b Seed-fallback runtime toggle (client)** | ⏳ **Rishabh** | Rishabh | `localStorage.USE_SEED_FALLBACK='true'` should make every client service hit `/seed/*.json` directly. Demo escape hatch. ~20 min. |
| D-07 Grading + completion | ✅ DONE overnight | — | `shared/lib/grading.ts` — Levenshtein-tolerant fill-blank, multiple-choice, true-false, completion rules per activity type |
| D-08 L4 differential test | ✅ DONE overnight | — | `npm run demo:l4` prints terminal proof. Currently 70.8% Levenshtein delta (>40% threshold). |
| **D-09 SWR caching hooks** | ⏳ **Rishabh** | Rishabh | Wrap `useDashboard`, `useCourse`, `useProgress` so flipping Maya↔Liam doesn't re-hit endpoints. ~25 min. |
| **D-10 Performance audit** | ⏳ **split Akin + Amin** | Akin (visual) + Amin (verification) | **Akin:** image preload `<link>`, add `width`/`height` to `<img>`, kill CLS, ensure motion doesn't re-render ancestors (~25 min). **Amin:** run Lighthouse during AM-11 rehearsal, flag any score <70 to Akin/Rishabh. |
| D-11 Health banner | ✅ DONE overnight | — | `features/health-banner/health-banner.tsx` polls `/api/health` every 30s |
| D-12 Pre-demo smoke script | ✅ DONE overnight | — | `npm run check` — 20-pt readiness check |
| D-12 ownership transfer | ⏳ **Amin** | Amin | Adopt `npm run check` as part of AM-11 / AM-12 rehearsal warm-up. Just needs a human to commit to running it. |
| **D-13 Final test pass + demo standby** | ⏳ **Rishabh** | Rishabh | Sit next to Amin during rehearsals, fix bugs live. ~60 min spread across afternoon. |

**Net effect:** Rishabh picks up ~105 min of additional work (D-06b + D-09 + D-13). Akin picks up ~25 min (D-10 visual half). Amin adds verification duties to his rehearsal flow (no new coding).

The original Demi spec sections below remain as reference — they document what was built and where, plus the remaining task definitions for the new owners.

---

## Reading Order
1. `ultraplan-00-architecture.md` — particularly §5 (data model), §10 (filesystem)
2. This file
3. `ultraplan-02-system-prompt.md` §3 (tool schemas — these are your service contracts)
4. `ultraplan-08-seed-data.md`

---

## Pre-flight (5 min)
1. Pull latest. Verify overnight scaffold built (`npm run dev` works).
2. Confirm `shared/stores/` has 4 skeleton files from O-13.
3. Confirm `shared/types/index.ts` has all types from architecture §5.

---

## Task D-01 — RoleStore (15 min, t=0:00–0:15)

**Objective:** Single source of truth for "who is the demo presenter currently impersonating".

**Files to modify:**
- `shared/stores/role-store.ts`

**Spec:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'teacher' | 'student';

interface RoleState {
  role: Role;
  currentStudentId: string | null;
  setRole: (role: Role) => void;
  setStudent: (id: string | null) => void;
  // Computed
  effectiveTarget: () => 'teacher' | { type: 'student'; id: string };
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      role: 'teacher',
      currentStudentId: null,
      setRole: (role) => set({ role, currentStudentId: role === 'student' ? get().currentStudentId ?? 'maya' : null }),
      setStudent: (id) => set({ role: 'student', currentStudentId: id }),
      effectiveTarget: () => {
        const s = get();
        return s.role === 'teacher' ? 'teacher' : { type: 'student', id: s.currentStudentId ?? 'maya' };
      },
    }),
    { name: 'enya-role' }
  )
);
```

**Acceptance:** Switching roles persists across page reloads (localStorage).

**Demo criticality:** Must Have

---

## Task D-02 — StudentStore (20 min, t=0:15–0:35)

**Objective:** Hydrates student profiles from `public/seed/students.json` on init; provides lookup + creation actions.

**Files to modify:**
- `shared/stores/student-store.ts`

**Spec:**
```typescript
interface StudentState {
  students: StudentProfile[];
  hydrate: () => Promise<void>;        // fetch /seed/students.json on mount
  getById: (id: string) => StudentProfile | undefined;
  addStudent: (profile: Omit<StudentProfile, 'id'>) => StudentProfile;
  updateStudent: (id: string, patch: Partial<StudentProfile>) => void;
}
```

- `addStudent` generates id as kebab-case of name.
- `hydrate` is idempotent (skip if students already loaded).

**Acceptance:** Maya + Liam profiles loaded on app boot. Calling `getById('maya')` returns full profile.

**Demo criticality:** Must Have

---

## Task D-03 — ProgressStore (30 min, t=0:35–1:05)

**Objective:** Track XP, streaks, completed activities, quiz scores, skill mastery — per student.

**Files to modify:**
- `shared/stores/progress-store.ts`

**Spec:**
```typescript
interface ProgressState {
  progressByStudent: Record<string, StudentProgress>;
  hydrate: () => void;                  // load from localStorage
  getProgress: (studentId: string) => StudentProgress;
  markActivityComplete: (studentId: string, activityId: string) => void;
  awardXp: (studentId: string, amount: number) => void;
  recordQuizScore: (studentId: string, quizId: string, scorePct: number) => void;
  updateSkillMastery: (studentId: string, skillId: string, delta: number) => void; // clamp 0-100
  resetStudent: (studentId: string) => void;
}
```

- Use `persist` middleware so progress survives reloads.
- Default progress for new student: `{ xp: 0, streakDays: 0, completedActivities: [], quizScores: {}, skillMastery: {} }`.
- Streak calculation: NOT computed real-time (hackathon shortcut). Pre-set in seed: Maya=3 days, Liam=7 days. Demo presenter manually triggers a "streak +1" toast on demand to show the gamification works.

**Acceptance:** Completing an activity in the UI updates the store; XP increments visible in dashboard quick stats; persists across reloads.

**Demo criticality:** Must Have

---

## Task D-04 — ThreadStore (15 min, t=1:05–1:20)

**Objective:** Manage Backboard thread IDs keyed by context.

**Files to modify:**
- `shared/stores/thread-store.ts`

**Spec:**
```typescript
type ThreadKey = string; // e.g., 'teacher-main', 'student-maya-main', 'student-liam-story-photo-1'

interface ThreadState {
  threads: Record<ThreadKey, string>; // key → backboard thread id
  getOrCreate: (key: ThreadKey) => Promise<string>; // creates new thread via API if missing
  reset: (key: ThreadKey) => void;
  clearAll: () => void;
}
```

- `getOrCreate`: returns existing thread id, OR POSTs to `/api/backboard/thread` to create one and store the result.
- Persisted in sessionStorage (NOT localStorage — fresh threads each demo session).

**Acceptance:** Calling `getOrCreate('teacher-main')` twice returns same id without two API calls.

**Demo criticality:** Must Have

---

## Task D-05 — Service Layer (60 min, t=1:20–2:20)

**Objective:** Thin client-side services that wrap the Next.js API routes. UI components only call services, never `fetch` directly.

**Files to create:**
- `shared/services/backboard-service.ts`
- `shared/services/teacher-service.ts`
- `shared/services/student-service.ts`
- `shared/services/progress-service.ts`
- `shared/services/voice-service.ts`

**Spec:**

`backboardService`:
```typescript
export const backboardService = {
  createThread: () => post<{id: string}>('/api/backboard/thread', {}),
  sendMessage: (params: SendMessageParams) => post<MessageResponse>('/api/backboard/message', params),
  uploadDocument: (file: File) => uploadFile<{documentId: string; pageCount: number}>('/api/backboard/upload-document', file),
};
```

`teacherService`:
```typescript
export const teacherService = {
  parseDocument: (uploadId, fileName) => post('/api/teacher/parse-document', { uploadId, fileName }),
  generateCourseOutline: (input) => post('/api/teacher/generate-course-outline', input),
  audit: (input) => post('/api/teacher/audit-content', input),
  adjustEal: (input) => post('/api/teacher/adjust-eal', input),
  searchCurriculum: (input) => post('/api/teacher/search-curriculum', input),
  // ... all 15 teacher tools
};
```

`studentService`:
```typescript
export const studentService = {
  getDashboard: (studentId) => post('/api/student/dashboard', { studentId }),
  generateTextLesson: (input) => post('/api/student/generate-text-lesson', input),
  searchYoutube: (input) => post('/api/student/search-youtube', input),
  generateVideoQuestions: (input) => post('/api/student/generate-video-questions', input),
  generateStoryNode: (input) => post('/api/student/generate-story-node', input),
  generateStoryImage: (input) => post('/api/student/generate-story-image', input),
  submitQuizAnswer: (input) => post('/api/student/submit-quiz-answer', input),
  getProgress: (studentId) => post('/api/student/progress', { studentId }),
  runPlacementQuiz: (input) => post('/api/student/placement-quiz', input),
  getVoiceSession: (input) => post('/api/student/voice-session', input),
};
```

`progressService` (server-less wrapper, just bridges to ProgressStore + handles seed fallback):
```typescript
export const progressService = {
  loadFromSeed: async (studentId) => {
    const data = await fetch(`/seed/lessons-${studentId}/_progress.json`).then(r => r.json()).catch(() => null);
    if (data) useProgressStore.getState().hydrateForStudent(studentId, data);
  },
};
```

**Implementation notes:**
- All `post()` helpers wrap fetch with: timeout 30s (Backboard generation can be slow), retries 1x on 5xx, returns parsed JSON.
- All return shapes typed against `ultraplan-02-system-prompt.md` §3 tool returns.
- Use `zod.parse()` on each response — log warning on schema mismatch but return raw data so UI doesn't break.

**Acceptance:**
- Calling `studentService.getDashboard('maya')` returns shaped data.
- Schema-mismatched responses logged but not thrown.

**Demo criticality:** Must Have

---

## Task D-06 — Seed-Fallback Loader (30 min, t=2:20–2:50)

**Objective:** When `NEXT_PUBLIC_USE_SEED_FALLBACK=true` (or specific endpoint flagged), services return seed data instead of hitting APIs.

**Files to modify:**
- `shared/services/seed-loader.ts` (NEW)
- All services (add fallback check)

**Spec:**
```typescript
export const seedLoader = {
  isEnabled: () => process.env.NEXT_PUBLIC_USE_SEED_FALLBACK === 'true',
  getTextLesson: (studentId, lessonId) =>
    fetch(`/seed/lessons-${studentId}/${lessonId}-text.json`).then(r => r.json()).then(d => d.content),
  getVideoLesson: (studentId, lessonId) =>
    fetch(`/seed/lessons-${studentId}/${lessonId}-video.json`).then(r => r.json()).then(d => d.content),
  getStoryGameSeed: (studentId, lessonId) =>
    fetch(`/seed/lessons-${studentId}/${lessonId}-story.json`).then(r => r.json()).then(d => d.content),
  getDashboard: (studentId) =>
    fetch(`/seed/dashboard-${studentId}.json`).then(r => r.json()),
  // ...
};
```

In each service method:
```typescript
export const studentService = {
  generateTextLesson: async (input) => {
    if (seedLoader.isEnabled()) return seedLoader.getTextLesson(input.studentId, input.lessonId);
    return post('/api/student/generate-text-lesson', input);
  },
  // ...
};
```

**Acceptance:**
- Setting `NEXT_PUBLIC_USE_SEED_FALLBACK=true` and reloading: every page loads from seed in <500ms.
- Demo presenter can flip the flag mid-session via console: `window.localStorage.setItem('USE_SEED_FALLBACK','true')` (add a runtime override too).

**Demo criticality:** Must Have (this is our resilience layer)

---

## Task D-07 — Quiz Grading Logic + Activity Completion State Machine (45 min, t=2:50–3:35)

**Objective:** Centralize the rules for "what counts as completing an activity".

**Files to create:**
- `shared/lib/grading.ts`
- `shared/lib/activity-completion.ts`

**Spec:**

`grading.ts`:
```typescript
export function gradeAnswer(question: QuizQuestion, answer: string | number): GradeResult {
  switch (question.type) {
    case 'multiple-choice':
      return { correct: answer === question.correctAnswerIndex, ... };
    case 'true-false':
      return { correct: answer === question.correctAnswer, ... };
    case 'fill-blank':
      // tolerant matching — lowercase, trim, allow misspellings via Levenshtein < 2
      const norm = (s: string) => s.toString().trim().toLowerCase();
      return { correct: levenshtein(norm(answer), norm(question.correctAnswer!)) < 2, ... };
  }
}

export function levenshtein(a: string, b: string): number { /* standard impl */ }
```

`activity-completion.ts`:
```typescript
export const COMPLETION_RULES: Record<ActivityType, CompletionRule> = {
  text:  { type: 'comprehension-threshold', minCorrect: 2, total: 3 },
  video: { type: 'all-overlay-answered-and-90pct-watched' },
  voice: { type: 'session-ended-cleanly', minDurationSec: 60 },
  story: { type: 'reached-terminal-node' },
};

export function isActivityComplete(activity: Activity, telemetry: ActivityTelemetry): boolean {
  // dispatch on COMPLETION_RULES[activity.type]
}
```

**Acceptance:**
- Grading "photosynthsis" against "photosynthesis" returns `correct: true` (Levenshtein 1).
- Activity completion correctly evaluates each type.

**Demo criticality:** Must Have

---

## Task D-08 — L4 Personalization Differential Snapshot Test (30 min, t=3:35–4:05) ⚠️ THE ONE TEST WE WRITE

**Objective:** Prove that L4 personalization is real — Maya's content vs Liam's content for the same lesson must differ substantially. This test will be DEMOED to judges via terminal output.

**Files to create:**
- `tests/l4-differential.test.ts`
- `scripts/run-l4-diff.ts` (callable from terminal for live demo)

**Spec:**
```typescript
import { describe, it, expect } from 'vitest';
import { studentService } from '@shared/services/student-service';

const LESSONS = ['photosynthesis-1', 'photosynthesis-2', 'photosynthesis-3'];

describe('L4 personalization differential', () => {
  for (const lessonId of LESSONS) {
    it(`Maya and Liam get visibly different content for ${lessonId}`, async () => {
      const [maya, liam] = await Promise.all([
        studentService.generateTextLesson({ studentId: 'maya', lessonId, topic: 'photosynthesis', learningObjectives: [] }),
        studentService.generateTextLesson({ studentId: 'liam', lessonId, topic: 'photosynthesis', learningObjectives: [] }),
      ]);
      const dist = levenshtein(maya.bodyMarkdown, liam.bodyMarkdown);
      const ratio = dist / Math.max(maya.bodyMarkdown.length, liam.bodyMarkdown.length);
      console.log(`[${lessonId}] differential ratio: ${(ratio*100).toFixed(1)}%`);
      expect(ratio).toBeGreaterThan(0.4);
      // Also verify interest tokens
      expect(maya.bodyMarkdown.toLowerCase()).toContain('butter');
      expect(liam.bodyMarkdown.toLowerCase()).toMatch(/(space|rocket|star)/);
    });
  }
});
```

`scripts/run-l4-diff.ts` (demo helper):
```typescript
// Pretty-prints side-by-side comparison for judges
import { generateMaya, generateLiam } from './...';
console.log('━'.repeat(80));
console.log('L4 PERSONALIZATION PROOF — Photosynthesis lesson, same topic, two students');
console.log('━'.repeat(80));
console.log('\n📚 MAYA (Grade 3, Emerging A1, butterflies):\n');
console.log(maya.bodyMarkdown.substring(0, 500) + '...');
console.log('\n🚀 LIAM (Grade 6, Proficient B1, space):\n');
console.log(liam.bodyMarkdown.substring(0, 500) + '...');
console.log('\n📊 DIFFERENTIAL: ' + ratio + '% — content is unique per student');
```

**Acceptance:**
- `npm run test:l4` passes 3/3 tests.
- `npm run demo:l4` prints pretty side-by-side proof.

**Demo criticality:** Polish (but extremely high-impact for judging)

---

## Task D-09 — SWR Wrapping for Cacheable Reads (30 min, t=4:05–4:35)

**Objective:** Use SWR for any read that can be cached (dashboard data, course outlines, student profiles). Generation calls (text/story) DO NOT use SWR — they should be triggered.

**Files to create:**
- `shared/hooks/use-dashboard.ts`
- `shared/hooks/use-course.ts`
- `shared/hooks/use-progress.ts`

**Spec:**
```typescript
export function useDashboard(studentId: string) {
  return useSWR(['dashboard', studentId], () => studentService.getDashboard(studentId), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });
}
```

**Acceptance:** Switching Maya→Liam→Maya hits the dashboard endpoint twice (once per student), not three times.

**Demo criticality:** Should Have

---

## Task D-10 — Performance Hygiene Audit (30 min, t=4:35–5:05)

**Objective:** Catch obvious perf issues before demo. NOT real optimization — just remove footguns.

**Steps:**
1. Run `next dev` with `npm run build && npm run start` to test prod build.
2. Open Chrome DevTools, Performance tab. Record the demo path.
3. Look for:
   - Layout shifts (CLS) — fix any large ones (e.g., images without `width`/`height`).
   - Unnecessary re-renders — wrap heavy components in `memo` if rerendering on every scroll.
   - Large bundle imports — check that `motion`, `recharts`, `react-youtube` aren't bundled twice.
   - Slow LCP on dashboard — usually the hero image; preload via `<link rel="preload" as="image" href={heroUrl} />` in the page head.
4. Fix anything taking >100ms unnecessarily.

**Acceptance:** Lighthouse run on student dashboard shows performance >70 (good enough for demo).

**Demo criticality:** Should Have

---

## Task D-11 — Console-Polluted Endpoint Health Banner (15 min, t=5:05–5:20)

**Objective:** Show an unmissable banner during dev/demo if any backend service is degraded.

**Files to create:**
- `features/health-banner/health-banner.tsx`
- `app/api/health/route.ts` (already-stub if O-05 didn't add it)

**Spec:**
- `/api/health` GET → checks: Backboard reachable, Docling sidecar reachable, ElevenLabs key valid (HEAD request to API). Returns `{ backboard: 'ok'|'degraded'|'down', docling: ..., elevenlabs: ... }`.
- `<HealthBanner>` polls `/api/health` every 30s. If anything ≠ 'ok', shows a non-dismissible amber banner at top: "⚠️ Some services degraded. Demo will use seed fallback for: voice".
- Banner only shows in non-production env.

**Acceptance:** Killing the Docling sidecar shows "docling down" banner within 30s.

**Demo criticality:** Should Have

---

## Task D-12 — Pre-Demo Smoke Test Script (20 min, t=5:20–5:40)

**Objective:** A single command that verifies everything is ready.

**Files to create:**
- `scripts/pre-demo-check.ts`

**Spec:**
```typescript
const checks = [
  { name: 'Backboard reachable', fn: async () => fetch('/api/health').then(r => r.json()).then(d => d.backboard === 'ok') },
  { name: 'Maya seed loaded', fn: async () => useStudentStore.getState().getById('maya') !== undefined },
  { name: 'Liam seed loaded', fn: async () => useStudentStore.getState().getById('liam') !== undefined },
  { name: 'Maya text lesson seed exists', fn: async () => fetch('/seed/lessons-maya/photosynthesis-1-text.json').then(r => r.ok) },
  { name: 'Liam text lesson seed exists', fn: async () => fetch('/seed/lessons-liam/photosynthesis-1-text.json').then(r => r.ok) },
  // ... 24 seed file checks
  { name: 'Voice fallback MP3 exists', fn: async () => fetch('/seed/voice-fallback-maya.mp3').then(r => r.ok) },
  { name: 'L4 differential test passes', fn: async () => /* run differential check */ },
];

for (const check of checks) {
  const start = Date.now();
  try {
    const ok = await check.fn();
    console.log(`${ok ? '✅' : '❌'} ${check.name} (${Date.now()-start}ms)`);
  } catch (e) {
    console.log(`❌ ${check.name} — ERROR: ${e.message}`);
  }
}
```

**Acceptance:** Running `npm run check` prints a green dashboard. Any red items are addressed before demo.

**Demo criticality:** Must Have (run before demo)

---

## Task D-13 — Final Test Pass + Demo Standby (60 min, t=5:40–6:40)

**Objective:** Available to debug anything that breaks during final integration. Stay close to Rishabh during R-10.

**Steps:**
1. Run pre-demo-check.
2. Walk demo path; flag any state issues.
3. If a state bug is found, you fix it (Rishabh focused on integration).
4. Verify SWR cache invalidation works correctly when switching students mid-session.
5. Be ready to live-fix during demo.

---

## Reusable Code Inventory (Demi)

| From | What | How |
|---|---|---|
| `_enya-reference/.../shared/services/quiz-grading-service.ts` | Grading patterns | Reference |
| `_enya-reference/.../shared/services/student-progress-service.ts` | Progress shape | Reference |
| `_enya-reference/.../shared/hooks/use-streak-calculation.ts` | Streak math | Reference (we hardcode for hackathon) |
| `_enya-reference/.../shared/hooks/use-list.ts` | List CRUD | Direct copy if useful |
| `_enya-reference/.../shared/hooks/use-zod-form.ts` | Zod form helper | Direct copy |

---

## Demi's Daily Schedule

| Time | Task |
|---|---|
| 8:30 AM | Standup, pull latest |
| 9:00 AM | D-01 (RoleStore) |
| 9:15 AM | D-02 (StudentStore) |
| 9:35 AM | D-03 (ProgressStore) |
| 10:05 AM | D-04 (ThreadStore) |
| 10:20 AM | D-05 (Service layer) |
| 11:20 AM | D-06 (Seed fallback) |
| 11:50 AM | D-07 (Grading logic) |
| 12:35 PM | LUNCH |
| 1:05 PM | D-08 (L4 differential test) |
| 1:35 PM | D-09 (SWR hooks) |
| 2:05 PM | D-10 (Perf audit) |
| 2:35 PM | D-11 (Health banner) |
| 2:50 PM | D-12 (pre-demo-check) |
| 3:10 PM | D-13 (standby + bug-fix) — bulk of afternoon |
| 5:30 PM | Demo |
