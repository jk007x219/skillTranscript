export const DEFAULT_FACULTY = "คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล";

export function isCorruptedThaiText(value: string | null | undefined) {
  if (!value) return false;

  const corruptedMarkers = ["�", "๏ฟฝ"];
  if (corruptedMarkers.some((marker) => value.includes(marker))) {
    return true;
  }

  const repeatedMojibake = value.match(/เธ|เน/g)?.length ?? 0;
  return repeatedMojibake >= 3;
}

export function cleanThaiText<T extends string | null | undefined>(
  value: T,
  fallback?: string | null
) {
  if (isCorruptedThaiText(value)) {
    return fallback ?? null;
  }

  return value ?? fallback ?? null;
}
