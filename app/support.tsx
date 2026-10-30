import React, { useState } from "react";
import { Alert, Linking } from "react-native";
import { Body, Button, Card, Screen, Title } from "../src/ui/components";
import {
  supportResources,
  contentSources,
} from "../src/infrastructure/catalog";
import { approved } from "../src/domain/engine/core";
export default function Support() {
  const [error, setError] = useState(false);
  const resources = supportResources.filter((r) => approved(r.quality));
  const open = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setError(true);
    }
  };
  return (
    <Screen back support={false}>
      <Title>Necesito apoyo</Title>
      <Body>
        No es necesario completar preguntas para buscar apoyo. Esta app no puede
        saber si estás en una crisis. Si necesitas ayuda ahora, busca una
        persona de confianza o servicios locales.
      </Body>
      <Card>
        <Body>
          Si te sientes en peligro inmediato, busca servicios de emergencia de
          tu localidad o apoyo presencial.
        </Body>
      </Card>
      {resources.length > 0 && <Title>Si estás en Chile</Title>}
      {resources.map((r) => (
        <Card key={r.id}>
          <Body>{r.title}</Body>
          <Body>{r.serviceScope}</Body>
          <Body>
            {r.phone} · {r.availabilityText}
          </Body>
          <Body>{r.cautionText}</Body>
          <Body>Verificado: {r.lastVerifiedAt}</Body>
          <Button
            label={`Llamar a ${r.title}`}
            onPress={() =>
              Alert.alert(
                "Abrir el marcador",
                `La llamada requiere cobertura telefónica. ${r.phone}`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Abrir marcador",
                    onPress: () =>
                      void open(
                        `tel:${encodeURIComponent(r.phone.replace(/\s/g, ""))}`,
                      ),
                  },
                ],
              )
            }
          />
          <Button
            label="Fuente oficial (requiere conexión)"
            secondary
            onPress={() =>
              void open(contentSources.find((s) => s.id === r.sourceId)!.url)
            }
          />
        </Card>
      ))}
      <Body>Busca servicios de emergencia o salud de tu localidad.</Body>
      {error && <Body>No se pudo abrir esta opción en el dispositivo.</Body>}
    </Screen>
  );
}
