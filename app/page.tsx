import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center gap-6 justify-center p-5 bg-linear-to-br">
      <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight">
        Enya Lite
      </h1>
      <p className="text-lg text-muted-foreground max-w-lg mx-auto text-center">
        A personalized AI tutor that generates a different lesson for every
        students. It generates the same topic with different vocabulary, stories
        and illustrations.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild variant={"enya_neutral"} size={"lg"}>
          <Link href="/teacher">I&apos;m a Teacher</Link>
        </Button>

        <Button asChild variant="enya_neutral" size="lg">
          <Link href="/student/maya">Open as Maya 🦋</Link>
        </Button>

        <Button asChild variant="enya_neutral" size="lg">
          <Link href="/student/liam">Open as Liam 🚀</Link>
        </Button>
      </div>
    </div>
  );
}
