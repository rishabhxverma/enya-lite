import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 bg-gradient-to-br from-yellow-50 via-background to-yellow-50/40">
      <div className="max-w-2xl text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-yellow-500 mb-6 shadow-lg">
          <Sparkles className="w-10 h-10 text-yellow-950" />
        </div>
        <h1 className="text-4xl lg:text-6xl font-bold mb-4 tracking-tight">
          Enya <span className="text-yellow-600">Lite</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
          A personalized AI tutor that generates a different lesson for every
          student — same topic, different vocabulary, different stories,
          different illustrations.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/teacher"
            className="rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-8 h-12 inline-flex items-center"
          >
            I&apos;m a Teacher
          </Link>
          <Link
            href="/student/maya"
            className="rounded-xl border-2 border-[hsl(var(--button-secondary-border))] bg-[hsl(var(--button-secondary))] text-[hsl(var(--button-secondary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-secondary-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-8 h-12 inline-flex items-center"
          >
            Open as Maya 🦋
          </Link>
          <Link
            href="/student/liam"
            className="rounded-xl border-2 border-[hsl(var(--button-secondary-border))] bg-[hsl(var(--button-secondary))] text-[hsl(var(--button-secondary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-secondary-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-8 h-12 inline-flex items-center"
          >
            Open as Liam 🚀
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-12">
          Use the role pills in the top right to switch between Teacher, Maya,
          and Liam at any time.
        </p>
      </div>
    </div>
  );
}
