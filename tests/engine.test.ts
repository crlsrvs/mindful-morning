import {
  C,
  canonical,
  classify,
  configHash,
  day,
  estimate,
  hash,
  validateConfig,
} from "../src/domain/engine/core";
import {
  family,
  selectReflection,
  streak,
  supportEligible,
} from "../src/domain/engine/reflections";
import {
  eligible,
  informationGain,
  selectBase,
  selectFourth,
} from "../src/domain/engine/questions";
import { catalog, contentStatus } from "../src/infrastructure/catalog";
import { runProductionSimulation } from "./engine-simulation";
import { candidate, fixtureCatalog, observation as o } from "./fixtures";

describe("normative S1–S8", () => {
  test("S1: positive requires independent, concordant evidence", () => {
    const e = estimate([o("a", 0.6), o("b", 0.4)]);
    expect(e.valence.mu).toBeCloseTo(0.5, 12);
    expect(e.valence.variance).toBeCloseTo(0.01, 12);
    expect(e.valence.confidence).toBeCloseTo(0.66, 12);
    expect(classify(e)).toEqual({ mode: "positive", distress: false });
  });
  test("S2: distress stays internal", () => {
    const e = estimate([o("a", -0.6), o("b", -0.5)]);
    expect(e.valence.confidence).toBeCloseTo(0.665, 12);
    expect(classify(e)).toEqual({ mode: "nonlabel", distress: true });
  });
  test("S3: conflict gives useful fourth without promising a label", () => {
    const obs = [o("a", 0.8), o("b", -0.6), o("c", 0.2, "connection")];
    const q = candidate([-0.8, 0, 0.8]);
    expect(estimate(obs).valence.confidence).toBeCloseTo(0.34, 12);
    expect(informationGain(obs, q).gain).toBeGreaterThanOrEqual(0.08);
    expect(selectFourth([q], obs, [], "2026-10-25", [], "seed")?.reason).toBe(
      "CONFLICT",
    );
    const after = estimate([
      ...obs,
      {
        questionId: q.id,
        primaryDimension: q.primaryDimension,
        answer: q.answers[1],
      },
    ]);
    expect(after.valence.mu).toBeCloseTo(1 / 15, 12);
    expect(after.valence.confidence).toBeCloseTo(0.5704444444444444, 12);
    expect(classify(after).mode).toBe("nonlabel");
  });
  test("S4: skipped primary vetoes an otherwise useful question", () => {
    const obs = [o("a", null), o("b", 0.8), o("c", 0.2, "connection")];
    expect(
      selectFourth(
        [candidate([-0.8, 0, 0.8])],
        obs,
        [],
        "2026-10-25",
        [],
        "seed",
      ),
    ).toBeNull();
  });
  test("S5: activation is not distress; S6: unequal weights are insufficient", () => {
    const e = estimate([o("a", 0.9, "activation"), o("b", 0.7, "activation")]);
    expect(e.valence.mu).toBeNull();
    expect(e.tension.mu).toBeNull();
    expect(classify(e)).toEqual({ mode: "nonlabel", distress: false });
    expect(family(e)).toBe("fam_activation_high");
    expect(
      classify(estimate([o("a", 0.9), o("b", 0.8, "valence", 0.1)])).mode,
    ).toBe("nonlabel");
  });
  test("S7: zero differs from missing and skips never contribute", () => {
    expect(estimate([]).valence.mu).toBeNull();
    const e = estimate([o("a", 0), o("b", 0)]);
    expect(e.valence.mu).toBe(0);
    expect(e.valence.confidence).toBeCloseTo(2 / 3, 12);
    expect(classify(e).mode).toBe("nonlabel");
    expect(estimate([o("a", 0), o("b", 0), o("c", null)])).toEqual(e);
  });
  test("S8: inclusive five calendar dates and seven-day support cooldown", () => {
    const current = { date: "2026-10-24", state: "completed", distress: true };
    const previous = [20, 22].map((d) => ({
      ...current,
      date: `2026-10-${d}`,
    }));
    expect(supportEligible(current, previous, null)).toBe(true);
    expect(supportEligible(current, previous, "2026-10-18")).toBe(false);
    expect(supportEligible(current, previous, "2026-10-17")).toBe(true);
    expect(
      supportEligible({ ...current, distress: false }, previous, null),
    ).toBe(false);
    expect(
      supportEligible(
        current,
        [{ ...current, date: "2026-10-19" }, previous[1]],
        null,
      ),
    ).toBe(false);
    expect(supportEligible(current, [previous[0], previous[0]], null)).toBe(
      false,
    );
  });
});
test("inclusive classification thresholds and independent contexts", () => {
  for (const v of [0.35, -0.35])
    expect(classify(estimate([o("a", v), o("b", v)]))).toEqual({
      mode: v > 0 ? "positive" : "nonlabel",
      distress: v < 0,
    });
  expect(classify(estimate([o("a", 0.349999), o("b", 0.349999)])).mode).toBe(
    "nonlabel",
  );
  const e = estimate([
    o("a", 0.6),
    o("b", 0.6),
    o("c", 0.8, "mentalLoad"),
    o("d", 0.8, "mentalLoad"),
  ]);
  expect(family(e)).toBe("fam_positive_grounded");
  expect(family(estimate([o("a", 0.7, "tension")]))).toBe(
    "fam_neutral_generic",
  );
  expect(
    family(estimate([o("a", 0.7, "tension"), o("b", 0.7, "tension")])),
  ).toBe("fam_tension");
});
test("unsafe inputs, duplicate evidence, invalid config, incompatible approval are rejected", () => {
  expect(() => estimate([o("a", 1.1)])).toThrow();
  expect(() => estimate([o("a", 0.1), o("a", 0.1)])).toThrow();
  expect(() => estimate([o("a", 0.1, "valence", 0)])).toThrow();
  expect(() =>
    validateConfig({ ...C, baseWeights: { ...C.baseWeights, novelty: 0.5 } }),
  ).toThrow();
  expect(contentStatus()).toBe("pending_review");
  expect(() => selectBase(catalog.questions, "2026-10-25", [], "seed")).toThrow(
    "NO_ELIGIBLE_TRIO",
  );
  expect(configHash).toHaveLength(64);
  expect(hash("abc")).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});
