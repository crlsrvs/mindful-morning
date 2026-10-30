import React, { useState } from "react";
import { Alert, Switch, TextInput } from "react-native";
import { router } from "expo-router";
import { useApp } from "../src/ui/provider";
import {
  Body,
  Button,
  Card,
  Screen,
  Title,
  styles,
  colors,
} from "../src/ui/components";
export default function Settings() {
  const app = useApp();
  const s = app.data?.settings;
  const [time, setTime] = useState(s?.reminderTime ?? "09:00");
  const [busy, setBusy] = useState(false);
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  const change = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  const erase = () =>
    Alert.alert(
      "¿Borrar todos mis datos?",
      "Se eliminarán las sesiones, preferencias y la llave local. No podrás recuperarlas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: () =>
            void change(async () => {
              if (await app.run(app.erase)) router.replace("/");
            }),
        },
      ],
    );
  return (
    <Screen back>
      <Title>Tu rutina</Title>
      <Body>Elige lo que te resulte cómodo.</Body>
      {s && (
        <>
          <Card>
            <Body>Recordatorio local</Body>
            <Body>Si te apetece, tienes un momento para ti.</Body>
            <Switch
              accessibilityLabel="Activar recordatorio local"
              disabled={busy}
              value={s.reminderEnabled}
              trackColor={{ true: colors.green }}
              onValueChange={(value) =>
                void change(() =>
                  app.saveSettings({ reminderEnabled: value }, value),
                )
              }
            />
            <Body>Hora aproximada (24 horas)</Body>
            <TextInput
              accessibilityLabel="Hora del recordatorio, formato HH:mm"
              style={styles.input}
              value={time}
              onChangeText={setTime}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder="09:00"
              placeholderTextColor={colors.muted}
            />
            {!valid && <Body>Escribe una hora entre 00:00 y 23:59.</Body>}
            <Button
              label="Guardar hora"
              disabled={!valid || busy}
              secondary
              onPress={() =>
                void change(() => app.saveSettings({ reminderTime: time }))
              }
            />
            <Body>
              El sistema puede retrasar o no entregar el aviso. No es necesario
              activarlo para usar la app.
            </Body>
          </Card>
          <Card>
            <Body>Conteo amable de días</Body>
            <Body>Opcional, sin premios ni mensajes de pérdida.</Body>
            <Switch
              accessibilityLabel="Mostrar días consecutivos"
              disabled={busy}
              value={s.streakEnabled}
              trackColor={{ true: colors.green }}
              onValueChange={(value) =>
                void change(() => app.saveSettings({ streakEnabled: value }))
              }
            />
          </Card>
        </>
      )}
      {app.error && <Body>{app.error}</Body>}
      <Button
        label="Límites y privacidad"
        secondary
        onPress={() => router.push("/limits")}
      />
      <Button
        label="Borrar todos mis datos"
        disabled={busy}
        secondary
        onPress={erase}
      />
    </Screen>
  );
}
