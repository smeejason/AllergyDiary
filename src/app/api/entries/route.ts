import { NextResponse } from "next/server";
import { getPrincipal } from "@/lib/auth";
import { getConditions, type Coord } from "@/lib/conditions";
import { getSupabaseServerClient } from "@/lib/supabase";
import { EMPTY_SYMPTOMS, SYMPTOM_FIELDS, type Symptoms } from "@/lib/symptoms";

export const runtime = "nodejs";

type EntryPayload = {
  overall_score: number;
  symptoms?: Partial<Symptoms>;
  notes?: string;
  medications_taken?: string[];
  entry_date?: string;
  latitude?: number;
  longitude?: number;
  accuracy_m?: number;
};

function normaliseSymptoms(input: Partial<Symptoms> | undefined): Symptoms {
  const out: Symptoms = { ...EMPTY_SYMPTOMS };
  if (!input) return out;
  for (const { key } of SYMPTOM_FIELDS) {
    const raw = input[key];
    if (typeof raw === "number" && raw >= 0 && raw <= 3) {
      out[key] = Math.round(raw);
    }
  }
  return out;
}

function parseLocation(body: EntryPayload): Coord | null {
  const lat = Number(body.latitude);
  const lon = Number(body.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  const acc = Number(body.accuracy_m);
  return {
    latitude: lat,
    longitude: lon,
    ...(Number.isFinite(acc) ? { accuracy_m: acc } : {}),
  };
}

export async function POST(req: Request) {
  const principal = await getPrincipal();

  let body: EntryPayload;
  try {
    body = (await req.json()) as EntryPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const score = Number(body.overall_score);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json(
      { error: "overall_score must be an integer 1–5" },
      { status: 400 }
    );
  }

  const location = parseLocation(body);
  const snapshot = location ? await getConditions(location) : null;

  const row = {
    user_id: principal.userId,
    overall_score: score,
    symptoms: normaliseSymptoms(body.symptoms),
    notes: body.notes?.trim() || null,
    medications_taken: Array.isArray(body.medications_taken)
      ? body.medications_taken.filter((m) => typeof m === "string")
      : [],
    environmental_snapshot: snapshot,
    entry_date: body.entry_date || undefined,
  };

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entry: data }, { status: 201 });
}

export async function GET() {
  const principal = await getPrincipal();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", principal.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ entries: data });
}
