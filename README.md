# Mindful Morning

Aplicación local de autorreflexión matinal en español, implementada en la raíz de este repositorio con Expo, React Native y TypeScript. Sin backend, cuentas, IA en runtime ni analítica.

**Estado: implementación de integración, no MVP liberable todavía.** El catálogo vigente (`1.0.0-draft.3`, hash `81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c`) contiene 180 preguntas (720 respuestas) con el cambio de tono aprobado por el propietario y 82 reflexiones aprobadas editorialmente; sus flags `quality.status="draft"` se conservan hasta completar las revisiones restantes de efectos, similitudes, accesibilidad, originalidad y recursos. Desde el 28-10-2026, el propietario autorizó un modo de prueba local exclusivo de desarrollo (`__DEV__`, base cifrada separada `private-preview/morning.db`), que incluye la acción **«Iniciar otra prueba»** para repetir recorridos el mismo día sin sobrescribir el historial ni relajar el límite diario de producción. La publicación sigue bloqueada. Ver [Modo de prueba local](docs/LOCAL_TESTING.md). Las pruebas automatizadas mantienen sus fixtures separadas y el catálogo conserva sus metadatos reales.

El 26-10-2026 se completó la compilación nativa Android ARM64 y se instaló el APK development en el emulador API 37; el 28-10-2026 se instaló y verificó también en un Samsung Galaxy S20 físico (`SM-G980F`, Android 10) y se superó la simulación anual de 1.000 semillas × 365 días sobre el motor TypeScript de producción (`npm run engine:simulate`). Las pruebas nativas completas de notificaciones, recuperación y accesibilidad siguen pendientes; ver `docs/VERIFICATION.md`.

## Desarrollo

Requiere Node 24 LTS, npm, JDK 17 y Android SDK. Usar un development build: **Expo Go no incluye SQLCipher**. La aplicación falla de forma cerrada si no hay cifrado.

```sh
npm ci
npm run check
npm run content:integrity
npx expo prebuild --platform android --no-install
npm run android
```

En aperturas posteriores del development build:

```sh
npm start
```

No se necesita EAS ni una cuenta Expo. El servidor Metro solo se usa en desarrollo. Para construir offline una vez instaladas las dependencias se necesita que las cachés de Gradle/Android también estén completas.

## Qué está implementado

- Onboarding omisible, límites y privacidad, configuración de recordatorio local y streak opt-in.
- Una sesión por fecha local, tres preguntas y una cuarta solo con incertidumbre accionable y ganancia suficiente.
- Omisión inmediata, salida libre, temporizador monotónico de 25 segundos en primer plano y recuperación del avance persistido.
- Motor determinista independiente de React: selección, señales, confianza, familias de reflexión y patrón 3/5 con cooldown.
- SQLite con SQLCipher configurado, llave aleatoria en SecureStore, transacciones exclusivas, snapshots, migración v1, borrado y protección ante llave perdida.
- Catálogo estático con validación estructural, integridad SHA-256 y barrera de aprobación. No se generan preguntas ni reflexiones.
- Pantalla de apoyo siempre accesible; las fichas telefónicas solo se muestran cuando estén aprobadas. Con el corpus actual se muestra el texto general normativo.

## Verificación y documentación

```sh
npm test                       # Motor, sesión, SQLite real en Node, UI y adaptadores (40 pruebas en 7 suites)
npm run engine:simulate        # Simulación anual de 1.000 semillas × 365 días en el motor TypeScript de producción
npm run typecheck
npm run format:check
npm run content:validate        # Estructura del borrador, no aprobación
npm run content:test            # Suite editorial existente (12 pruebas)
npm run content:integrity       # Originales y corpus intactos
npm run release:check           # FALLA mientras falte aprobación editorial
```

El prebuild Android instala también una barrera para `preReleaseBuild`. No publicar un binario de desarrollo como si fuese un release validado.

- [Modo de prueba local y «Iniciar otra prueba»](docs/LOCAL_TESTING.md)
- [Implementación y decisiones](docs/IMPLEMENTATION.md)
- [Preparación Android e iOS](docs/DEVELOPMENT.md)
- [Contenido y heurísticas](docs/CONTENT_INTEGRATION.md)
- [Efectos y fundamentos para revisión humana](docs/EFFECTS_FOR_REVIEW.md)
- [Revisión restante del catálogo](docs/REMAINING_CONTENT_REVIEW.md)
- [Resultados y pruebas pendientes](docs/VERIFICATION.md)

Los textos del catálogo están en `content/questions.json` y `content/reflections.json`; el historial editorial, en `content/review-log.json` y `content/question-tone-review.json`.

## Licencia

El código fuente se distribuye bajo licencia MIT. El catálogo de `content/` (preguntas, respuestas, reflexiones y metadatos editoriales) y sus reproducciones en `docs/` quedan con todos los derechos reservados. Ver [LICENSE](LICENSE).

Los cinco documentos originales de `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DECISION_ENGINE.md`, `CONTENT_SPEC.md` y `EVIDENCE_AND_LIMITATIONS.md`) y todo `content/` se conservan como fuentes de verdad. Las nuevas notas describen la implementación sin reescribir esas especificaciones.
