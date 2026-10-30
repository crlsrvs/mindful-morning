import type { Question, Reflection, Estimate } from "../domain/engine/core";
export interface Settings {
  onboardingCompleted: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  streakEnabled: boolean;
  lastSupportDate: string | null;
  installRandomId: string;
}
export const defaults = (id: string): Settings => ({
  onboardingCompleted: false,
  reminderEnabled: false,
  reminderTime: "09:00",
  streakEnabled: false,
  lastSupportDate: null,
  installRandomId: id,
});
export interface QuestionState {
  snapshot: Question;
  firstShownAt: string;
  activeSeconds: number;
  status: "pending" | "answered" | "skipped";
  answerId: string | null;
  answeredAt: string | null;
}
export interface Session {
  id: string;
  localDate: string;
  startedAt: string;
  finishedAt: string | null;
  timeZoneId: string;
  utcOffsetAtStartMinutes: number;
  sessionContext: "morning_intent";
  timeOfDay: "morning";
  locale: "es-CL";
  baselineVersion: null;
  state: "active" | "completed" | "abandoned" | "expired";
  seed: string;
  engineVersion: string;
  configHash: string;
  contentPackId: string;
  contentPackVersion: string;
  contentPackHash: string;
  planned: Question[];
  exposures: QuestionState[];
  fourthEvaluated: boolean;
  estimate: Estimate | null;
  closureMode: "positive" | "nonlabel" | null;
  distressConsistent: boolean;
  reflection: Reflection | null;
  support: Reflection | null;
  rationaleCodes: string[];
  streakCount: number;
}
export interface StoreState {
  settings: Settings;
  sessions: Session[];
}
export interface Repository {
  read(): Promise<StoreState>;
  transact<T>(update: (state: StoreState) => T): Promise<T>;
  erase(): Promise<void>;
}
export interface Clock {
  localDate(): string;
  utc(): string;
  timeZone(): string;
  offsetMinutes(): number;
  uuid(): string;
}
