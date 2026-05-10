import Link from "next/link";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <div className="text-5xl mb-3">👋</div>
      <h1 className="text-3xl font-bold">Welcome!</h1>
      <p className="text-muted-foreground mt-3">
        Placement quiz — coming soon. For now, jump straight to your dashboard.
      </p>
      <Link
        href={`/student/${studentId}`}
        className="inline-block mt-6 rounded-xl border-2 border-[hsl(var(--button-primary-border))] bg-[hsl(var(--button-primary))] text-[hsl(var(--button-primary-text))] font-bold shadow-[0_4px_0_0_hsl(var(--button-primary-shadow))] active:shadow-none active:translate-y-[4px] transition-all px-6 h-12 leading-[3rem]"
      >
        Open my dashboard
      </Link>
    </div>
  );
}
