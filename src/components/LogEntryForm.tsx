"use client";

import { useState } from "react";
import {
  EMPTY_SYMPTOMS,
  MEDICATIONS,
  SYMPTOM_FIELDS,
  type SymptomKey,
  type Symptoms,
} from "@/lib/symptoms";

const SCORE_LABELS = ["", "Awful", "Bad", "OK", "Good", "Great"];
const SEVERITY_LABELS = ["None", "Mild", "Moderate", "Severe"];

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function LogEntryForm() {
  const [overall, setOverall] = useState<number>(3);
  const [symptoms, setSymptoms] = useState<Symptoms>({ ...EMPTY_SYMPTOMS });
  const [meds, setMeds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  function setSymptom(key: SymptomKey, value: number) {
    setSymptoms((s) => ({ ...s, [key]: value }));
  }

  function toggleMed(key: string) {
    setMeds((current) =>
      current.includes(key)
        ? current.filter((m) => m !== key)
        : [...current, key]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall_score: overall,
          symptoms,
          medications_taken: meds,
          notes,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setStatus({ kind: "saved" });
      setSymptoms({ ...EMPTY_SYMPTOMS });
      setMeds([]);
      setNotes("");
      setOverall(3);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Overall</h2>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = overall === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setOverall(n)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm transition-colors ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <span className="text-lg font-semibold">{n}</span>
                <span className="text-xs">{SCORE_LABELS[n]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Symptoms</h2>
        <div className="flex flex-col gap-3">
          {SYMPTOM_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-sm">{label}</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((n) => {
                  const active = symptoms[key] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${label} ${SEVERITY_LABELS[n]}`}
                      onClick={() => setSymptom(key, n)}
                      className={`h-9 w-14 rounded-md border text-xs transition-colors ${
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600"
                      }`}
                    >
                      {SEVERITY_LABELS[n]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-medium">Medications taken</h2>
        <div className="flex flex-wrap gap-2">
          {MEDICATIONS.map(({ key, label }) => {
            const active = meds.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleMed(key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-base font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Anything to remember about today — mowing nearby, indoors all day, woke up rough…"
          className="rounded-lg border border-zinc-200 bg-white p-3 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
        />
      </section>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={status.kind === "saving"}
          className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {status.kind === "saving" ? "Saving…" : "Save entry"}
        </button>
        {status.kind === "saved" && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Saved. Logged for today.
          </p>
        )}
        {status.kind === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
