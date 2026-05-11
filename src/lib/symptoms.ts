export const SYMPTOM_FIELDS = [
  { key: "eyes", label: "Eyes" },
  { key: "nose", label: "Nose" },
  { key: "chest", label: "Chest" },
  { key: "throat", label: "Throat" },
  { key: "energy", label: "Energy" },
  { key: "sleep_felt", label: "Sleep (felt)" },
] as const;

export type SymptomKey = (typeof SYMPTOM_FIELDS)[number]["key"];
export type Symptoms = Record<SymptomKey, number>;

export const EMPTY_SYMPTOMS: Symptoms = {
  eyes: 0,
  nose: 0,
  chest: 0,
  throat: 0,
  energy: 0,
  sleep_felt: 0,
};

export const MEDICATIONS = [
  { key: "antihistamine", label: "Antihistamine" },
  { key: "nasal_spray", label: "Nasal spray" },
  { key: "eye_drops", label: "Eye drops" },
  { key: "inhaler", label: "Inhaler" },
] as const;
