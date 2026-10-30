import { openRepository } from "../src/infrastructure/database";
import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
const mockFiles = new Map<string, string>();
jest.mock("expo-file-system", () => ({
  Paths: { document: "document" },
  Directory: class {
    uri = "document/private";
    create() {}
  },
  File: class {
    key: string;
    constructor(_directory: unknown, name: string) {
      this.key = name;
    }
    get exists() {
      return mockFiles.has(this.key);
    }
    write(value: string) {
      mockFiles.set(this.key, value);
    }
    delete() {
      mockFiles.delete(this.key);
    }
  },
}));
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: jest.fn() }));
jest.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async () => new Uint8Array(32).fill(123)),
  randomUUID: jest.fn(() => "synthetic-id"),
}));
beforeEach(() => {
  mockFiles.clear();
  mockFiles.set("install-v1", "1");
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue("ab".repeat(32));
});
test("missing SQLCipher closes immediately without writing plaintext session tables", async () => {
  const db = {
    getFirstAsync: jest.fn(async () => null),
    execAsync: jest.fn(),
    closeAsync: jest.fn(async () => {}),
  };
  jest
    .mocked(SQLite.openDatabaseAsync)
    .mockResolvedValue(db as unknown as SQLite.SQLiteDatabase);
  await expect(openRepository()).rejects.toThrow("PRIVATE_STORAGE_UNAVAILABLE");
  expect(db.closeAsync).toHaveBeenCalledTimes(1);
  expect(db.execAsync).not.toHaveBeenCalled();
});
test("missing key for an existing database never replaces it with a fresh key", async () => {
  mockFiles.set("morning.db", "synthetic");
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  await expect(openRepository()).rejects.toThrow("LOCAL_KEY_LOST");
  expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});
test("invalid stored key cannot enter a SQL pragma", async () => {
  jest
    .mocked(SecureStore.getItemAsync)
    .mockResolvedValue("'; DROP TABLE sessions; --");
  await expect(openRepository()).rejects.toThrow("INVALID_LOCAL_KEY");
  expect(SQLite.openDatabaseAsync).not.toHaveBeenCalled();
});
