import { getPrincipal } from "@/lib/auth";
import { LogEntryForm } from "@/components/LogEntryForm";

export default async function Home() {
  const principal = await getPrincipal();
  const today = new Date().toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Allergy Diary
            </p>
            <a
              href="/logout"
              className="text-xs text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
            >
              Sign out{principal.userDetails ? ` (${principal.userDetails})` : ""}
            </a>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            How are you today?
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{today}</p>
        </header>
        <LogEntryForm />
      </main>
    </div>
  );
}
