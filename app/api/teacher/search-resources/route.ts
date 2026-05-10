import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    resources: [
      {
        id: "res_1",
        name: "Photosynthesis interactive simulator",
        type: "simulation",
        preview:
          "PhET interactive that lets students manipulate light/water levels.",
      },
      {
        id: "res_2",
        name: "Plant lifecycle illustrated PDF (BC curriculum aligned)",
        type: "pdf",
        preview: "10-page handout with diagrams and key vocabulary.",
      },
    ],
    _stub: true,
  });
}
