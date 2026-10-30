import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { defaults, Repository } from "../application/model";
import { createRepository, exclusive } from "./repository";
import {
  schemaSQL,
  previewSchemaSQL,
  previewSchemaMigration2SQL,
} from "./schema";
import { hash } from "../domain/engine/core";
import { localPreviewEnabled } from "./local-preview";
const DB = "morning.db",
  KEY = localPreviewEnabled
    ? "mindful-morning-preview-db-v1"
    : "mindful-morning-db-v1";
const directory = new Directory(
  Paths.document,
  localPreviewEnabled ? "private-preview" : "private",
);
const sentinel = new File(directory, "install-v1");
const deletion = new File(directory, "delete-pending");
const dbFile = new File(directory, DB);
const keyOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

async function removeFiles() {
  for (const name of [DB, `${DB}-wal`, `${DB}-shm`]) {
    const file = new File(directory, name);
    if (file.exists) file.delete();
  }
  await SecureStore.deleteItemAsync(KEY);
  if (sentinel.exists) sentinel.delete();
}
export async function openRepository(): Promise<Repository> {
  directory.create({ intermediates: true, idempotent: true });
  if (deletion.exists) {
    await removeFiles();
    deletion.delete();
  }
  if (!sentinel.exists) {
    // An old iOS Keychain item must never resurrect a prior installation.
    if (dbFile.exists) throw new Error("INSTALL_SENTINEL_MISSING");
    await SecureStore.deleteItemAsync(KEY);
    sentinel.write("1");
  }
  let key = await SecureStore.getItemAsync(KEY);
  if (!key) {
    if (dbFile.exists) throw new Error("LOCAL_KEY_LOST");
    key = Array.from(await Crypto.getRandomBytesAsync(32), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    await SecureStore.setItemAsync(KEY, key, keyOptions);
  }
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("INVALID_LOCAL_KEY");
  const db = await SQLite.openDatabaseAsync(
    DB,
    { useNewConnection: true },
    directory.uri,
  );
  try {
    const cipher = await db.getFirstAsync<Record<string, string>>(
      "PRAGMA cipher_version",
    );
    if (
      !cipher ||
      !Object.values(cipher).some((v) => typeof v === "string" && v.length > 0)
    )
      throw new Error("ENCRYPTION_UNAVAILABLE");
    // PRAGMA key does not accept bound SQL parameters. Only RNG-generated hex is interpolated.
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    key = null;
    await db.execAsync(
      "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=2500;",
    );
    const version = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    const maxVersion = localPreviewEnabled ? 2 : 1;
    if ((version?.user_version ?? 0) > maxVersion)
      throw new Error("DATABASE_VERSION_UNSUPPORTED");
    if (!version?.user_version)
      await exclusive(db, async (tx) => {
        const sql = localPreviewEnabled ? previewSchemaSQL : schemaSQL;
        await tx.execAsync(sql);
        await tx.runAsync(
          "INSERT INTO app_settings(id,value_json) VALUES(1,?)",
          JSON.stringify(defaults(Crypto.randomUUID())),
        );
        await tx.runAsync(
          "INSERT INTO schema_migrations VALUES(1,?,?)",
          new Date().toISOString(),
          hash(sql),
        );
        if (localPreviewEnabled)
          await tx.runAsync(
            "INSERT INTO schema_migrations VALUES(2,?,?)",
            new Date().toISOString(),
            hash(previewSchemaMigration2SQL),
          );
        await tx.execAsync(`PRAGMA user_version=${maxVersion};`);
      });
    else if (localPreviewEnabled && version.user_version === 1) {
      await db.execAsync("PRAGMA foreign_keys=OFF;");
      await exclusive(db, async (tx) => {
        await tx.execAsync(previewSchemaMigration2SQL);
        await tx.runAsync(
          "INSERT INTO schema_migrations VALUES(2,?,?)",
          new Date().toISOString(),
          hash(previewSchemaMigration2SQL),
        );
        await tx.execAsync("PRAGMA user_version=2;");
      });
      await db.execAsync("PRAGMA foreign_keys=ON;");
    }
  } catch {
    await db.closeAsync();
    throw new Error("PRIVATE_STORAGE_UNAVAILABLE");
  }
  return createRepository(db, async () => {
    deletion.write("1");
    await db.closeAsync();
    await removeFiles();
    deletion.delete();
  });
}
/** Recovery is explicit and destructive; never invoked automatically for a lost key. */
export async function eraseUnavailableStorage() {
  directory.create({ intermediates: true, idempotent: true });
  deletion.write("1");
  await removeFiles();
  deletion.delete();
}
