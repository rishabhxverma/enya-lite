import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    mappings: [
      {
        standardId: "BC-G3-Sci-2.1",
        rationale:
          "This activity addresses BC G3 Sci 2.1 because students explicitly identify the inputs and outputs of photosynthesis through guided observation.",
        confidence: 0.92,
      },
    ],
    _stub: true,
  });
}
