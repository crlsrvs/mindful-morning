import type {
  Repository,
  StoreState,
  Session,
  Settings,
} from "../application/model";
export interface SqlConnection {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T | null>;
  getAllAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T[]>;
  runAsync(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<unknown>;
}
/** A single keyed connection and serialized queue avoid unkeyed transaction connections in Expo SQLite. */
export async function exclusive<T>(
  db: SqlConnection,
  task: (tx: SqlConnection) => Promise<T>,
): Promise<T> {
  await db.execAsync("BEGIN EXCLUSIVE");
  try {
    const result = await task(db);
    await db.execAsync("COMMIT");
    return result;
  } catch (error) {
    try {
      await db.execAsync("ROLLBACK");
    } catch {}
    throw error;
  }
}
async function load(db: SqlConnection): Promise<StoreState> {
  const settings = await db.getFirstAsync<{ value_json: string }>(
    "SELECT value_json FROM app_settings WHERE id=1",
  );
  if (!settings) throw new Error("MISSING_SETTINGS");
  const sessions = await db.getAllAsync<{ value_json: string }>(
    "SELECT value_json FROM sessions ORDER BY local_date, rowid",
  );
  return {
    settings: JSON.parse(settings.value_json) as Settings,
    sessions: sessions.map((x) => JSON.parse(x.value_json) as Session),
  };
}
export function createRepository(
  db: SqlConnection,
  erase: () => Promise<void>,
): Repository {
  let queue: Promise<unknown> = Promise.resolve();
  let closed = false;
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const next = queue.then(() => {
      if (closed) throw new Error("DATABASE_CLOSED");
      return fn();
    });
    queue = next.catch(() => {});
    return next;
  };
  return {
    read: () => serial(() => load(db)),
    transact: <T>(update: (s: StoreState) => T) =>
      serial(async () => {
        let result!: T;
        await exclusive(db, async (tx) => {
          const state = await load(tx);
          const original = new Map(
            state.sessions.map((s) => [s.id, JSON.stringify(s)]),
          );
          result = update(state);
          await tx.runAsync(
            "UPDATE app_settings SET value_json=? WHERE id=1",
            JSON.stringify(state.settings),
          );
          for (const s of state.sessions) {
            const json = JSON.stringify(s);
            if (original.get(s.id) === json) continue;
            await tx.runAsync(
              "INSERT INTO sessions VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,value_json=excluded.value_json",
              s.id,
              s.localDate,
              s.state,
              json,
            );
            for (const [i, q] of s.exposures.entries())
              await tx.runAsync(
                "INSERT INTO question_exposures VALUES(?,?,?,?,?,?) ON CONFLICT(session_id,sequence) DO UPDATE SET response_status=excluded.response_status,answer_id=excluded.answer_id,value_json=excluded.value_json",
                s.id,
                q.snapshot.id,
                i + 1,
                q.status,
                q.answerId,
                JSON.stringify(q),
              );
            if (s.estimate)
              await tx.runAsync(
                "INSERT OR IGNORE INTO engine_estimates VALUES(?,?)",
                s.id,
                JSON.stringify({
                  engineVersion: s.engineVersion,
                  configHash: s.configHash,
                  contentPackHash: s.contentPackHash,
                  estimate: s.estimate,
                  rationaleCodes: s.rationaleCodes,
                  derivedAt: s.finishedAt,
                }),
              );
            for (const [kind, r] of [
              ["closing", s.reflection],
              ["support", s.support],
            ] as const)
              if (r)
                await tx.runAsync(
                  "INSERT OR IGNORE INTO reflection_exposures VALUES(?,?,?,?)",
                  s.id,
                  kind,
                  r.id,
                  JSON.stringify(r),
                );
          }
        });
        return result;
      }),
    erase: () =>
      serial(async () => {
        await erase();
        closed = true;
      }),
  };
}
