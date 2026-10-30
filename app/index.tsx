import React from "react";
import { router } from "expo-router";
import { useApp } from "../src/ui/provider";
import { Body, Button, Card, Screen, Title } from "../src/ui/components";
import { contentAvailableForSession } from "../src/infrastructure/catalog";
import { localPreviewEnabled } from "../src/infrastructure/local-preview";
import { streak } from "../src/domain/engine/reflections";
export default function Home() {
  const app = useApp();
  const current = app.data?.sessions
    .filter((s) => s.localDate === app.today)
    .at(-1);
  const ready = contentAvailableForSession();
  const startAnotherPreview = () => {
    void app
      .run(() => app.coordinator!.startAnotherPreview())
      .then((ok) => {
        if (ok) router.push("/session");
      });
  };
  if (app.loading)
    return (
      <Screen>
        <Title>Un momento…</Title>
      </Screen>
    );
  if (app.data && !app.data.settings.onboardingCompleted)
    return (
      <Screen>
        <Title>Un espacio para comenzar.</Title>
        <Body>
          Un espacio breve para notar cómo comienza tu día. No hay respuestas
          incorrectas.
        </Body>
        <Button
          label="Conocer este espacio"
          onPress={() => router.push("/onboarding")}
        />
        <Button
          label="Empezar ahora"
          secondary
          onPress={() => void app.saveSettings({ onboardingCompleted: true })}
        />
      </Screen>
    );
  return (
    <Screen>
      <Title>Tu mañana, a tu ritmo.</Title>
      <Body>Un pequeño espacio para observar y continuar.</Body>
      {app.error && (
        <Card>
          <Body>{app.error}</Body>
        </Card>
      )}
      {!ready && (
        <Card>
          <Body>
            El contenido está en revisión. Las preguntas estarán disponibles
            cuando termine su aprobación.
          </Body>
        </Card>
      )}
      {current?.state === "completed" ? (
        <>
          <Card>
            <Body>Ya tuviste tu espacio hoy.</Body>
          </Card>
          <Button
            label="Volver al cierre de hoy"
            onPress={() => router.push("/closing")}
          />
          {localPreviewEnabled && (
            <Button
              label="Iniciar otra prueba"
              secondary
              disabled={!ready || !app.coordinator}
              onPress={startAnotherPreview}
            />
          )}
        </>
      ) : current?.state === "active" ? (
        <>
          <Button label="Continuar" onPress={() => router.push("/session")} />
          <Button
            label="Dejar por hoy"
            secondary
            onPress={() =>
              void app.run(() => app.coordinator!.abandon(current.id))
            }
          />
        </>
      ) : current ? (
        <>
          <Body>Puedes volver a tomar un momento otro día.</Body>
          {localPreviewEnabled && (
            <Button
              label="Iniciar otra prueba"
              secondary
              disabled={!ready || !app.coordinator}
              onPress={startAnotherPreview}
            />
          )}
        </>
      ) : (
        <>
          <Body>2–4 min · Tres preguntas, a veces una más.</Body>
          <Button
            label="Tomarme un momento"
            disabled={!ready || !app.coordinator}
            onPress={() =>
              void app
                .run(() => app.coordinator!.start())
                .then((ok) => {
                  if (ok) router.push("/session");
                })
            }
          />
        </>
      )}
      {app.data?.settings.streakEnabled && (
        <Body>
          Gracias por reservarte este momento. Días consecutivos:{" "}
          {streak(
            app.data.sessions
              .filter((s) => s.state === "completed")
              .map((s) => s.localDate),
            app.today,
          )}
          .
        </Body>
      )}
      <Button
        label="Configuración"
        secondary
        onPress={() => router.push("/settings")}
      />
    </Screen>
  );
}
