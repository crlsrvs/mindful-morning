import {
  C,
  Estimate,
  DimensionId,
  classify,
  selectable,
  day,
  tie,
  Reflection,
} from "./core";
const gates: [DimensionId, number, string][] = [
  ["tension", 1, "fam_tension"],
  ["mentalLoad", 1, "fam_mental_load"],
  ["connection", -1, "fam_connection_low"],
  ["motivation", -1, "fam_motivation_low"],
  ["activation", 1, "fam_activation_high"],
  ["activation", -1, "fam_activation_low"],
];
export function family(
  e: Estimate,
  recentFamilies: readonly string[] = [],
): string {
  if (classify(e).mode === "positive") return "fam_positive_grounded";
  const count = (id: string) =>
    recentFamilies.slice(-7).filter((x) => x === id).length;
  return (
    gates
      .filter(
        ([d, sign]) =>
          e[d].mu !== null &&
          e[d].mu! * sign >= C.contextMagnitudeThreshold &&
          e[d].confidence >= C.minContextConfidence &&
          e[d].n >= 2,
      )
      .sort((a, b) => count(a[2]) - count(b[2]))[0]?.[2] ??
    "fam_neutral_generic"
  );
}
export interface ReflectionExposure {
  id: string;
  familyId: string;
  date: string;
}
export function selectReflection(
  pool: readonly Reflection[],
  familyId: string,
  date: string,
  history: readonly ReflectionExposure[],
  seed: string,
  localPreview = false,
) {
  const today = day(date);
  const records = (id: string) =>
    history.filter((x) => x.id === id && day(x.date) <= today);
  const last = (id: string) =>
    Math.max(-Infinity, ...records(id).map((x) => day(x.date)));
  const count = (id: string) =>
    records(id).filter((x) => today - day(x.date) <= 30).length;
  const safe = pool.filter(
    (r) =>
      r.familyId === familyId &&
      r.locale === "es-CL" &&
      selectable(r.quality, localPreview),
  );
  const free = safe.filter(
    (r) => today - last(r.id) > C.reflectionCooldownCalendarDays,
  );
  const candidates = free.length ? free : safe;
  const reflection = [...candidates].sort(
    (a, b) =>
      count(a.id) - count(b.id) ||
      (last(a.id) === last(b.id) ? 0 : last(a.id) - last(b.id)) ||
      tie(seed, a.id, b.id),
  )[0];
  if (!reflection) throw new Error("NO_APPROVED_REFLECTION");
  return { reflection, cooldownRelaxed: free.length === 0 };
}
export interface PatternSession {
  date: string;
  state: string;
  distress: boolean;
}
export function supportEligible(
  current: PatternSession,
  sessions: readonly PatternSession[],
  last: string | null,
): boolean {
  if (
    current.state !== "completed" ||
    (C.supportRequiresCurrentDistress && !current.distress)
  )
    return false;
  const d = day(current.date);
  const dates = new Set(
    [...sessions, current]
      .filter(
        (s) =>
          s.state === "completed" &&
          s.distress &&
          day(s.date) <= d &&
          day(s.date) >= d - C.patternWindowDays + 1,
      )
      .map((s) => s.date),
  );
  return (
    dates.size >= C.patternRequiredSessions &&
    (last === null || d - day(last) >= C.patternCooldownCalendarDays)
  );
}
export function streak(dates: readonly string[], today: string): number {
  const set = new Set(dates.map(day));
  let cursor = day(today);
  if (!set.has(cursor)) cursor--;
  let n = 0;
  while (set.has(cursor--)) n++;
  return n;
}
