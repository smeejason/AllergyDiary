// Fetches current weather + pollen from Open-Meteo for a given coord.
// Open-Meteo is free and key-less. Two endpoints:
//   - api.open-meteo.com         → forecast/current weather
//   - air-quality-api.open-meteo.com → pollen + air quality
// Pollen is calibrated for Europe; NZ values are indicative only.

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

const FETCH_TIMEOUT_MS = 5000;

export type Coord = { latitude: number; longitude: number; accuracy_m?: number };

export type Weather = {
  temperature_c: number | null;
  humidity_pct: number | null;
  wind_kph: number | null;
  pressure_hpa: number | null;
  precipitation_mm: number | null;
  weather_code: number | null;
  observed_at: string | null;
};

export type Pollen = {
  alder: number | null;
  birch: number | null;
  grass: number | null;
  mugwort: number | null;
  olive: number | null;
  ragweed: number | null;
  observed_at: string | null;
};

export type ConditionsSnapshot = {
  location: Coord;
  weather: Weather | null;
  pollen: Pollen | null;
  fetched_at: string;
  errors?: { weather?: string; pollen?: string };
};

async function fetchJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

async function fetchWeather(c: Coord): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: c.latitude.toString(),
    longitude: c.longitude.toString(),
    current:
      "temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code",
    wind_speed_unit: "kmh",
    timezone: "auto",
  });
  const json = (await fetchJson(`${WEATHER_URL}?${params}`)) as {
    current?: Record<string, unknown>;
  };
  const cur = json.current ?? {};
  return {
    temperature_c: num(cur.temperature_2m),
    humidity_pct: num(cur.relative_humidity_2m),
    wind_kph: num(cur.wind_speed_10m),
    pressure_hpa: num(cur.surface_pressure),
    precipitation_mm: num(cur.precipitation),
    weather_code: num(cur.weather_code),
    observed_at: str(cur.time),
  };
}

async function fetchPollen(c: Coord): Promise<Pollen> {
  const params = new URLSearchParams({
    latitude: c.latitude.toString(),
    longitude: c.longitude.toString(),
    current:
      "alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen",
    timezone: "auto",
  });
  const json = (await fetchJson(`${AIR_QUALITY_URL}?${params}`)) as {
    current?: Record<string, unknown>;
  };
  const cur = json.current ?? {};
  return {
    alder: num(cur.alder_pollen),
    birch: num(cur.birch_pollen),
    grass: num(cur.grass_pollen),
    mugwort: num(cur.mugwort_pollen),
    olive: num(cur.olive_pollen),
    ragweed: num(cur.ragweed_pollen),
    observed_at: str(cur.time),
  };
}

export async function getConditions(location: Coord): Promise<ConditionsSnapshot> {
  const [weatherRes, pollenRes] = await Promise.allSettled([
    fetchWeather(location),
    fetchPollen(location),
  ]);
  const snap: ConditionsSnapshot = {
    location,
    weather: weatherRes.status === "fulfilled" ? weatherRes.value : null,
    pollen: pollenRes.status === "fulfilled" ? pollenRes.value : null,
    fetched_at: new Date().toISOString(),
  };
  const errors: { weather?: string; pollen?: string } = {};
  if (weatherRes.status === "rejected") {
    errors.weather =
      weatherRes.reason instanceof Error
        ? weatherRes.reason.message
        : "unknown";
  }
  if (pollenRes.status === "rejected") {
    errors.pollen =
      pollenRes.reason instanceof Error ? pollenRes.reason.message : "unknown";
  }
  if (errors.weather || errors.pollen) snap.errors = errors;
  return snap;
}
