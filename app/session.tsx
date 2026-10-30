import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, AppState, Text } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useApp } from "../src/ui/provider";
import {
  Body,
  Button,
  Card,
  Screen,
  Title,
  styles,
} from "../src/ui/components";
import { ForegroundTimer } from "../src/domain/session/timer";
import { C } from "../src/domain/engine/core";
export default function SessionScreen() {
  const app = useApp();
  const session = app.data?.sessions
    .filter((s) => s.localDate === app.today && s.state === "active")
    .at(-1);
  const question = session?.exposures.at(-1);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const timer = useRef<ForegroundTimer | null>(null);
  const locked = useRef(false);
  const appRef = useRef(app);
  appRef.current = app;
  useEffect(() => {
    if (!session && app.data) {
      const latest = app.data.sessions
        .filter((s) => s.localDate === app.today)
        .at(-1);
      router.replace(latest?.state === "completed" ? "/closing" : "/");
    }
  }, [session?.id, app.today, app.data]);
  useFocusEffect(
    React.useCallback(() => {
      if (!session || !question) return;
      const clock = new ForegroundTimer(
        question.activeSeconds,
        C.reflectionWaitSeconds,
      );
      timer.current = clock;
      setReady(clock.ready);
      let persisted = clock.checkpoint;
      let announced = clock.ready;
      let inFlight = false;
      if (AppState.currentState === "active") clock.resume(performance.now());
      const persist = () => {
        if (clock.checkpoint <= persisted || inFlight) return;
        const checkpoint = clock.checkpoint;
        inFlight = true;
        void appRef.current
          .run(() =>
            appRef.current.coordinator!.checkpoint(
              session.id,
              question.snapshot.id,
              checkpoint,
            ),
          )
          .then((ok) => {
            if (ok) persisted = checkpoint;
          })
          .finally(() => {
            inFlight = false;
          });
      };
      const interval = setInterval(() => {
        clock.tick(performance.now());
        persist();
        if (clock.ready && !announced) {
          announced = true;
          setReady(true);
          AccessibilityInfo.announceForAccessibility(
            "Ya puedes elegir una respuesta.",
          );
        }
      }, 250);
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          clock.resume(performance.now());
          void appRef.current.run(() => appRef.current.coordinator!.refresh());
        } else {
          clock.pause(performance.now());
          persist();
        }
      });
      return () => {
        clearInterval(interval);
        sub.remove();
        clock.pause(performance.now());
        void appRef.current.coordinator
          ?.checkpoint(session.id, question.snapshot.id, clock.checkpoint)
          .catch(() => {});
        timer.current = null;
      };
    }, [session?.id, question?.snapshot.id]),
  );
  const answer = async (id: string | null) => {
    if (!session || !question || locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await app.run(async () => {
        if (timer.current)
          await app.coordinator!.checkpoint(
            session.id,
            question.snapshot.id,
            timer.current.checkpoint,
          );
        await app.coordinator!.answer(session.id, question.snapshot.id, id);
      });
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  if (!session || !question)
    return (
      <Screen>
        <Body>Volviendo a tu espacio…</Body>
      </Screen>
    );
  return (
    <Screen>
      <Button label="Salir" secondary onPress={() => router.replace("/")} />
      <Text style={styles.small}>
        {session.exposures.length === 4
          ? "Una pregunta más"
          : `Pregunta ${session.exposures.length} de 3`}
      </Text>
      <Title>{question.snapshot.prompt}</Title>
      {question.snapshot.helperText && (
        <Body>{question.snapshot.helperText}</Body>
      )}
      <Card>
        <Body>
          {ready
            ? "Ya puedes elegir una respuesta."
            : "Tómate un momento para observar. Las opciones estarán disponibles pronto."}
        </Body>
      </Card>
      {question.snapshot.answers.map((a) => (
        <Button
          key={a.id}
          label={a.text}
          disabled={!ready || busy}
          secondary
          onPress={() => void answer(a.id)}
        />
      ))}
      <Button
        label="Prefiero no responder"
        disabled={busy}
        onPress={() => void answer(null)}
      />
      {app.error && <Body>{app.error}</Body>}
    </Screen>
  );
}
