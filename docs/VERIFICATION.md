# Verificación y pendientes · actualización 2026-10-26

## Verificado en este entorno

- Lectura de las especificaciones y documentación editorial; parseo de todos los JSON y validación estructural del pack: 0 errores.
- Integridad: 43 archivos entregados en `content/` y cinco documentos originales conservados. Las notas de implementación son archivos nuevos.
- Suite editorial existente: 12 pruebas, incluidas 100.000 muestras sintéticas.
- Suite de la app: **32 pruebas aprobadas en seis suites**; motor, ciclo diario, doble toque, fallos simulados, cierre atómico, recuperación, temporizador, selección, omisiones, patrones, notificaciones opt-in, controles UI y protección de almacenamiento. Ver el resultado final en el comando `npm test`.
- SQLite real de Node: cierre/reapertura desde archivo, recuperación de segundos, transacciones con rollback, claves foráneas y unicidad. **No prueba cifrado**; los datos son fixtures sintéticas y se eliminan al terminar.
- 100.000 muestras de estimación con seed fija y simulación anual de 365 fechas a cuatro exposiciones, sin repetición dentro del cooldown. No equivale a ensayos con personas ni a toda historia posible.
- TypeScript strict y formato del código nuevo.
- `expo install --check` comprobó compatibilidad con el mapa local de Expo; la primera consulta se ejecutó offline. `expo install` instaló las dependencias compatibles desde npm.
- Prebuild Android e iOS (`--no-install`): generación nativa y configuración de SQLCipher/backup.
- Exportación del bundle Android mediante Metro/Hermes.
- Release gate: fallo esperado por falta de aprobación; no se falsificaron revisiones para pasarlo.

## Compilación Android

El primer intento del 2026-10-25 falló por falta de espacio. Tras la liberación de espacio por el propietario, el 2026-10-26 se repitió `./gradlew :app:assembleDebug --no-daemon -PreactNativeArchitectures=arm64-v8a`: **BUILD SUCCESSFUL en 4m 23s**, 486 tareas (476 ejecutadas). Se instalaron NDK 27.1.12297006 y CMake 3.22.1. APK development ARM64: `android/app/build/outputs/apk/debug/app-debug.apk` (aproximadamente 95 MB).

El manifest fusionado debug mantiene `allowBackup=false` y `fullBackupContent=false`. Incluye permisos y tráfico HTTP del cliente de desarrollo; falta auditar una build release. Hay advertencias de APIs obsoletas de dependencias, sin errores de compilación.

El AVD existente `Medium_Phone_API_37.0` no pudo crear una partición de 12 GB. Arrancó con `-partition-size 4096 -no-snapshot-save -no-boot-anim`, sin borrar archivos existentes. Instalación del APK: `Success`. Las pruebas de interacción se registran separadamente; compilar e instalar no prueba por sí solo cifrado ni todos los flujos.

## Dependencias

`npm audit` identificó cinco entradas de severidad alta en la cadena de herramientas Expo CLI: `node-forge` y `zod`, con propagación a paquetes superiores. La versión estable disponible de node-forge era 1.4.0 y seguía señalada; Expo CLI usa Zod 3 mientras el aviso sitúa la corrección en 4.6.6+. No se forzó una actualización mayor incompatible ni la regresión a Expo 44 que sugería npm. Revisar cuando Expo publique una corrección compatible. No hay uso directo de esas bibliotecas por el motor.

No se declara la cadena de suministro libre de vulnerabilidades. No se activó `expo-observe`, analytics ni actualización remota.

## Checklist nativo pendiente

