import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    report: {
      title: `Progress report — ${body.targetId ?? "Maya"}`,
      sections: [
        {
          heading: "Headline insight",
          bodyMarkdown:
            "Maya completed 5 of 12 activities this week. Her quiz performance is steady (72% avg) but voice activity time is the lowest in the class.",
        },
        {
          heading: "Recommendations",
          bodyMarkdown:
            "1. Adjust voice activity difficulty.\n2. Pair Maya with a buddy for the next story game.",
        },
      ],
    },
    _stub: true,
  });
}
