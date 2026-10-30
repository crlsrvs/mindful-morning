import React from "react";
import { Body, Card, Screen, Title } from "../src/ui/components";
export default function Limits() {
  return (
    <Screen back>
      <Title>Límites y privacidad</Title>
      <Card>
        <Body>
          Esta app ofrece preguntas de autorreflexión y reflexiones generales.
          Sus interpretaciones se basan en reglas de producto no validadas
          psicométricamente; pueden no coincidir con tu experiencia. No
          sustituyen la atención profesional ni detectan crisis o riesgo
          suicida. No está diseñada para tratar ansiedad, depresión u otras
          condiciones. Puedes omitir preguntas, abandonar la sesión o borrar
          toda la información local sin consecuencia.
        </Body>
      </Card>
      <Body>
        Las respuestas se guardan cifradas en este dispositivo. No hay cuentas,
        sincronización, publicidad ni analítica. Desinstalar la app implica
        perder los datos; no ofrecemos recuperación remota.
      </Body>
      <Body>
        Una persona con acceso a tu dispositivo desbloqueado puede ver la
        pantalla. Borrar los datos elimina los archivos y la llave local; no
        garantiza limpieza forense de la memoria.
      </Body>
    </Screen>
  );
}
