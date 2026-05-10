async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${path} -> ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export const teacherService = {
  parseDocument: (input: { uploadId: string; fileName: string }) =>
    post("/api/teacher/parse-document", input),
  uploadDocument: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/teacher/parse-document", {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error(`upload failed ${res.status}`);
    return res.json() as Promise<{
      documentId: string;
      pageCount: number;
      chunkCount: number;
      status: string;
    }>;
  },
  generateCourseOutline: (input: unknown) =>
    post("/api/teacher/generate-course-outline", input),
  audit: (input: unknown) => post("/api/teacher/audit-content", input),
  adjustEal: (input: unknown) => post("/api/teacher/adjust-eal", input),
  searchCurriculum: (input: unknown) =>
    post("/api/teacher/search-curriculum", input),
  mapCurriculum: (input: unknown) =>
    post("/api/teacher/map-curriculum", input),
  classroom: (input: unknown) => post("/api/teacher/classroom", input),
  bulkUpdateEal: (input: unknown) =>
    post("/api/teacher/bulk-update-eal", input),
  searchResources: (input: unknown) =>
    post("/api/teacher/search-resources", input),
  generateQuiz: (input: unknown) => post("/api/teacher/generate-quiz", input),
  previewStudent: (input: unknown) =>
    post("/api/teacher/preview-student", input),
  generateReport: (input: unknown) =>
    post("/api/teacher/generate-report", input),
  simplifyText: (input: unknown) =>
    post("/api/teacher/simplify-text", input),
  createStudent: (input: unknown) =>
    post("/api/teacher/create-student", input),
  getStudentAnalytics: (input: unknown) =>
    post("/api/teacher/student-analytics", input),
};