- Completar pruebas de interacción en emulador y teléfono físico; build development Android compilada e instalada.
- Comprobar `cipher_version`, cierre/reapertura, cabecera cifrada de DB, claves incorrectas, pérdida de llave y rechazo de Expo Go.
- Probar muerte del proceso durante checkpoint, avance y cierre; comparar el estado restaurado y comprobar pérdida máxima esperada de 1 s en condiciones normales. Medir también almacenamiento lento y errores de disco.
- Verificar DB/WAL/SHM y SecureStore eliminados; interrupción del borrado; volver a onboarding; backup y transferencia entre dispositivos Android.
- Modo avión, notificación denegada/permitida, cambios de hora/zona, una sola notificación DAILY y apertura después de completar el día.
- TalkBack, fuente ampliada, navegación atrás, pérdida de foco, movimiento reducido y contraste en pantalla real.
- Cambios DST, fecha manual hacia atrás, medianoche con sesión activa y no duplicación.
- Revisión humana del corpus, efectos triples, similitudes, recursos y textos auxiliares. (La simulación de 1.000 seeds × 365 días en el motor TypeScript de producción sobre `1.0.0-draft.3` ya fue implementada y superada el 2026-10-28; repetir si cambia el hash del paquete antes de release).
- Build release firmada y auditoría de tráfico: ausencia de peticiones iniciadas por la app en los flujos internos. Revisar manifest fusionado final, backup y permisos; no confundir tráfico del SO/Metro con producto.
- Xcode completo/CocoaPods, build iOS, Keychain tras reinstalar, exclusión real de iCloud, VoiceOver y dispositivo iOS.

## Ejecución reproducible

```sh
npm ci
npm run check
npm run format:check
npm run content:test
npm run content:integrity
node scripts/release-gate.mjs # código 1 esperado con el pack draft actual
EXPO_NO_TELEMETRY=1 npx expo export --platform android --output-dir dist/android
```

El criterio de liberación AC-01…18 sigue abierto. Esta entrega permite continuar integración y revisión; no certifica un MVP terminado, cobertura editorial aprobada, efecto clínico ni publicación lista.

## Revisión editorial del 2026-10-26

Ver `CONTENT_REVIEW_2026-10-26.md` y `REFLECTIONS_FOR_REVIEW.md`. Pasaron nuevamente `npm run check` (32 pruebas), `npm run content:test` (12 pruebas) e integridad. El propietario revisará la muestra de reflexiones antes de decidir; sus flags de aprobación permanecen sin cambios.

## Arranque y comprobación inicial de cifrado · 2026-10-26

El development client conectado a Metro abrió la bienvenida en el emulador ARM64 API 37; se inspeccionó visualmente la pantalla «Mirar desde otro ángulo» (2 de 4), sin error de almacenamiento visible. `openRepository()` exige una respuesta no vacía a `PRAGMA cipher_version` antes de crear el repositorio; alcanzar la bienvenida aporta evidencia de que ese control pasó, aunque no se registró la versión concreta del cifrador.

En el sandbox Android de la app existen `files/private/install-v1`, `morning.db`, `morning.db-wal` y `morning.db-shm`. Se copió temporalmente solo la DB de prueba (57.344 bytes), sin extraer la clave de SecureStore: no empieza con la cabecera `SQLite format 3`, y SQLite estándar en modo lectura rechaza consultar `sqlite_master` con `file is not a database`. Se eliminó la copia temporal al acabar. Esta comprobación no sustituye las pruebas pendientes de clave incorrecta/perdida, WAL/SHM, interrupciones y borrado.

El emulador y Metro quedan abiertos para inspección manual. Con el catálogo actual, las sesiones permanecen bloqueadas por el gate editorial. El espacio libre observado tras compilar y arrancar el emulador era de aproximadamente 7,8 GiB.

## Revisión del tono · 2026-10-28

A petición del propietario se revisaron los 76 cierres (revision 2), con frases más sencillas y un tono más cálido. Se conservaron las seis invitaciones de apoyo. Hash actual del borrador no publicado: `4a735f8fb619fa4e7ec46b4198591724711d429717643f064726de5a81c0dd83`. El historial literal antes/después está en `content/review-log.json`, `edit_007`; la lectura actual en `REFLECTIONS_FOR_REVIEW.md`.

Se comprobó igualdad byte a byte de preguntas, fundamentos de efectos, familias, recursos, textos de interfaz y registro de aprobación previo respecto al inicio de este cambio. Se preservan los cinco documentos originales. Los 82 cuerpos siguen siendo distintos; el análisis de similitud señala cinco parejas para revisión, sin constituir aprobación semántica.

Pasaron validación estructural, lint editorial, integridad, TypeScript, 32 pruebas de la app y 12 pruebas editoriales. Los informes de simulación y revisión del 25/26 de octubre describen el hash anterior. No se repitió compilación nativa ni pruebas con personas para este cambio de texto. Los nuevos cierres siguen pendientes de aprobación humana.

## Aprobación editorial de reflexiones · 2026-10-28

