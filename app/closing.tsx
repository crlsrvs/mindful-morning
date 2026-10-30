import React from "react";
import { router } from "expo-router";
import { useApp } from "../src/ui/provider";
import { Body, Button, Card, Screen, Title } from "../src/ui/components";
import { contentAvailableForSession } from "../src/infrastructure/catalog";
import { localPreviewEnabled } from "../src/infrastructure/local-preview";
export default function Closing() {
  const app = useApp();
  const s = app.data?.sessions
    .filter((s) => s.localDate === app.today && s.state === "completed")
    .at(-1);
  if (!s?.reflection)
    return (
      <Screen back>
        <Title>Tu espacio de hoy</Title>
        <Body>El cierre aparece al terminar la sesión.</Body>
      </Screen>
    );
  return (
    <Screen>
      <Title>
        {s.closureMode === "positive"
          ? s.reflection.title
          : "Una idea para acompañarte"}
      </Title>
      <Card>
        <Body>{s.reflection.body}</Body>
        {s.reflection.optionalAction && (
          <Body>{s.reflection.optionalAction}</Body>
        )}
      </Card>
      {s.support && (
        <Card>
          <Body>{s.support.body}</Body>
        </Card>
      )}
      <Button label="Terminar" onPress={() => router.replace("/")} />
      {localPreviewEnabled && (
        <Button
          label="Iniciar otra prueba"
          secondary
          disabled={!contentAvailableForSession() || !app.coordinator}
          onPress={() =>
            void app
              .run(() => app.coordinator!.startAnotherPreview())
              .then((ok) => {
                if (ok) router.replace("/session");
              })
          }
        />
      )}
    </Screen>
  );
}
