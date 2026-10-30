/** Real SQLite transactions on Node; this suite does NOT claim native SQLCipher verification. */
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createRepository,
  SqlConnection,
  exclusive,
} from "../src/infrastructure/repository";
import {
  schemaSQL,
  previewSchemaSQL,
  previewSchemaMigration2SQL,
} from "../src/infrastructure/schema";
import { defaults } from "../src/application/model";
import { SessionCoordinator } from "../src/application/coordinator";
import { fakeClock, fixtureCatalog } from "./fixtures";
function adapter(db: DatabaseSync): SqlConnection {
  return {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    getFirstAsync: async <T>(
      sql: string,
      ...params: (string | number | null)[]
    ) => (db.prepare(sql).get(...params) as T) ?? null,
    getAllAsync: async <T>(
      sql: string,
      ...params: (string | number | null)[]
    ) => db.prepare(sql).all(...params) as T[],
    runAsync: async (sql, ...params) => db.prepare(sql).run(...params),
  };
}
test("real SQL persists across close/reopen, atomic final snapshots, uniqueness and delete", async () => {
  const dir = mkdtempSync(join(tmpdir(), "morning-synthetic-"));
  const path = join(dir, "test.db");
  let native = new DatabaseSync(path);
  try {
    native.exec("PRAGMA foreign_keys=ON;");
    native.exec(schemaSQL);
    native
      .prepare("INSERT INTO app_settings VALUES(1,?)")
      .run(JSON.stringify(defaults("test-install")));
    let repo = createRepository(adapter(native), async () => {
      native.close();
      rmSync(path);
    });
    const clock = fakeClock();
    let app = new SessionCoordinator(repo, clock, fixtureCatalog, () => true);
    const id = await app.start();
    let s = (await app.read()).sessions[0];
    await app.checkpoint(id, s.exposures[0].snapshot.id, 12);
    native.close();
    native = new DatabaseSync(path);
    native.exec("PRAGMA foreign_keys=ON;");
    repo = createRepository(adapter(native), async () => {
      native.close();
      rmSync(path);
    });
    app = new SessionCoordinator(repo, clock, fixtureCatalog, () => true);
    expect((await app.read()).sessions[0].exposures[0].activeSeconds).toBe(12);
    for (let i = 0; i < 3; i++) {
      s = (await app.read()).sessions[0];
      await app.answer(id, s.exposures.at(-1)!.snapshot.id, null);
    }
    expect((await app.read()).sessions[0].state).toBe("completed");
    expect(
      native.prepare("SELECT COUNT(*) n FROM engine_estimates").get()?.n,
    ).toBe(1);
    expect(
      native.prepare("SELECT COUNT(*) n FROM reflection_exposures").get()?.n,
    ).toBe(1);
    expect(() =>
      native
        .prepare("INSERT INTO sessions VALUES(?,?,?,?)")
        .run("duplicate", s.localDate, "active", "{}"),
    ).toThrow();
    expect(() =>
      native
        .prepare("INSERT INTO question_exposures VALUES(?,?,?,?,?,?)")
        .run("missing", "q", 1, "pending", null, "{}"),
    ).toThrow();
    await expect(
      exclusive(adapter(native), async (tx) => {
        await tx.runAsync(
          "UPDATE app_settings SET value_json=? WHERE id=1",
          "corrupted",
        );
        throw new Error("POWER_LOSS");
      }),
    ).rejects.toThrow("POWER_LOSS");
    expect((await app.read()).settings.installRandomId).toBe("test-install");
    await repo.erase();
  } finally {
    try {
      native.close();
    } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
});

test("preview SQL migration v1->v2 preserves existing sessions and allows multiple same-day sessions in insertion order", async () => {
  const dir = mkdtempSync(join(tmpdir(), "morning-preview-"));
  const path = join(dir, "preview.db");
  const native = new DatabaseSync(path);
  try {
    native.exec("PRAGMA foreign_keys=ON;");
    native.exec(schemaSQL);
    native
      .prepare("INSERT INTO app_settings VALUES(1,?)")
      .run(JSON.stringify(defaults("preview-install")));
    const repo = createRepository(adapter(native), async () => {
      native.close();
      rmSync(path);
    });
    const clock = fakeClock();
    const app = new SessionCoordinator(
      repo,
      clock,
      fixtureCatalog,
      () => true,
      true,
    );
    const id1 = await app.start();
    for (let i = 0; i < 3; i++) {
      const s = (await app.read()).sessions.find((x) => x.id === id1)!;
      await app.answer(id1, s.exposures.at(-1)!.snapshot.id, null);
    }
    native.exec("PRAGMA foreign_keys=OFF;");
    native.exec(previewSchemaMigration2SQL);
    native.exec("PRAGMA foreign_keys=ON;");
    const id2 = await app.startAnotherPreview();
    for (let i = 0; i < 3; i++) {
      const s = (await app.read()).sessions.find((x) => x.id === id2)!;
      await app.answer(id2, s.exposures.at(-1)!.snapshot.id, null);
    }
    const sessions = (await app.read()).sessions;
    expect(sessions.map((s) => s.id)).toEqual([id1, id2]);
    expect(sessions.every((s) => s.state === "completed")).toBe(true);
    expect(
      native.prepare("SELECT COUNT(*) n FROM question_exposures").get()?.n,
    ).toBe(6);
    expect(
      native.prepare("SELECT COUNT(*) n FROM engine_estimates").get()?.n,
    ).toBe(2);
    expect(
      native.prepare("SELECT COUNT(*) n FROM reflection_exposures").get()?.n,
    ).toBe(2);
    expect(previewSchemaSQL).not.toContain("local_date TEXT NOT NULL UNIQUE");
  } finally {
    try {
      native.close();
    } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
});
