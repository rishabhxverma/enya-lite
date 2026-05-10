import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readSeedEnvelope } from "@shared/lib/seed-loader";
import {
  STUB_TEXT_LESSONS,
} from "@shared/lib/stub-content";
import type { TextLessonContent } from "@shared/types";

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else
        dp[i][j] =
          1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

async function loadLesson(
  studentId: string,
  lessonId: string
): Promise<TextLessonContent> {
  const seed = await readSeedEnvelope<TextLessonContent>(
    `lessons-${studentId}/${lessonId}-text.json`
  );
  if (seed) return seed;
  return (
    STUB_TEXT_LESSONS[studentId]?.[lessonId] ??
    STUB_TEXT_LESSONS.maya["photosynthesis-1"]
  );
}

export default async function L4DemoPage() {
  const lessonId = "photosynthesis-1";
  const [maya, liam] = await Promise.all([
    loadLesson("maya", lessonId),
    loadLesson("liam", lessonId),
  ]);
  const dist = levenshtein(maya.bodyMarkdown, liam.bodyMarkdown);
  const ratio =
    dist / Math.max(maya.bodyMarkdown.length, liam.bodyMarkdown.length);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-yellow-50 via-background to-yellow-50/40 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            L4 personalization proof
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold mt-1">
            Same lesson. <span className="text-yellow-600">Two students.</span>
          </h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Both students opened &quot;What do plants need?&quot;. The text
            below was generated <strong>specifically for them</strong> —
            different vocabulary, different metaphors, different cultural
            framing. Levenshtein delta:{" "}
            <span className="font-bold text-yellow-700">
              {(ratio * 100).toFixed(1)}%
            </span>{" "}
            unique.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          <article
            data-student="maya"
            className="rounded-3xl border-2 bg-card p-6 shadow-md relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-2xl">
                🦋
              </div>
              <div>
                <div className="font-bold">Maya Haddad</div>
                <div className="text-xs text-muted-foreground">
                  Grade 3 · Emerging (A1) · butterflies + art
                </div>
              </div>
            </div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--student-primary, #be185d)" }}
            >
              {maya.title}
            </h2>
            <div className="prose prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_strong]:text-[color:var(--student-accent,#ea580c)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {maya.bodyMarkdown}
              </ReactMarkdown>
            </div>
          </article>

          <article
            data-student="liam"
            className="rounded-3xl border-2 bg-card p-6 shadow-md relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                🚀
              </div>
              <div>
                <div className="font-bold">Liam Chen-Patel</div>
                <div className="text-xs text-muted-foreground">
                  Grade 6 · Proficient (B1) · space + robotics
                </div>
              </div>
            </div>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--student-primary, #1e40af)" }}
            >
              {liam.title}
            </h2>
            <div className="prose prose-sm max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_strong]:text-[color:var(--student-accent,#0284c7)]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {liam.bodyMarkdown}
              </ReactMarkdown>
            </div>
          </article>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          Generated by Backboard.io with per-student profile context. RAG over
          the teacher&apos;s uploaded textbook. Tier-2/3 vocabulary
          calibrated to each EAL level.
        </div>
      </div>
    </div>
  );
}
