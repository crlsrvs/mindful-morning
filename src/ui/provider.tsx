import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { AppState } from "react-native";
import { SessionCoordinator } from "../application/coordinator";
import type { Repository, StoreState, Settings } from "../application/model";
import {
  openRepository,
  eraseUnavailableStorage,
} from "../infrastructure/database";
import { catalog, contentAvailableForSession } from "../infrastructure/catalog";
import { localPreviewEnabled } from "../infrastructure/local-preview";
import {
  clock,
  cancelReminders,
  reconcileReminder,
} from "../infrastructure/system";
interface ViewState {
  data: StoreState | null;
  loading: boolean;
  error: string | null;
}
const initial: ViewState = { data: null, loading: true, error: null };
function reducer(state: ViewState, action: Partial<ViewState>): ViewState {
  return { ...state, ...action };
}
interface AppContext extends ViewState {
  coordinator: SessionCoordinator | null;
  reload: () => Promise<void>;
  run: (fn: () => Promise<unknown>) => Promise<boolean>;
  saveSettings: (
    patch: Partial<Settings>,
    request?: boolean,
  ) => Promise<boolean>;
  erase: () => Promise<void>;
  today: string;
}
const Context = createContext<AppContext | null>(null);
export function Provider({ children }: { children: React.ReactNode }) {
  const [view, dispatch] = useReducer(reducer, initial);
  const repo = useRef<Repository | null>(null);
  const coordinator = useRef<SessionCoordinator | null>(null);
  const reload = async () => {
    if (coordinator.current)
      dispatch({ data: await coordinator.current.read(), loading: false });
  };
  const boot = async () => {
    dispatch({ loading: true, error: null });
    try {
      repo.current = await openRepository();
      coordinator.current = new SessionCoordinator(
        repo.current,
        clock,
        catalog,
        contentAvailableForSession,
        localPreviewEnabled,
      );
      await coordinator.current.refresh();
      const state = await coordinator.current.read();
      try {
        const enabled = await reconcileReminder(state.settings);
        if (enabled !== state.settings.reminderEnabled)
          await coordinator.current.settings({ reminderEnabled: enabled });
      } catch {
        /* Reminder delivery never blocks offline use. */
      }
      await reload();
    } catch {
      dispatch({
        loading: false,
        error:
          "No pudimos abrir el almacenamiento privado. Puedes seguir accediendo a Necesito apoyo.",
      });
    }
  };
  useEffect(() => {
    void boot();
    const calendarContext = () =>
      `${clock.localDate()}|${clock.timeZone()}|${clock.offsetMinutes()}`;
    let previousContext = calendarContext();
    const reconcile = () => {
      previousContext = calendarContext();
      if (!coordinator.current) return;
      void run(async () => {
        await coordinator.current!.refresh();
        const current = await coordinator.current!.read();
        try {
          const enabled = await reconcileReminder(current.settings);
          if (!enabled && current.settings.reminderEnabled)
            await coordinator.current!.settings({ reminderEnabled: false });
        } catch {}
      });
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") reconcile();
    });
    // Also handle midnight while the home screen remains in the foreground.
    const calendarWatch = setInterval(() => {
      if (
        AppState.currentState === "active" &&
        calendarContext() !== previousContext
      )
        reconcile();
    }, 1000);
    return () => {
      subscription.remove();
      clearInterval(calendarWatch);
    };
  }, []);
  const run = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      await reload();
      dispatch({ error: null });
      return true;
    } catch {
      dispatch({
        error:
          "No pudimos guardar este paso. Puedes volver a intentarlo o salir.",
      });
      return false;
    }
  };
  const saveSettings = async (patch: Partial<Settings>, request = false) =>
    run(async () => {
      if (!coordinator.current) throw new Error("NOT_READY");
      const current = await coordinator.current.read();
      if (
        patch.reminderEnabled !== undefined ||
        patch.reminderTime !== undefined
      ) {
        const enabled = await reconcileReminder(
          { ...current.settings, ...patch },
          request,
        );
        if (patch.reminderEnabled === true && !enabled) {
          await coordinator.current.settings({
            ...patch,
            reminderEnabled: false,
          });
          throw new Error("REMINDER_UNAVAILABLE");
        }
        patch.reminderEnabled = enabled;
      }
      await coordinator.current.settings(patch);
    });
  const erase = async () => {
    await cancelReminders();
    if (repo.current) await repo.current.erase();
    else await eraseUnavailableStorage();
    repo.current = null;
    coordinator.current = null;
    dispatch({ data: null });
    await boot();
  };
  return (
    <Context.Provider
      value={{
        ...view,
        coordinator: coordinator.current,
        reload,
        run,
        saveSettings,
        erase,
        today: clock.localDate(),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("MISSING_PROVIDER");
  return value;
}
