import { sha256 } from "js-sha256";
import config from "../../../config/engine-config.v1.json";
import type {
  Answer,
  DimensionId,
  Question,
  QualityMetadata,
} from "../../../content/content-contract";
export type {
  Answer,
  DimensionId,
  Question,
  Reflection,
  Manifest,
  ReflectionFamily,
} from "../../../content/content-contract";
export const C = Object.freeze(config);
export const D: readonly DimensionId[] = [
  "valence",
  "activation",
  "tension",
  "mentalLoad",
  "connection",
  "motivation",
];
export const CONTEXT = D.slice(2);
export const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  return JSON.stringify(value);
}
export const hash = (value: string) => sha256(value);
export const configHash = hash(canonical(C));
let lastTieSeed = "";
let tieCache = new Map<string, string>();
export const tie = (seed: string, a: string, b: string) => {
  if (seed !== lastTieSeed) {
    lastTieSeed = seed;
    tieCache = new Map();
  }
  let ha = tieCache.get(a);
  if (ha === undefined) {
    ha = hash(`${seed}|${a}`);
    tieCache.set(a, ha);
  }
  let hb = tieCache.get(b);
  if (hb === undefined) {
    hb = hash(`${seed}|${b}`);
    tieCache.set(b, hb);
  }
  return compare(ha, hb) || compare(a, b);
};
const dayCache = new Map<string, number>();
/** Calendar ordinals, independent of DST and the historical session's timezone. */
export function day(date: string): number {
  const cached = dayCache.get(date);
  if (cached !== undefined) return cached;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_DATE");
  const n = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== date)
    throw new Error("INVALID_DATE");
  const ordinal = n / 86400000;
  dayCache.set(date, ordinal);
  return ordinal;
}
export const approved = (q: QualityMetadata) =>
  q.status === "approved" &&
  !!q.reviewedAt &&
  q.approvals.length > 0 &&
  q.reviewerRole !== "pending_human_review" &&
  q.originalityChecked &&
  q.accessibilityChecked;
// A draft can be exercised without falsifying its editorial metadata.
// Both explicit opt-in and a development bundle are required.
export const selectable = (q: QualityMetadata, localPreview = false) =>
  approved(q) ||
  (typeof __DEV__ !== "undefined" &&
    __DEV__ &&
    localPreview &&
    q.status === "draft");
export interface Observation {
  questionId: string;
  primaryDimension: DimensionId;
  answer: Answer | null;
}
export interface Signal {
  mu: number | null;
  variance: number | null;
  nEff: number;
  confidence: number;
  n: number;
}
export type Estimate = Record<DimensionId, Signal>;
export function validateConfig(c: typeof config): void {
  for (const weights of [c.baseWeights, c.adaptiveWeights]) {
    if (
      Object.values(weights).some(
        (w) => !Number.isFinite(w) || w < 0 || w > 1,
      ) ||
      Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) > 1e-12
    )
      throw new Error("INVALID_CONFIG");
  }
  // Version 1 is a fixed contract; changing a heuristic requires a new version.
  if (
    canonical(c) !== canonical(config) ||
    c.reflectionWaitSeconds < 20 ||
    c.reflectionWaitSeconds > 30
  )
    throw new Error("INVALID_CONFIG");
}
const validDim = new Set<string>(D);
export function estimate(observations: readonly Observation[]): Estimate {
  const ordered = [...observations].sort((a, b) =>
    compare(a.questionId, b.questionId),
  );
  for (let i = 0; i < ordered.length; i++) {
    if (i > 0 && ordered[i].questionId === ordered[i - 1].questionId)
      throw new Error("DUPLICATE_EVIDENCE");
    const effects = ordered[i].answer?.effects;
    if (!effects) continue;
    if (
      effects.length > 3 ||
      (effects.length >= 2 && effects[0].dimension === effects[1].dimension) ||
      (effects.length === 3 &&
        (effects[0].dimension === effects[2].dimension ||
          effects[1].dimension === effects[2].dimension))
    )
      throw new Error("INVALID_EFFECT");
    for (let j = 0; j < effects.length; j++) {
      const e = effects[j];
      if (
        !validDim.has(e.dimension) ||
        !Number.isFinite(e.value) ||
        Math.abs(e.value) > 1 ||
        !Number.isFinite(e.weight) ||
        e.weight <= 0 ||
        e.weight > 1
      )
        throw new Error("INVALID_EFFECT");
    }
  }
  const out = {} as Estimate;
  for (let di = 0; di < D.length; di++) {
    const d = D[di];
    let n = 0,
      w = 0,
      vw = 0,
      w2 = 0;
    for (let i = 0; i < ordered.length; i++) {
      const effects = ordered[i].answer?.effects;
      if (!effects) continue;
      for (let j = 0; j < effects.length; j++) {
        const e = effects[j];
        if (e.dimension === d) {
          n++;
          w += e.weight;
          vw += e.value * e.weight;
          w2 += e.weight * e.weight;
        }
      }
    }
    if (!n) {
      out[d] = { mu: null, variance: null, nEff: 0, confidence: 0, n: 0 };
      continue;
    }
    const mu = vw / w;
    const nEff = (w * w) / w2;
    let vSum = 0;
    for (let i = 0; i < ordered.length; i++) {
      const effects = ordered[i].answer?.effects;
      if (!effects) continue;
      for (let j = 0; j < effects.length; j++) {
        const e = effects[j];
        if (e.dimension === d) vSum += e.weight * (e.value - mu) ** 2;
      }
    }
    let variance = vSum / w;
    if (variance > 1 && variance <= 1 + 1e-12) variance = 1;
    out[d] = {
      mu,
      variance,
      nEff,
      confidence:
        Math.min(
          C.maxConfidence,
          Math.min(1, nEff / C.confidenceSaturationEvidence),
        ) *
        (1 - variance),
      n,
    };
  }
  return out;
}
export function classify(e: Estimate) {
  const v = e.valence;
  const sufficient =
    v.mu !== null &&
    v.variance !== null &&
    v.n >= C.minEvidenceCountForLabel &&
    v.nEff >= C.minEffectiveEvidenceForLabel &&
    v.confidence >= C.minValenceConfidenceForLabel &&
    v.variance <= C.maxValenceVarianceForLabel;
  return {
    mode:
      sufficient && v.mu! >= C.positiveValenceThreshold
        ? ("positive" as const)
        : ("nonlabel" as const),
    distress: sufficient && v.mu! <= C.distressValenceThreshold,
  };
}
