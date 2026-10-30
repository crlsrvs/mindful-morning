export const schemaSQL = `
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at_utc TEXT NOT NULL, checksum TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS app_settings(id INTEGER PRIMARY KEY CHECK(id=1), value_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, local_date TEXT NOT NULL UNIQUE, state TEXT NOT NULL CHECK(state IN ('active','completed','abandoned','expired')), value_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS question_exposures(session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, question_id TEXT NOT NULL, sequence INTEGER NOT NULL CHECK(sequence BETWEEN 1 AND 4), response_status TEXT NOT NULL, answer_id TEXT, value_json TEXT NOT NULL, PRIMARY KEY(session_id,sequence), UNIQUE(session_id,question_id), CHECK((response_status='answered' AND answer_id IS NOT NULL) OR (response_status IN ('pending','skipped') AND answer_id IS NULL)));
CREATE INDEX IF NOT EXISTS exposures_question ON question_exposures(question_id);
CREATE TABLE IF NOT EXISTS engine_estimates(session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE, value_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reflection_exposures(session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, kind TEXT NOT NULL, reflection_id TEXT NOT NULL, value_json TEXT NOT NULL, PRIMARY KEY(session_id,kind));
`;
export const previewSchemaSQL = schemaSQL.replace(
  "local_date TEXT NOT NULL UNIQUE",
  "local_date TEXT NOT NULL",
);
export const previewSchemaMigration2SQL = `
CREATE TABLE sessions_v2(id TEXT PRIMARY KEY, local_date TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('active','completed','abandoned','expired')), value_json TEXT NOT NULL);
INSERT INTO sessions_v2 SELECT id, local_date, state, value_json FROM sessions;
DROP TABLE sessions;
ALTER TABLE sessions_v2 RENAME TO sessions;
CREATE INDEX IF NOT EXISTS sessions_local_date ON sessions(local_date, state);
`;
