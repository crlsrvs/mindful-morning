import React, { useState } from "react";
import { router } from "expo-router";
import { useApp } from "../src/ui/provider";
import {
  Body,
  Button,
  Card,
  Screen,
  TextButton,
  Title,
} from "../src/ui/components";
const pages = [
  [
    "Un momento para ti",
    "Un espacio breve para notar cómo comienza tu día. No hay respuestas incorrectas.",
  ],
  [
    "Mirar desde otro ángulo",
    "Una imagen o situación cotidiana puede ayudarte a observar tu experiencia desde otro ángulo. Puedes omitir cualquier pregunta.",
  ],
  [
    "Personal y privado",
    "Este espacio no diagnostica ni ofrece tratamiento. Tus respuestas se guardan solo en este dispositivo y puedes borrarlas cuando quieras.",
  ],
  [
    "Una rutina a tu medida",
    "Los recordatorios y el conteo de días son opcionales. Puedes activarlos y elegir una hora en Configuración.",
  ],
];
export default function Onboarding() {
  const [step, setStep] = useState(0);
  const app = useApp();
  const finish = async () => {
    if (await app.saveSettings({ onboardingCompleted: true }))
      router.replace("/");
  };
  return (
    <Screen support={false}>
      <Body>{step + 1} de 4</Body>
      <Title>{pages[step][0]}</Title>
      <Card>
        <Body>{pages[step][1]}</Body>
      </Card>
      <Button
        label={step < 3 ? "Continuar" : "Empezar"}
        onPress={() => (step < 3 ? setStep(step + 1) : void finish())}
      />
      {step === 2 && (
        <TextButton
          label="Límites y apoyo"
          onPress={() => router.push("/limits")}
        />
      )}
      {step < 3 && (
        <TextButton label="Saltar introducción" onPress={() => void finish()} />
      )}
      {app.error && <Body>{app.error}</Body>}
    </Screen>
  );
}
