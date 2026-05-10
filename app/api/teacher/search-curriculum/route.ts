import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    standards: [
      {
        id: "BC-G3-Sci-2.1",
        description:
          "Living things have features and behaviours that help them survive in their environment.",
        subject: "Science",
      },
      {
        id: "BC-G3-Sci-3.2",
        description:
          "All living things have a life cycle and depend on each other.",
        subject: "Science",
      },
    ],
    query: body.query,
    _stub: true,
  });
}
