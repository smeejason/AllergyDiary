import { LogEntryForm } from "@/components/LogEntryForm";

export default function Home() {
  const today = new Date().toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-1">
          <p className="text-sm uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Allergy Diary
          </p>
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
