import { SessionCoordinator } from "../src/application/coordinator";
import { ForegroundTimer } from "../src/domain/session/timer";
import { MemoryRepository, fakeClock, fixtureCatalog } from "./fixtures";
import { configHash } from "../src/domain/engine/core";
function setup() {
  const repo = new MemoryRepository(),
    clock = fakeClock();
  const app = new SessionCoordinator(repo, clock, fixtureCatalog, () => true);
  return { repo, clock, app };
}
async function skip(app: SessionCoordinator) {
  const s = (await app.read()).sessions.at(-1)!;
  await app.answer(s.id, s.exposures.at(-1)!.snapshot.id, null);
}
test("all skips complete exactly three, no signals, no fourth, immutable closing", async () => {
  const { app } = setup();
  await app.start();
  await skip(app);
  await skip(app);
  await skip(app);
  const state = await app.read(),
    s = state.sessions[0];
  expect(s.state).toBe("completed");
  expect(s.exposures).toHaveLength(3);
  expect(s.reflection?.familyId).toBe("fam_neutral_generic");
  expect(s.estimate?.valence.mu).toBeNull();
  await app.refresh();
  expect((await app.read()).sessions[0]).toEqual(s);
  await expect(app.start()).rejects.toThrow("DAY_ALREADY_USED");
});
test("exposure precedes response and waiting enforced by application, not just UI", async () => {
  const { app } = setup();
  const id = await app.start();
  let s = (await app.read()).sessions[0];
  expect(s.exposures).toHaveLength(1);
  const q = s.exposures[0];
  await expect(
    app.answer(id, q.snapshot.id, q.snapshot.answers[0].id),
  ).rejects.toThrow("ANSWER_NOT_AVAILABLE");
  await app.checkpoint(id, q.snapshot.id, 25);
  await app.answer(id, q.snapshot.id, q.snapshot.answers[0].id);
  s = (await app.read()).sessions[0];
  expect(s.exposures).toHaveLength(2);
  expect(s.exposures[0].status).toBe("answered");
});
test("foreground timer pauses without wall-clock credit, restore retains persisted seconds", () => {
  const timer = new ForegroundTimer(0, 25);
  timer.resume(0);
  timer.tick(10000);
  timer.pause(10000);
  timer.tick(310000);
  expect(timer.seconds).toBe(10);
  const restored = new ForegroundTimer(timer.checkpoint, 25);
  restored.resume(400000);
  restored.tick(414999);
  expect(restored.ready).toBe(false);
  restored.tick(415000);
  expect(restored.ready).toBe(true);
});
test("crash rollback retains pending question; reload resumes committed wait", async () => {
  const { repo, app, clock } = setup();
  await app.start();
  const before = await app.read(),
    s = before.sessions[0],
    q = s.exposures[0];
  await app.checkpoint(s.id, q.snapshot.id, 10.9);
  repo.failNext = true;
  await expect(app.answer(s.id, q.snapshot.id, null)).rejects.toThrow(
    "SIMULATED_POWER_LOSS",
  );
  const recovered = new SessionCoordinator(
    repo,
    clock,
    fixtureCatalog,
    () => true,
  );
  await recovered.refresh();
  const restored = (await recovered.read()).sessions[0];
  expect(restored.exposures).toHaveLength(1);
  expect(restored.exposures[0].activeSeconds).toBe(10);
  expect(restored.exposures[0].status).toBe("pending");
});
test("double taps serialize and cannot answer two different questions", async () => {
  const { app } = setup();
  await Promise.all([app.start(), app.start()]);
  expect((await app.read()).sessions).toHaveLength(1);
  const s = (await app.read()).sessions[0],
    q = s.exposures[0];
  await Promise.all([
    app.answer(s.id, q.snapshot.id, null),
    app.answer(s.id, q.snapshot.id, null),
  ]);
  expect((await app.read()).sessions[0].exposures).toHaveLength(2);
});
test("abandonment is terminal; midnight and incompatible updates expire safely", async () => {
  const { app, clock, repo } = setup();
  const id = await app.start();
  await app.abandon(id);
  await expect(app.start()).rejects.toThrow();
  clock.date = "2026-10-26";
  await app.start();
  clock.date = "2026-10-27";
  await app.refresh();
  expect((await app.read()).sessions[1].state).toBe("expired");
  await app.start();
  repo.state.sessions[2].configHash = "old-config";
  await app.refresh();
  expect((await app.read()).sessions[2].state).toBe("expired");
  expect(repo.state.sessions[0].localDate).toBe("2026-10-25");
  expect(configHash).not.toBe("old-config");
});
test("final commit rollback cannot leave a half-completed session", async () => {
  const { app, repo } = setup();
  await app.start();
  await skip(app);
  await skip(app);
  repo.failNext = true;
  await expect(skip(app)).rejects.toThrow();
  const partial = (await app.read()).sessions[0];
  expect(partial.state).toBe("active");
  expect(partial.reflection).toBeNull();
  expect(partial.exposures[2].status).toBe("pending");
  await skip(app);
  expect((await app.read()).sessions[0].state).toBe("completed");
});
test("blocked catalogue starts no session; deletion restores opt-out defaults", async () => {
  const repo = new MemoryRepository();
  const app = new SessionCoordinator(
    repo,
    fakeClock(),
    fixtureCatalog,
    () => false,
  );
  await expect(app.start()).rejects.toThrow("CONTENT_NOT_APPROVED");
  expect((await app.read()).sessions).toHaveLength(0);
  await app.settings({ onboardingCompleted: true, streakEnabled: true });
  await repo.erase();
  expect((await repo.read()).settings.onboardingCompleted).toBe(false);
  expect((await repo.read()).settings.reminderEnabled).toBe(false);
});
