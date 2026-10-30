# Revisión restante del catálogo

Actualizado: 2026-10-30. Paquete 1.0.0-draft.3; hash `81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c`. Estado general y siguiente trabajo en [STATUS.md](STATUS.md).

## Aceptaciones ya registradas

El propietario aceptó las preguntas por muestra, las 82 reflexiones tras suavizar su lenguaje y el nuevo estilo de ocho preguntas con autorización de aplicación al resto. La reformulación de 180 preguntas y 567 respuestas está terminada. La corrección puntual de q_0084 quedó incorporada en su revisión 3. No volver a pedir esas decisiones ni atribuir lectura individual de todos los textos.

Registros literales: content/human-review.json, reflection-human-review.json, question-tone-review.json y review-log.json. Textos actuales: questions.json y reflections.json. Las copias intermedias de lectura se retiraron por redundantes; se conserva [EFFECTS_FOR_REVIEW.md](EFFECTS_FOR_REVIEW.md) por su utilidad para revisar las 720 alternativas junto a sus efectos y fundamentos.

## Interpretación de respuestas

Los números son convenciones de producto, no mediciones clínicas ni probabilidades. Cada señal explícita se registra por separado. Energía alta no implica tensión o agrado; poca energía no implica desagrado. Omitir o elegir falta de encaje no aporta evidencia; cero explícito sí.

La consistencia de IDs/efectos se valida automáticamente y quotedEvidence coincide con el catálogo. Queda pendiente revisión humana de fidelidad semántica, especialmente las 144 alternativas con tres efectos. No sustituir ese juicio por el validador estructural.

## Similitudes y originalidad

El informe vigente content/similarity-report.json marca 63 pares de preguntas, cinco pares de reflexiones y 47 grupos de respuestas reutilizadas entre preguntas. No hay enunciados exactamente duplicados ni respuestas duplicadas dentro de una pregunta. La similitud léxica orienta la lectura; no certifica duplicación semántica ni originalidad.

Revisar los pares y registrar decisiones reales en el historial correspondiente. No reescribir texto aprobado automáticamente para bajar una métrica. content/semantic-review.json conserva los candidatos y su revisión pendiente.

## Familias, textos auxiliares y apoyo

La aprobación completa también incluye familias, interfaz, recursos y manifiesto, además de preguntas/reflexiones. Revisar que las familias respeten los límites de DECISION_ENGINE y que la invitación de apoyo siga siendo opcional, sin inferir crisis.

Los recursos de apoyo fueron consultados el 28-10-2026; su evidencia histórica está en VERIFICATION.md. Antes de distribuir, verificar de nuevo fuentes y disponibilidad con herramientas adecuadas y registrar su aprobación. Las fichas no aprobadas permanecen ocultas en la app; no realizar llamadas como prueba.

## Accesibilidad y publicación

Pendiente comprensión de alternativas con personas, TalkBack, fuente ampliada y facilidad de navegación. Las comprobaciones físicas del 30-10-2026 se hicieron con escala 1.0 y no sustituyen estas pruebas.

CONTENT_SPEC secciones 3.8 y 8 exige originalidad y accesibilidad confirmadas para quality.status=approved. El gate sigue rechazando el pack con 547 diagnósticos de aprobación pendientes. No cambiar banderas sin evidencia ni tratar la aceptación de estilo como autorización de publicación.

La simulación anual del motor TypeScript sobre draft.3 está implementada y documentada como superada el 28-10-2026. No queda como tarea nueva; repetir cuando cambien motor/configuración/catálogo de forma que lo requiera la validación. Los informes de simulación de content/ corresponden a versiones históricas.
