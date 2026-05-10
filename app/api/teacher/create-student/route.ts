import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id =
    typeof body.name === "string"
      ? body.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      : `student-${Date.now()}`;

  const profile = {
    id,
    name: body.name ?? "New Student",
    grade: body.grade ?? 3,
    ealLevel: body.ealLevel ?? "Developing",
    interests: body.interests ?? [],
    culturalBackground: body.culturalBackground ?? "",
    learningGoals: body.learningGoals ?? [],
    avatarUrl: `/seed/avatars/${id}.svg`,
    theme: {
      primaryColor: "oklch(0.83 0.18 82)",
      accentColor: "oklch(0.7 0.18 50)",
      backgroundPattern: "plain" as const,
      heroImageUrl: null,
    },
  };

  return NextResponse.json({ studentId: id, profile, _stub: true });
}
