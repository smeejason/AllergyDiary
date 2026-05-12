"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_SYMPTOMS,
  MEDICATIONS,
  SYMPTOM_FIELDS,
  type SymptomKey,
  type Symptoms,
} from "@/lib/symptoms";

const SCORE_LABELS = ["", "Awful", "Bad", "OK", "Good", "Great"];
const SEVERITY_LABELS = ["None", "Mild", "Moderate", "Severe"];

type Coord = { latitude: number; longitude: number; accuracy_m?: number };

type LocationState =
  | { kind: "pending" }
  | { kind: "ready"; coord: Coord }
  | { kind: "denied" }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

type WeatherSnap = {
  temperature_c: number | null;
  humidity_pct: number | null;
  wind_kph: number | null;
  precipitation_mm: number | null;
};
type PollenSnap = {
  alder: number | null;
  birch: number | null;
  grass: number | null;
  mugwort: number | null;
  olive: number | null;
  ragweed: number | null;
};
type EnvSnapshot = {
  weather: WeatherSnap | null;
  pollen: PollenSnap | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; snapshot: EnvSnapshot | null }
  | { kind: "error"; message: string };

export function LogEntryForm() {
  const [overall, setOverall] = useState<number>(3);
  const [symptoms, setSymptoms] = useState<Symptoms>({ ...EMPTY_SYMPTOMS });
  const [meds, setMeds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [location, setLocation] = useState<LocationState>({ kind: "pending" });

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({ kind: "unsupported" });
      return;
    }
    setLocation({ kind: "pending" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          kind: "ready",
          coord: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy,
          },
        }),
      (err) =>
        setLocation(
          err.code === err.PERMISSION_DENIED
            ? { kind: "denied" }
            : { kind: "error", message: err.message }
        ),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    void Promise.resolve().then(requestLocation);
  }, [requestLocation]);

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
      const coord = location.kind === "ready" ? location.coord : null;
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall_score: overall,
          symptoms,
          medications_taken: meds,
          notes,
          ...(coord
            ? {
                latitude: coord.latitude,
                longitude: coord.longitude,
                accuracy_m: coord.accuracy_m,
              }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as {
        entry?: { environmental_snapshot?: EnvSnapshot | null };
      };
      setStatus({
        kind: "saved",
        snapshot: data.entry?.environmental_snapshot ?? null,
      });
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

      <LocationStatus state={location} onRetry={requestLocation} />

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={status.kind === "saving"}
          className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {status.kind === "saving" ? "Saving…" : "Save entry"}
        </button>
        {status.kind === "saved" && <SavedSummary snapshot={status.snapshot} />}
        {status.kind === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}

function LocationStatus({
  state,
  onRetry,
}: {
  state: LocationState;
  onRetry: () => void;
}) {
  let label = "";
  let tone = "text-zinc-500 dark:text-zinc-400";
  let canRetry = false;
  switch (state.kind) {
    case "pending":
      label = "Locating you so we can pull weather and pollen…";
      break;
    case "ready":
      label = `Location ready (±${Math.round(state.coord.accuracy_m ?? 0)} m). Weather and pollen will be saved with this entry.`;
      tone = "text-zinc-600 dark:text-zinc-300";
      break;
    case "denied":
      label =
        "Location blocked in your browser. Re-allow it in site settings, then retry.";
      tone = "text-amber-600 dark:text-amber-400";
      canRetry = true;
      break;
    case "unsupported":
      label =
        "This device can't share location, so weather and pollen will be skipped.";
      tone = "text-amber-600 dark:text-amber-400";
      break;
    case "error":
      label = `Couldn't read location (${state.message}). You can still save without conditions, or retry.`;
      tone = "text-amber-600 dark:text-amber-400";
      canRetry = true;
      break;
  }
  return (
    <p className={`flex flex-wrap items-center gap-2 text-xs ${tone}`}>
      <span>{label}</span>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full border border-current px-2 py-0.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          Retry
        </button>
      )}
    </p>
  );
}

function SavedSummary({ snapshot }: { snapshot: EnvSnapshot | null }) {
  if (!snapshot || (!snapshot.weather && !snapshot.pollen)) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400">
        Saved. Logged for today.
      </p>
    );
  }
  const w = snapshot.weather;
  const p = snapshot.pollen;
  const parts: string[] = [];
  if (w?.temperature_c != null) parts.push(`${w.temperature_c.toFixed(1)}°C`);
  if (w?.humidity_pct != null) parts.push(`${Math.round(w.humidity_pct)}% humidity`);
  if (w?.wind_kph != null) parts.push(`${Math.round(w.wind_kph)} km/h wind`);
  if (w?.precipitation_mm != null && w.precipitation_mm > 0)
    parts.push(`${w.precipitation_mm.toFixed(1)} mm rain`);
  if (p?.grass != null) parts.push(`grass pollen ${p.grass.toFixed(1)}`);
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
      <p className="font-medium">Saved.</p>
      {parts.length > 0 && (
        <p className="mt-1 text-xs">Conditions logged: {parts.join(" · ")}</p>
      )}
    </div>
  );
}
