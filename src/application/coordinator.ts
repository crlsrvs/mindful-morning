import {
  C,
  configHash,
  hash,
  estimate,
  classify,
  Observation,
} from "../domain/engine/core";
import { selectBase, selectFourth } from "../domain/engine/questions";
import {
  family,
  selectReflection,
  supportEligible,
  streak,
} from "../domain/engine/reflections";
import type { Catalog } from "../domain/catalog";
import type { Clock, Repository, Session, StoreState, Settings } from "./model";
export class SessionCoordinator {
  constructor(
    private repo: Repository,
    private clock: Clock,
    private catalog: Catalog,
    private ready: () => boolean,
    private localPreview = false,
  ) {}
  read() {
    return this.repo.read();
  }
  private expire(state: StoreState) {
    for (const s of state.sessions)
      if (
        s.state === "active" &&
        (s.localDate !== this.clock.localDate() ||
          s.configHash !== configHash ||
          s.contentPackHash !== this.catalog.manifest.hash)
      ) {
        s.state = "expired";
        s.finishedAt = this.clock.utc();
      }
  }
  refresh() {
    return this.repo.transact((state) => {
      this.expire(state);
    });
  }
  settings(
    patch: Partial<
      Pick<
        Settings,
        | "onboardingCompleted"
        | "reminderEnabled"
        | "reminderTime"
        | "streakEnabled"
      >
    >,
  ) {
    if (
      patch.reminderTime !== undefined &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(patch.reminderTime)
    )
      return Promise.reject(new Error("INVALID_TIME"));
    return this.repo.transact((state) => {
      Object.assign(state.settings, patch);
    });
  }
  start() {
    return this.createSession(false);
  }
  startAnotherPreview() {
    if (typeof __DEV__ === "undefined" || !__DEV__ || !this.localPreview)
      return Promise.reject(new Error("PREVIEW_ONLY"));
    return this.createSession(true);
  }
  private createSession(allowSameDayRepeat: boolean) {
    return this.repo.transact((state) => {
      this.expire(state);
      const date = this.clock.localDate();
      const todaySessions = state.sessions.filter((s) => s.localDate === date);
      const active = todaySessions.find((s) => s.state === "active");
      if (active) {
        if (allowSameDayRepeat) throw new Error("ACTIVE_SESSION_EXISTS");
        return active.id;
      }
      if (todaySessions.length > 0 && !allowSameDayRepeat)
        throw new Error("DAY_ALREADY_USED");
      if (todaySessions.length === 0 && allowSameDayRepeat)
        throw new Error("NO_PRIOR_SESSION_TODAY");
      if (!this.ready()) throw new Error("CONTENT_NOT_APPROVED");
      const m = this.catalog.manifest;
      const seedInput =
        todaySessions.length === 0
          ? `${state.settings.installRandomId}|${date}|${C.engineVersion}|${m.hash}`
          : `${state.settings.installRandomId}|${date}|${C.engineVersion}|${m.hash}|preview:${todaySessions.length + 1}`;
      const seed = hash(seedInput);
      const history = state.sessions.flatMap((s) =>
        s.exposures.map((q) => ({
          questionId: q.snapshot.id,
          date: s.localDate,
        })),
      );
      const base = selectBase(
        this.catalog.questions,
        date,
        history,
        seed,
        this.localPreview,
      );
      const session: Session = {
        id: this.clock.uuid(),
        localDate: date,
        startedAt: this.clock.utc(),
        finishedAt: null,
        timeZoneId: this.clock.timeZone(),
        utcOffsetAtStartMinutes: this.clock.offsetMinutes(),
        sessionContext: "morning_intent",
        timeOfDay: "morning",
        locale: "es-CL",
        baselineVersion: null,
        state: "active",
        seed,
        engineVersion: C.engineVersion,
        configHash,
        contentPackId: m.packId,
        contentPackVersion: m.version,
        contentPackHash: m.hash,
        planned: base.chosen,
        exposures: [],
        fourthEvaluated: false,
        estimate: null,
        closureMode: null,
        distressConsistent: false,
        reflection: null,
        support: null,
        rationaleCodes: [
          ...(this.localPreview ? ["LOCAL_PREVIEW"] : []),
          ...(allowSameDayRepeat ? ["LOCAL_PREVIEW_REPEAT"] : []),
          `BASE_RELAXATION_${base.relaxation}`,
        ],
        streakCount: 0,
      };
      state.sessions.push(session);
      this.expose(session);
      return session.id;
    });
  }
  private expose(s: Session) {
    const q = s.planned[s.exposures.length];
    s.exposures.push({
      snapshot: q,
      firstShownAt: this.clock.utc(),
      activeSeconds: 0,
      status: "pending",
      answerId: null,
      answeredAt: null,
    });
  }
  checkpoint(id: string, questionId: string, seconds: number) {
    return this.repo.transact((state) => {
      this.expire(state);
      const s = state.sessions.find((s) => s.id === id);
      const q = s?.exposures.at(-1);
      if (
        s?.state === "active" &&
        q?.snapshot.id === questionId &&
        q.status === "pending" &&
        Number.isFinite(seconds)
      )
        q.activeSeconds = Math.max(
          q.activeSeconds,
          Math.min(C.reflectionWaitSeconds, Math.floor(seconds)),
        );
    });
  }
  answer(id: string, questionId: string, answerId: string | null) {
    return this.repo.transact((state) => {
      this.expire(state);
      const s = state.sessions.find((s) => s.id === id);
      const q = s?.exposures.at(-1);
      if (
        !s ||
        s.state !== "active" ||
        !q ||
        q.snapshot.id !== questionId ||
        q.status !== "pending"
      )
        return;
      if (
        answerId !== null &&
        (q.activeSeconds < C.reflectionWaitSeconds ||
          !q.snapshot.answers.some((a) => a.id === answerId))
      )
        throw new Error("ANSWER_NOT_AVAILABLE");
      q.status = answerId === null ? "skipped" : "answered";
      q.answerId = answerId;
      q.answeredAt = this.clock.utc();
      if (s.exposures.length < C.baseQuestionCount) {
        this.expose(s);
        return;
      }
      const observed: Observation[] = s.exposures.map((q) => ({
        questionId: q.snapshot.id,
        primaryDimension: q.snapshot.primaryDimension,
        answer:
          q.answerId === null
            ? null
            : q.snapshot.answers.find((a) => a.id === q.answerId)!,
      }));
      if (!s.fourthEvaluated) {
        s.fourthEvaluated = true;
        const history = state.sessions.flatMap((x) =>
          x.exposures.map((q) => ({
            questionId: q.snapshot.id,
            date: x.localDate,
          })),
        );
        const fourth = selectFourth(
          this.catalog.questions,
          observed,
          s.planned,
          s.localDate,
          history,
          s.seed,
          this.localPreview,
        );
        if (fourth) {
          s.planned.push(fourth.q);
          s.rationaleCodes.push(fourth.reason);
          this.expose(s);
          return;
        }
      }
      const e = estimate(observed),
        result = classify(e);
      const completed = state.sessions
        .filter((x) => x.state === "completed" && x.localDate <= s.localDate)
        .sort((a, b) => a.localDate.localeCompare(b.localDate));
      const fam = family(
        e,
        completed.map((x) => x.reflection!.familyId),
      );
      const history = completed.flatMap((x) =>
        [x.reflection, x.support]
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map((r) => ({ id: r.id, familyId: r.familyId, date: x.localDate })),
      );
      const selected = selectReflection(
        this.catalog.reflections,
        fam,
        s.localDate,
        history,
        s.seed,
        this.localPreview,
      );
      s.estimate = e;
      s.closureMode = result.mode;
      s.distressConsistent = result.distress;
      s.reflection = selected.reflection;
      s.state = "completed";
      s.finishedAt = this.clock.utc();
      s.rationaleCodes.push(
        result.mode === "positive"
          ? "POSITIVE_GROUNDED"
          : result.distress
            ? "DISTRESS_INTERNAL"
            : e.valence.mu === null
              ? "NO_VALENCE_EVIDENCE"
              : "NONLABEL",
        fam.toUpperCase(),
      );
      if (selected.cooldownRelaxed)
        s.rationaleCodes.push("REFLECTION_COOLDOWN_RELAXED");
      const current = {
        date: s.localDate,
        state: s.state,
        distress: s.distressConsistent,
      };
      if (
        supportEligible(
          current,
          completed.map((x) => ({
            date: x.localDate,
            state: x.state,
            distress: x.distressConsistent,
          })),
          state.settings.lastSupportDate,
        )
      ) {
        s.support = selectReflection(
          this.catalog.reflections,
          "fam_support_invitation",
          s.localDate,
          history,
          s.seed,
          this.localPreview,
        ).reflection;
        state.settings.lastSupportDate = s.localDate;
        s.rationaleCodes.push("SUPPORT_3_OF_5");
      }
      s.streakCount = streak(
        state.sessions
          .filter((x) => x.state === "completed")
          .map((x) => x.localDate),
        s.localDate,
      );
    });
  }
  abandon(id: string) {
    return this.repo.transact((state) => {
      this.expire(state);
      const s = state.sessions.find((x) => x.id === id);
      if (s?.state === "active") {
        s.state = "abandoned";
        s.finishedAt = this.clock.utc();
      }
    });
  }
}
