import {
  catalog,
  contentStatus,
  contentAvailableForSession,
} from "../src/infrastructure/catalog";
import { selectable } from "../src/domain/engine/core";
import { eligible } from "../src/domain/engine/questions";
import { SessionCoordinator } from "../src/application/coordinator";
import { MemoryRepository, fakeClock } from "./fixtures";

test("authorized development preview completes a draft session without changing approval metadata", async () => {
  const before = JSON.stringify(catalog);
  expect(contentStatus()).toBe("pending_review");
  expect(contentAvailableForSession()).toBe(true);
  const app = new SessionCoordinator(
    new MemoryRepository(),
    fakeClock(),
    catalog,
    contentAvailableForSession,
    true,
  );
  await app.start();
  for (let i = 0; i < 3; i++) {
    const session = (await app.read()).sessions[0];
    await app.answer(session.id, session.exposures.at(-1)!.snapshot.id, null);
  }
  const session = (await app.read()).sessions[0];
  expect(session.state).toBe("completed");
  expect(session.reflection?.quality.status).toBe("draft");
  expect(session.rationaleCodes).toContain("LOCAL_PREVIEW");
  expect(JSON.stringify(catalog)).toBe(before);
  await expect(app.start()).rejects.toThrow("DAY_ALREADY_USED");
});

test("preview preserves cooldown and excludes rejected or revision-needed content", () => {
  const q = catalog.questions[0];
  expect(eligible(q, "2026-10-28", [], true)).toBe(true);
  expect(eligible(q, "2026-10-28", [], false)).toBe(false);
  expect(
    eligible(q, "2026-10-28", [{ questionId: q.id, date: "2026-10-27" }], true),
  ).toBe(false);
  for (const status of ["rejected", "needs_revision"] as const)
    expect(selectable({ ...q.quality, status }, true)).toBe(false);
});

test("production cannot activate preview even with an explicit selection request", () => {
  const previous = __DEV__;
  try {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    expect(selectable(catalog.questions[0].quality, true)).toBe(false);
    jest.isolateModules(() => {
      const mode = require("../src/infrastructure/local-preview");
      const runtime = require("../src/infrastructure/catalog");
      expect(mode.localPreviewEnabled).toBe(false);
      expect(runtime.contentAvailableForSession()).toBe(false);
    });
  } finally {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = previous;
  }
});

test("preview never overrides an invalid content hash", () => {
  const original = catalog.manifest.hash;
  try {
    (catalog.manifest as { hash: string }).hash = "invalid";
    expect(contentStatus()).toBe("invalid");
    expect(contentAvailableForSession()).toBe(false);
  } finally {
    (catalog.manifest as { hash: string }).hash = original;
  }
});

test("startAnotherPreview allows repeated same-day local runs without overwriting prior sessions or questions", async () => {
  const app = new SessionCoordinator(
    new MemoryRepository(),
    fakeClock(),
    catalog,
    contentAvailableForSession,
    true,
  );
  await expect(app.startAnotherPreview()).rejects.toThrow(
    "NO_PRIOR_SESSION_TODAY",
  );
  const firstId = await app.start();
  await expect(app.startAnotherPreview()).rejects.toThrow(
    "ACTIVE_SESSION_EXISTS",
  );
  for (let i = 0; i < 3; i++) {
    const s = (await app.read()).sessions.find((x) => x.id === firstId)!;
    await app.answer(s.id, s.exposures.at(-1)!.snapshot.id, null);
  }
  await expect(app.start()).rejects.toThrow("DAY_ALREADY_USED");
  const secondId = await app.startAnotherPreview();
  expect(secondId).not.toBe(firstId);
  await expect(app.startAnotherPreview()).rejects.toThrow(
    "ACTIVE_SESSION_EXISTS",
  );
  for (let i = 0; i < 3; i++) {
    const s = (await app.read()).sessions.find((x) => x.id === secondId)!;
    await app.answer(s.id, s.exposures.at(-1)!.snapshot.id, null);
  }
  const state = await app.read();
  expect(state.sessions).toHaveLength(2);
  const [first, second] = state.sessions;
  expect(first.id).toBe(firstId);
  expect(second.id).toBe(secondId);
  expect(first.state).toBe("completed");
  expect(second.state).toBe("completed");
  expect(first.seed).not.toBe(second.seed);
  expect(second.rationaleCodes).toContain("LOCAL_PREVIEW");
  expect(second.rationaleCodes).toContain("LOCAL_PREVIEW_REPEAT");
  const firstQuestions = new Set(first.exposures.map((q) => q.snapshot.id));
  for (const q of second.exposures)
    expect(firstQuestions.has(q.snapshot.id)).toBe(false);
});

test("startAnotherPreview works after abandoning a preview session and is blocked outside local preview", async () => {
  const previewApp = new SessionCoordinator(
    new MemoryRepository(),
    fakeClock(),
    catalog,
    contentAvailableForSession,
    true,
  );
  const id1 = await previewApp.start();
  await previewApp.abandon(id1);
  const id2 = await previewApp.startAnotherPreview();
  expect(id2).not.toBe(id1);
  const sessions = (await previewApp.read()).sessions;
  expect(sessions).toHaveLength(2);
  expect(sessions[0].state).toBe("abandoned");
  expect(sessions[1].state).toBe("active");

  const normalApp = new SessionCoordinator(
    new MemoryRepository(),
    fakeClock(),
    catalog,
    () => true,
    false,
  );
  await expect(normalApp.startAnotherPreview()).rejects.toThrow("PREVIEW_ONLY");
  const previous = __DEV__;
  try {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    await expect(previewApp.startAnotherPreview()).rejects.toThrow(
      "PREVIEW_ONLY",
    );
  } finally {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = previous;
  }
});
