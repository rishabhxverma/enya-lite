import { Library } from "lucide-react";

const SAMPLES = [
  {
    name: "Photosynthesis interactive simulator",
    type: "Simulation",
    description: "PhET interactive that lets students manipulate light and water levels.",
  },
  {
    name: "Plant lifecycle illustrated PDF",
    type: "PDF",
    description: "10-page handout with diagrams and key vocabulary, BC curriculum aligned.",
  },
  {
    name: "Plant journal template",
    type: "Worksheet",
    description: "Printable observation worksheet for hands-on plant experiments.",
  },
];

export default function TeacherResourcesPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8">
      <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
        <Library className="w-7 h-7 text-yellow-700" />
        Resources
      </h1>
      <p className="text-muted-foreground mb-6">
        Curated and custom teaching materials.
      </p>
      <ul className="grid sm:grid-cols-2 gap-4">
        {SAMPLES.map((s) => (
          <li
            key={s.name}
            className="rounded-2xl border-2 bg-card p-5 hover:shadow-md transition"
          >
            <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              {s.type}
            </div>
            <h2 className="font-bold text-base mt-1">{s.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
