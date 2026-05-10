import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

export default function HomePage() {
  return (
    <div
      className="gradient-hero min-h-[80vh] flex flex-col items-center gap-6 justify-center p-5"
      style={{ "--delay": "150ms" } as React.CSSProperties}
    >
      <div
        className="animate-enter"
        style={{ "--stagger": 1 } as React.CSSProperties}
      >
        <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight">
          Enya Lite
        </h1>
      </div>

      <div
        className="animate-enter"
        style={{ "--stagger": 2 } as React.CSSProperties}
      >
        <p className="text-lg max-w-lg mx-auto text-center">
          A personalized AI experience that generates a different lesson for
          every student. It generates the same topic with different vocabulary,
          stories and illustrations.
        </p>
      </div>

      <div
        className="animate-enter flex flex-col sm:flex-row items-center justify-center gap-4"
        style={{ "--stagger": 3 } as React.CSSProperties}
      >
        <Button asChild variant={"enya_neutral"} size={"lg"}>
          <Link href="/teacher">I&apos;m a Teacher</Link>
        </Button>

        <Button asChild variant="enya_neutral" size="lg">
          <Link href="/student/maya/onboarding">Open as Maya 🦋</Link>
        </Button>

        <Button asChild variant="enya_neutral" size="lg">
          <Link href="/student/liam/onboarding">Open as Liam 🚀</Link>
        </Button>
      </div>
    </div>
  );
}
