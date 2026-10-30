// TEST ONLY. Approval markers below are synthetic fixtures, never shipped or written to content/.
import { catalog } from "../src/infrastructure/catalog";
import type { Catalog } from "../src/infrastructure/catalog";
import type {
  QualityMetadata,
  Question,
  Answer,
  DimensionId,
} from "../content/content-contract";
import {
  defaults,
  Repository,
  StoreState,
  Clock,
} from "../src/application/model";
const quality = (q: QualityMetadata): QualityMetadata => ({
  ...q,
  status: "approved",
  reviewerRole: "synthetic_test_reviewer",
  reviewedAt: "2026-10-25",
  approvals: ["TEST_ONLY"],
  originalityChecked: true,
  accessibilityChecked: true,
  clinicalLanguageRisk: 0,
  moralizingRisk: 0,
});
export const fixtureCatalog: Catalog = {
  manifest: {
    ...catalog.manifest,
    review: {
      ...catalog.manifest.review,
      status: "approved",
      releaseReady: true,
      reviewedAt: "2026-10-25",
    },
  },
  questions: catalog.questions.map((q) => ({
    ...q,
    quality: quality(q.quality),
  })),
  reflections: catalog.reflections.map((r) => ({
    ...r,
    quality: quality(r.quality),
  })),
  families: catalog.families.map((f) => ({
    ...f,
    quality: quality(f.quality),
  })),
};
export function observation(
  id: string,
  value: number | null,
  dimension: DimensionId = "valence",
  weight = 1,
) {
  return {
    questionId: id,
    primaryDimension: dimension,
    answer:
      value === null
        ? null
        : ({
            id: `a_${id}`,
            text: "Synthetic fixture",
            interpretationNote: "TEST ONLY",
            effects: [{ dimension, value, weight }],
          } as Answer | null),
  };
}
export function candidate(values: number[]): Question {
  return {
    ...fixtureCatalog.questions[0],
    id: "q_test",
    semanticClusterId: "test-cluster",
    narrativeTemplateId: "test-template",
    primaryDimension: "valence",
    adaptiveEligible: true,
    answers: values.map((v, i) => observation(String(i), v).answer!),
    coveragePotential: {
      valence: 1,
      activation: 0,
      tension: 0,
      mentalLoad: 0,
      connection: 0,
      motivation: 0,
    },
  };
}
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
export class MemoryRepository implements Repository {
  state: StoreState = { settings: defaults("test-install"), sessions: [] };
  failNext = false;
  private queue: Promise<unknown> = Promise.resolve();
  async read() {
    await this.queue;
    return clone(this.state);
  }
  transact<T>(update: (s: StoreState) => T): Promise<T> {
    const next = this.queue.then(() => {
      const draft = clone(this.state);
      const result = update(draft);
      if (this.failNext) {
        this.failNext = false;
        throw new Error("SIMULATED_POWER_LOSS");
      }
      this.state = draft;
      return result;
    });
    this.queue = next.catch(() => {});
    return next;
  }
  async erase() {
    await this.queue;
    this.state = { settings: defaults("new-install"), sessions: [] };
  }
}
export function fakeClock(date = "2026-10-25") {
  let count = 0;
  const clock: Clock & { date: string } = {
    date,
    localDate: () => clock.date,
    utc: () => `${clock.date}T12:00:00.000Z`,
    timeZone: () => "America/Santiago",
    offsetMinutes: () => -180,
    uuid: () => `test-${++count}`,
  };
  return clock;
}