El propietario aprobó las 82 reflexiones y sus acciones opcionales tras leer varias de la revisión actual. Se registra la autorización literal, hash y revisión por ID en `content/reflection-human-review.json`. No se afirma lectura individual completa ni se modifican los textos aprobados. Esta aprobación sustituye el estado editorial pendiente descrito en las entradas históricas anteriores; los demás controles del paquete siguen pendientes.

## Primera prueba en Samsung físico · 2026-10-28

Galaxy S20 SM-G980F, Android 10, ABI arm64-v8a. Instalación del APK development existente: Success. Metro conectado por redirección USB del puerto 8081. Se abrió la app, se cerró la ayuda inicial de Expo y se verificaron mediante la jerarquía UI las pantallas de apoyo e inicio («Un espacio para comenzar», «Conocer este espacio», «Empezar ahora»). Se comprobó la presencia de install-v1, morning.db, morning.db-wal y morning.db-shm dentro del almacenamiento privado de la app; no se extrajeron claves ni respuestas. Esto verifica arranque y creación del almacenamiento, no constituye una prueba exhaustiva de cifrado, recuperación o notificaciones en el dispositivo físico.

La app quedó en el inicio para pruebas manuales del propietario. Las sesiones siguen sujetas al gate del catálogo. No se borraron herramientas, cachés ni emuladores; se conserva la preferencia del propietario en DEVELOPMENT.md.

## Revisión restante y bienvenida simplificada · 2026-10-28

Se aplicó la corrección expresamente aprobada a a_0084_01, conservando efectos y aumentando q_0084 a revision 2. Pack actual: 1.0.0-draft.2, hash a66b7e6924373030905fb5a683e403b746520a16e74f63b2361472ef2ba7f4da. Se cotejaron los textos, efectos e IDs de las 720 alternativas con sus fundamentos; la lectura de las 144 triples detectó la ambigüedad corregida. Revisión humana restante en REMAINING_CONTENT_REVIEW.md y detalle en EFFECTS_FOR_REVIEW.md. No se sustituyeron pruebas de accesibilidad u originalidad por flags ficticios.

Según la petición del propietario, inicio y pantalla 1 dicen «No hay respuestas incorrectas». La pantalla 3 conserva límites no clínicos, almacenamiento local y borrado en un texto abreviado; el detalle está en «Límites y apoyo». Se eliminan los botones duplicados y la configuración anticipada: una acción principal por paso, enlace discreto para saltar en 1–3 y solo «Empezar» en 4. El cambio de copy prevalece sobre el literal original del PRD, que se conserva sin sobrescribir.

Verificadas las cuatro pantallas mediante la jerarquía UI del Samsung, incluida la nueva frase, la privacidad abreviada y la ausencia de acciones duplicadas al final. La app quedó en 4 de 4. Pasaron TypeScript, formato, lint editorial, integridad y las 44 pruebas existentes. No se borraron herramientas ni datos del usuario.

## Modo de prueba autorizado · 2026-10-28

Autorización literal del propietario: «Autorizo el modo de prueba local». Implementado únicamente en desarrollo con doble control __DEV__ (disponibilidad y selección), aviso visible y almacenamiento cifrado separado private-preview. El catálogo mantiene sus estados draft y hash; no se fabrican aprobaciones. Cada sesión de prueba lleva LOCAL_PREVIEW. Los recursos telefónicos no aprobados permanecen filtrados.

Pasaron 36 pruebas en siete suites, TypeScript, formato e integridad del contenido. Las cuatro nuevas pruebas cubren sesión de borrador hasta cierre, conservación de metadatos, cooldown/exclusión de rechazados, producción y hash inválido. La barrera de release sigue fallando de forma esperada con 547 diagnósticos editoriales.

En el Samsung se reinició la app, se confirmó el aviso y la creación de DB/WAL/SHM en private-preview, se completó la bienvenida y se verificó «Tomarme un momento» habilitado. Se inició una sesión y apareció «Pregunta 1 de 3», con alternativas inicialmente deshabilitadas y aviso de espera. Se dejó la primera pregunta para que el propietario pruebe sus propias elecciones; no se respondieron ni omitieron preguntas por él.

## Reformulación de preguntas · 2026-10-28

Petición: «Me gusta mucho mas. Aplica ese cambio de estilo en el resto de preguntas». Aplicado el tono de la muestra a las 180 preguntas; 567 de 720 respuestas editadas y 153 conservadas por su claridad. Las ocho propuestas de la muestra se aplicaron exactamente. Paquete 1.0.0-draft.3, hash `81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c`.

