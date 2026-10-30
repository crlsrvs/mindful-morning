import questions from "../../content/questions.json";
import reflections from "../../content/reflections.json";
import manifest from "../../content/manifest.json";
import families from "../../content/reflection-families.json";
import categories from "../../content/categories.json";
import sources from "../../content/content-sources.json";
import dimensions from "../../content/dimensions.json";
import resources from "../../content/support-resources.json";
import copy from "../../content/ui-copy.json";
import type {
  Manifest,
  Question,
  Reflection,
  ReflectionFamily,
  SupportResource,
} from "../../content/content-contract";
import {
  approved,
  canonical,
  hash,
  C,
  validateConfig,
  D,
} from "../domain/engine/core";
import type { Catalog } from "../domain/catalog";
import { localPreviewEnabled } from "./local-preview";
export type { Catalog } from "../domain/catalog";
export const catalog: Catalog = {
  manifest: manifest as Manifest,
  questions: questions as Question[],
  reflections: reflections as Reflection[],
  families: families as ReflectionFamily[],
};
export const supportResources = resources as SupportResource[];
export const contentSources = sources;
export function contentAvailableForSession(): boolean {
  const status = contentStatus();
  return (
    status === "ready" || (localPreviewEnabled && status === "pending_review")
  );
}
export function contentStatus(): "ready" | "pending_review" | "invalid" {
  try {
    validateConfig(C);
    const { hash: expected, ...rest } = manifest;
    const actual = hash(
      canonical({
        "manifest.json": rest,
        "questions.json": questions,
        "reflections.json": reflections,
        "reflection-families.json": families,
        "categories.json": categories,
        "content-sources.json": sources,
        "dimensions.json": dimensions,
        "support-resources.json": resources,
        "ui-copy.json": copy,
      }),
    );
    if (
      actual !== expected ||
      manifest.engineContractVersion !== C.engineContractVersion ||
      manifest.schemaVersion !== 1 ||
      manifest.minCompatibleEngine !== C.engineVersion ||
      questions.length < 160 ||
      questions.length > 200 ||
      reflections.length < 82
    )
      return "invalid";
    for (const q of catalog.questions)
      for (const d of D) {
        const actual =
          q.answers.filter((a) => a.effects.some((e) => e.dimension === d))
            .length / q.answers.length;
        if (Math.abs(actual - q.coveragePotential[d]) > 1e-9) return "invalid";
      }
    if (
      !manifest.review.releaseReady ||
      manifest.review.status !== "approved" ||
      !manifest.review.reviewedAt ||
      [
        ...catalog.questions,
        ...catalog.reflections,
        ...catalog.families,
        ...supportResources,
      ].some((x) => !approved(x.quality)) ||
      copy.status !== "approved"
    )
      return "pending_review";
    return "ready";
  } catch {
    return "invalid";
  }
}