test("Q4 requires two answers, distinct vectors, actual gain, and only runs after Q3", () => {
  const q = candidate([0.6, 0.6, 0.6]);
  expect(
    selectFourth(
      [q],
      [o("a", 0.8), o("b", -0.6), o("c", 0.1, "tension")],
      [],
      "2026-10-25",
      [],
      "seed",
    ),
  ).toBeNull();
  expect(
    selectFourth(
      [candidate([-1, 0, 1])],
      [o("a", 0.8), o("b", null), o("c", null)],
      [],
      "2026-10-25",
      [],
      "seed",
    ),
  ).toBeNull();
  expect(
    selectFourth(
      [candidate([-1, 0, 1])],
      [o("a", 0.8), o("b", -0.6)],
      [],
      "2026-10-25",
      [],
      "seed",
    ),
  ).toBeNull();
});
test("hard cooldown includes today and D+30, opens D+31; IDs remain blocked across revisions", () => {
  const q = fixtureCatalog.questions[0];
  const history = [{ questionId: q.id, date: "2026-03-01" }];
  expect(eligible(q, "2026-03-01", history)).toBe(false);
  expect(eligible({ ...q, revision: 2 }, "2026-03-31", history)).toBe(false);
  expect(eligible(q, "2026-04-01", history)).toBe(true);
  expect(day("2026-09-07") - day("2026-09-06")).toBe(1);
  expect(() => day("2026-02-30")).toThrow();
});
test("reflection selection keeps family and safety when seven-day preference is exhausted", () => {
  const refs = fixtureCatalog.reflections.filter(
    (r) => r.familyId === "fam_activation_high",
  );
  const history = refs.map((r) => ({
    id: r.id,
    familyId: r.familyId,
    date: "2026-10-24",
  }));
  const selected = selectReflection(
    refs,
    "fam_activation_high",
    "2026-10-25",
    history,
    "seed",
  );
  expect(selected.cooldownRelaxed).toBe(true);
  expect(selected.reflection.familyId).toBe("fam_activation_high");
  expect(() =>
    selectReflection(
      catalog.reflections,
      "fam_activation_high",
      "2026-10-25",
      [],
      "seed",
    ),
  ).toThrow();
});
test("family balances last seven sessions, then fixed priority", () => {
  const e = estimate([
    o("a", 0.6, "tension"),
    o("b", 0.6, "tension"),
    o("c", 0.6, "mentalLoad"),
    o("d", 0.6, "mentalLoad"),
  ]);
  expect(family(e)).toBe("fam_tension");
  expect(family(e, ["fam_tension"])).toBe("fam_mental_load");
});
test("streak gracefully restarts without imputing gaps", () => {
  expect(streak(["2026-10-23", "2026-10-24"], "2026-10-25")).toBe(2);
  expect(streak(["2026-10-21"], "2026-10-25")).toBe(0);
  expect(streak(["2026-10-21", "2026-10-25"], "2026-10-25")).toBe(1);
});
test("100,000 synthetic samples preserve range, ordering and skip invariance", () => {
  let seed = 7123;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (let i = 0; i < 100000; i++) {
    const obs = Array.from({ length: 1 + (i % 4) }, (_, j) =>
      o(`q${j}`, 2 * random() - 1, "valence", 0.01 + 0.99 * random()),
    );
    const e = estimate(obs),
      v = e.valence;
    expect(v.mu).toBeGreaterThanOrEqual(-1);
    expect(v.mu).toBeLessThanOrEqual(1);
    expect(v.confidence).toBeGreaterThanOrEqual(0);
    expect(v.confidence).toBeLessThanOrEqual(0.85);
    if (i % 100 === 0) {
      expect(estimate([...obs].reverse())).toEqual(e);
      expect(estimate([...obs, o("skip", null)])).toEqual(e);
    }
  }
}, 60000);
test("365 days at four exposures per day maintain absolute cooldown and determinism", () => {
  const history: { questionId: string; date: string }[] = [];
  for (let i = 0; i < 365; i++) {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    const { chosen } = selectBase(
      fixtureCatalog.questions,
      date,
      history,
      `test-${i}`,
    );
    expect(chosen).toHaveLength(3);
    expect(chosen[0].intensity).toBe("gentle");
    expect(new Set(chosen.map((q) => q.narrativeTemplateId)).size).toBe(3);
    const fourth = fixtureCatalog.questions.find(
      (q) =>
        eligible(q, date, history) &&
        chosen.every(
          (x) =>
            x.id !== q.id &&
            x.narrativeTemplateId !== q.narrativeTemplateId &&
            x.semanticClusterId !== q.semanticClusterId,
        ),
    )!;
    expect(fourth).toBeDefined();
    for (const q of [...chosen, fourth]) {
      expect(eligible(q, date, history)).toBe(true);
      history.push({ questionId: q.id, date });
    }
    if (i === 0)
      expect(
        canonical(
          selectBase(fixtureCatalog.questions, date, [], "test-0").chosen,
        ),
      ).toBe(canonical(chosen));
  }
}, 60000);
test("production TypeScript engine simulation across all 8 profiles and 4/day capacity stress", () => {
  const seeds = Number(process.env.ENGINE_SIM_SEEDS ?? 16);
  const summary = runProductionSimulation(seeds, 365);
  if (process.env.ENGINE_SIM_LOG === "1") {
    console.log(JSON.stringify(summary, null, 2));
  }
  expect(summary.passed).toBe(true);
  expect(summary.contentVersion).toBe("1.0.0-draft.3");
  expect(summary.contentPackHash).toBe(
    "81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c",
  );
  expect(summary.counts.sessions).toBe(seeds * 365);
  expect(summary.counts.exhaustedSessions).toBe(0);
  expect(summary.counts.repetitionViolations).toBe(0);
  expect(summary.strictBaseRatio).toBeGreaterThanOrEqual(0.95);
  expect(summary.counts.fullHistoryCrossChecks).toBe(Math.min(seeds, 2) * 365);
  expect(summary.stress.sessions).toBe(seeds * 365);
  expect(summary.stress.exhaustedSessions).toBe(0);
  expect(summary.stress.repetitionViolations).toBe(0);
  expect(summary.stress.first30DistinctMinimum).toBe(120);
}, 240000);