Comprobaciones:

- Comparación profunda antes/después: solo prompt, helperText, revision y answers[].text cambian. IDs, orden, efectos, cobertura, elegibilidad y metadatos de calidad intactos. Revisión incrementada una vez por pregunta (q_0084 pasa de 2 a 3; el resto de 1 a 2).
- Reflexiones: comparación de bytes sin cambios. Los cinco documentos originales conservan sus hashes.
- 720 evidencias quotedEvidence sincronizadas con el texto actual. Catálogos de lectura y efectos actualizados; evidencia completa antes/después en content/question-tone-review.json. La aprobación de estilo no se registra como lectura humana individual de las 180 nuevas revisiones.
- npm run check: validación de contenido/configuración, TypeScript y 36 pruebas en 7 suites correctas. npm run content:test: 12 pruebas correctas.
- Integridad: 45 archivos, hash canónico correcto y cinco documentos originales intactos.
- Comparación de similitud recalculada: 63 pares de preguntas y 5 pares de reflexiones sobre el umbral léxico; 47 grupos de respuestas repetidas entre preguntas. No hay enunciados exactamente duplicados ni opciones duplicadas dentro de una pregunta. Las escenas y la redacción cotidiana comparten vocabulario; el informe no acredita originalidad ni reemplaza revisión semántica humana.
- Release sigue bloqueado por las 547 comprobaciones de aprobación pendientes, como antes; no se modificaron sus condiciones.
- No se repitió la simulación anual: los reportes anteriores conservan su versión histórica y no son evidencia de este nuevo hash. El texto no altera los efectos, pero el hash participa en semillas de selección.

Samsung conectado y app abierta. Metro existente escuchaba solo en IPv6 en 8081; se dejó un servidor accesible por USB en 8082, con adb reverse y deep link actualizado. Bundle Android generado correctamente (7.571.778 bytes), con el hash y un enunciado de draft.3 comprobados. La pantalla de inicio muestra «Puedes volver a tomar un momento otro día»: no se inició ni respondió una sesión nueva y no se borraron datos para eludir la restricción diaria. Pendiente comprobar visualmente preguntas nuevas en la próxima sesión. No se recompiló código nativo, pues los cambios son de contenido.

## Continuidad entre asistentes · 2026-10-28

Se añadieron GEMINI.md, docs/HANDOFF.md y docs/PROMPT_GEMINI.md, enlazados desde README.md. Recogen estado, autorizaciones, fuentes, mapa de código, comprobaciones históricas, entorno, límites y próximos pasos. No se cambió código ni contenido del producto. Se comprobó la integridad del contenido (45 archivos y cinco documentos originales intactos); no se repitieron tests de runtime por este cambio documental. No se transfirieron procesos, permisos ni datos personales a ningún servicio.

## Pendiente de repetición local para Gemini · 2026-10-28

Por instrucción del propietario se registró en HANDOFF.md el pendiente «Iniciar otra prueba», exclusivo del modo local, conservando el historial y el límite diario de producción. Se actualizó el prompt de continuidad. No se implementó el control ni se cambió el código, el catálogo o los datos del teléfono; no corresponde atribuir pruebas funcionales a este registro documental.

## Implementación de «Iniciar otra prueba» y verificación en Samsung · 2026-10-28

Se retomó el proyecto con Gemini tras leer `GEMINI.md`, `docs/HANDOFF.md`, todos los documentos de `docs/` y validar `content/` (paquete `1.0.0-draft.3`, hash `81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c`, 180 preguntas, 720 respuestas y 82 reflexiones sincronizadas con `QUESTIONS_FOR_REVIEW.md`, `EFFECTS_FOR_REVIEW.md`, `REFLECTIONS_FOR_REVIEW.md` y las 8 muestras de `QUESTION_TONE_SAMPLE.json`).

Cambios implementados para «Iniciar otra prueba»:

