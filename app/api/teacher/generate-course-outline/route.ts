import { NextResponse } from "next/server";
import { STUB_COURSE_OUTLINE } from "@shared/lib/stub-content";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // TODO: real implementation — call Backboard with claude-sonnet-4-6, RAG over docId
  const course = {
    ...STUB_COURSE_OUTLINE,
    topic: body.topic ?? STUB_COURSE_OUTLINE.topic,
    gradeLevel: body.gradeLevel ?? STUB_COURSE_OUTLINE.gradeLevel,
    curriculumStandard:
      body.curriculumStandard ?? STUB_COURSE_OUTLINE.curriculumStandard,
    textbookDocumentId:
      body.documentId ?? STUB_COURSE_OUTLINE.textbookDocumentId,
  };
  return NextResponse.json({ course, _stub: true });
}