- `src/infrastructure/schema.ts` y `src/infrastructure/database.ts`: `schemaSQL` normal (producción) mantiene intacto `local_date TEXT NOT NULL UNIQUE` y `user_version=1`. En modo de prueba local (`localPreviewEnabled`), `private-preview/morning.db` usa `previewSchemaSQL` sin `UNIQUE` en `local_date` y migra automáticamente bases existentes v1 → v2 (`previewSchemaMigration2SQL`) conservando todas las sesiones, exposiciones, estimaciones y reflexiones previas.
- `src/infrastructure/repository.ts`: `SELECT value_json FROM sessions ORDER BY local_date, rowid` preserva el orden cronológico de inserción cuando existen múltiples sesiones de prueba en la misma fecha.
- `src/application/coordinator.ts`: `start()` conserva el bloqueo `DAY_ALREADY_USED` cuando ya se usó la fecha local. Se añadió `startAnotherPreview()`, restringido por doble control (`__DEV__` y `this.localPreview`), que exige que exista al menos una sesión previa hoy y que ninguna esté `active` (`ACTIVE_SESSION_EXISTS`). Crea una nueva sesión con UUID propio, seed diferenciada (`...|preview:<n>`) y códigos `LOCAL_PREVIEW` + `LOCAL_PREVIEW_REPEAT`. Todas las preguntas expuestas en sesiones previas del mismo día entran en `history` y quedan excluidas por el cooldown de 30 días.
- `app/index.tsx`, `app/closing.tsx` y `app/session.tsx`: las pantallas seleccionan la última sesión de hoy (`.at(-1)`) y muestran el botón secundario «Iniciar otra prueba» en Inicio (tras sesión completada o abandonada/expirada) y en Cierre únicamente cuando `localPreviewEnabled` es verdadero.

Comprobaciones ejecutadas en este bloque:

- `rtk npm run check`: validación estructural del contenido (0 errores), configuración del motor v1, `tsc --noEmit` y **39 pruebas aprobadas en 7 suites** (incluidas 3 nuevas pruebas en `tests/local-preview.test.ts` y `tests/database.test.ts` para recorridos repetidos el mismo día tras completar o abandonar, exclusión de preguntas previas, bloqueo fuera del modo local y migración SQLite v1 → v2).
- `rtk npm run format:check`: todos los archivos cumplen formato Prettier.
- `rtk npm run content:test`: 12 pruebas editoriales aprobadas.
- `rtk npm run content:integrity`: 45 archivos entregados verificados, cinco documentos originales intactos y hash canónico coincidente.
- Samsung Galaxy S20 de pruebas conectado por USB a Metro en el puerto 8082 (`http://127.0.0.1:8082`): al abrir la app migró `private-preview/morning.db` sin borrar la sesión previa y mostró en Inicio «Puedes volver a tomar un momento otro día.» junto al nuevo botón «Iniciar otra prueba». Al pulsar «Iniciar otra prueba» se abrió una nueva sesión en «Pregunta 1 de 3» con el enunciado de `1.0.0-draft.3`: «Imagina que una idea nueva aparece como un pequeño brote. ¿Cómo te sentirías al verla?», ayuda «Puedes imaginarlo a tu manera. Si no te ayuda, puedes omitir la pregunta.» y opciones inicialmente en espera de 25 s. Se dejó la pregunta abierta en el teléfono para el propietario, sin responder ni omitir por él.

## Simulación anual del motor TypeScript de producción (1.000 semillas × 365 días) · 2026-10-28

Se implementó y ejecutó el arnés de simulación anual directamente sobre el motor TypeScript de producción (`src/domain/engine/core.ts`, `src/domain/engine/questions.ts`, `src/domain/engine/reflections.ts`) con el catálogo vigente `1.0.0-draft.3` (hash `81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c`):

- `src/domain/engine/core.ts` y `src/domain/engine/questions.ts`: memoización determinista de ordinales de fecha (`day`), desempates (`tie`), metadatos de cobertura y vectores de respuesta, y acumulación directa sin asignaciones intermedias en `estimate()`, manteniendo intactos el contrato v1 (`configHash`), las firmas y los resultados en coma flotante IEEE-754.
- `tests/engine-simulation.ts`, `tests/engine.test.ts` y script `npm run engine:simulate`:
  - **Simulación de decisión**: **1.000 semillas × 365 días (365.000 sesiones)** repartidas determinísticamente entre los 8 perfiles (`all_skipped`, `indeterminate`, `pleasant`, `unpleasant`, `activation_only`, `polarized`, `mixed`, `abandoned`), más comprobación cruzada de equivalencia exacta entre historial completo acumulado e historial compacto de última exposición en 730 sesiones:
    - **0 sesiones agotadas** (`selectBase` siempre entrega 3 preguntas compatibles con Q1 `gentle`, 3 plantillas narrativas distintas y 3 clusters semánticos distintos).
    - **0 violaciones de cooldown** en la ventana de 30 días naturales (`[D, D+30]`).
    - **≥95 % de tríos base estrictos** completados sin relajar diversidad contextual (`relaxation === 0`).
    - **Invariantes de cuarta pregunta y perfiles extremos**: `all_skipped` nunca activa Q4, mantiene todas las señales en `mu: null` y cierra en `fam_neutral_generic`; `activation_only` nunca marca `distress: true`; ningún cierre emite etiquetas clínicas o negativas (solo `positive` o `nonlabel`); `selectReflection` y `supportEligible` cumplen familia, preferencia de 7 días y regla 3 de 5 días con cooldown de 7 días.
  - **Estrés independiente de capacidad a 4 exposiciones/día**: **1.000 semillas × 365 días (365.000 sesiones, 1.460.000 exposiciones)** forzando cuarta pregunta elegible y compatible cada día: **0 sesiones agotadas**, **0 violaciones de cooldown** y **120 preguntas distintas** en los primeros 30 días de cada semilla.
- En la ejecución estándar de `npm test` (`ENGINE_SIM_SEEDS=16` por defecto para mantener un ciclo rápido de ~8,7 s), `tests/engine.test.ts` ejecuta en cada corrida 2 ciclos completos de los 8 perfiles × 365 días + estrés de 4/día; la corrida completa de 1.000 semillas × 365 días se ejecutó íntegramente con éxito (`PASS tests/engine.test.ts (201.213 s)`, 7 suites y 40 pruebas aprobadas) y queda disponible en `npm run engine:simulate`.
- Otras comprobaciones ejecutadas:
  - `rtk npm run check`: 0 errores estructurales de contenido, configuración v1 válida, `tsc --noEmit` sin errores.
  - `rtk proxy npm test`: **40 pruebas aprobadas en 7 suites**.
  - `rtk npm run content:test`: **12 pruebas aprobadas** (total: **52 pruebas automatizadas**).
  - `rtk npm run content:integrity`: 45 archivos entregados verificados, 5 documentos originales intactos y hash canónico coincidente.
  - `rtk npm run format:check`: todos los archivos cumplen Prettier.
  - Estado verificado en modo solo lectura en el Samsung Galaxy S20 de pruebas (`adb reverse` activo en 8081/8082): la pantalla sigue en «Pregunta 1 de 3» («Imagina que una idea nueva aparece como un pequeño brote. ¿Cómo te sentirías al verla?») con «Ya puedes elegir una respuesta.» habilitado para que el propietario responda cuando desee.
  - Por instrucción del propietario («Ok, puedes crear el repo en mi github y hacer push? antes de hacerlo, asegurate de que la documentacion esté completa»), se revisó y completó la documentación de `README.md` y `docs/`, se inicializó Git en la raíz del proyecto (`main`) y se creó y sincronizó el repositorio remoto en GitHub (`crlsrvs/mindful-morning`).

## Preparación para repositorio público · 2026-10-30

Por instrucción del propietario («Si, ejecuta esa limpieza»), antes de cambiar la visibilidad a público:

- Se retiraron de los documentos publicados las rutas locales del equipo y el número de serie ADB del teléfono de pruebas.
- Se excluyeron de Git mediante `.gitignore`, conservándose en el equipo local: `GEMINI.md`, `docs/HANDOFF.md`, `docs/PROMPT_GEMINI.md` (continuidad entre asistentes) y las copias intermedias `docs/CONTENT_REVIEW_2026-10-26.md`, `docs/QUESTION_TONE_SAMPLE.md/.json`, `docs/QUESTIONS_FOR_REVIEW.md` y `docs/REFLECTIONS_FOR_REVIEW.md`. Las menciones históricas a esos archivos en este documento se conservan como registro. Los textos vigentes están en `content/`.
- Licencia elegida por el propietario: MIT para el código; todos los derechos reservados para el catálogo de `content/` y sus reproducciones en `docs/` (`LICENSE`).
- El autor del commit usa el correo privado de GitHub del propietario. Se reescribió el commit inicial para no dejar los datos retirados en el historial.
- `content/` y los cinco documentos originales no se modificaron (`npm run content:integrity`).
