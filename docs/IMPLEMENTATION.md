# Implementación y decisiones técnicas

Estado vigente: [STATUS.md](STATUS.md), actualizado el 2026-10-30.

## Capas

- `app/`: rutas Expo Router; bienvenida, inicio, sesión, cierre, ajustes, límites y apoyo.
- `src/ui/`: componentes accesibles, paleta, Context + reducer y adaptación de eventos de primer plano.
- `src/application/`: `SessionCoordinator` como único coordinador de estados y escrituras; puertos de repositorio/reloj y modelos persistidos.
- `src/domain/engine/`: configuración, hash, aritmética, selectores y patrón, sin React ni Expo. Entradas explícitas, sin reloj global ni azar implícito.
- `src/domain/session/timer.ts`: acumulación monotónica de tiempo de presencia.
- `src/infrastructure/`: catálogo empaquetado, SQLite cifrado, repositorio SQL, notificaciones locales y reloj del dispositivo.
- `config/engine-config.v1.json`: único conjunto de parámetros del motor v1.

Se importa el catálogo directamente desde `content/`: evita duplicarlo y mantiene una sola fuente. El manifiesto, el hash canónico y la aprobación se verifican al habilitar sesiones. Metro ejecuta además el validador estructural existente, sin `--write`.

## Sesión y continuidad

La selección base comprueba completabilidad del trío y relaja objetivos en el orden normativo, nunca aprobación/cooldown/identidad narrativa. Solo la primera pregunta se registra expuesta al iniciar. Cada transición persiste la respuesta y la siguiente exposición juntas antes de presentar la nueva pregunta. Un segundo toque con el ID anterior no avanza otra pregunta.

En producción, una fecha local es única, incluso después de abandono. El modo de prueba admite sesiones repetidas mediante «Iniciar otra prueba», con esquema separado v2; ver LOCAL_TESTING.md. La fecha, zona IANA, offset UTC, contexto, locale, seed, versiones, hash de configuración y pack quedan anclados. Una sesión que cambia de fecha expira. Al cambiar pack o configuración durante un borrador se elige la alternativa segura de la especificación: expirar sin recomputar con contenido distinto. Los cierres completados conservan snapshots y no se recalculan.

Se guardan preguntas preseleccionadas completas, preguntas expuestas, respuestas por ID, tiempos, efectos, estimación, motivos de decisión, cierre, apoyo y streak. `baselineVersion=null` y `timeOfDay=morning` quedan reservados; no hay baseline ni historial visible.

El timer usa `performance.now()`, pausa con AppState y al perder foco de la ruta. Hace checkpoints de segundos completos aproximadamente cada segundo y al salir. Nunca acredita tiempo transcurrido mientras el proceso estaba cerrado. Una escritura fallida muestra un error y no habilita una respuesta en el coordinador; los tiempos de durabilidad bajo bloqueo/disco lento requieren comprobarse en dispositivo.

## Persistencia y adaptación de la API SQLite

Tablas v1: `app_settings`, `sessions`, `question_exposures`, `engine_estimates`, `reflection_exposures`, `schema_migrations`. Campos variables y snapshots van en JSON dentro de SQLite; `local_date UNIQUE`, las claves foráneas y las restricciones de respuesta/orden son SQL. WAL y `busy_timeout=2500`. El repositorio serializa lecturas y escrituras; un fallo revierte la transacción.

**Adaptación técnica respecto al nombre de API propuesto en ARCHITECTURE:** se usa `BEGIN EXCLUSIVE`/`COMMIT`/`ROLLBACK` sobre una sola conexión cifrada, en una cola privada. Se inspeccionó `expo-sqlite/src/SQLiteDatabase.ts` de SDK 58: `withExclusiveTransactionAsync` abre otra conexión que no hereda `PRAGMA key` ni `foreign_keys`. Reutilizar esa API sin inicializar correctamente la nueva conexión rompería el cifrado. El adaptador explícito preserva la exclusividad y atomicidad requeridas y se prueba con SQLite real. Nunca se entrega la conexión a la UI. `useNewConnection:true` también evita registrar la BD en el inspector de desarrollo de SQLite.

Se comprueba `PRAGMA cipher_version` antes de crear tablas. La llave se genera con 32 bytes de RNG nativo y se guarda con `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Solo hex validado se interpola en el PRAGMA, que no admite parámetros; todo dato de aplicación usa parámetros SQL. Una BD existente sin llave produce error, nunca recreación silenciosa. Un sentinel del sandbox detecta instalaciones nuevas frente a Keychain persistente.

El borrado cancela notificaciones, registra intención de borrado, cierra la conexión y elimina DB/WAL/SHM, llave y sentinel. Una intención interrumpida se completa al abrir de nuevo. Android deshabilita backup; un config plugin marca Documents como excluido de backup en iOS. Los defaults se recrean al volver a la bienvenida. No se promete limpieza forense.

## Presentación y accesibilidad

Tipografía del sistema escalable, contenido desplazable, botones de al menos 52 unidades y estado `disabled` semántico. El reloj no muestra cuenta atrás. Se anuncia la habilitación al lector de pantalla. No hay animación obligatoria y las rutas usan transición sin movimiento, por lo que no contradicen la preferencia de movimiento reducido.

En producción se exige catálogo aprobado; el modo de prueba local autorizado admite draft sin falsificar sus metadatos. Los textos generales de onboarding, límites y apoyo proceden del PRD y EVIDENCE_AND_LIMITATIONS. No se muestran ejes, confianza, etiquetas negativas ni razones internas. Las llamadas abren el marcador tras confirmación; no se infiere ubicación.

## Estado y verificaciones pendientes

Android development funciona en emulador y Samsung. El modo local permite recorrer el borrador; producción sigue bloqueada por aprobaciones pendientes. Las comprobaciones físicas de pausa y recuperación del 30-10-2026 se registran en VERIFICATION.md. STATUS.md concentra el siguiente trabajo y distingue evidencia histórica de verificaciones recientes.

## Incorporar o corregir contenido

1. Seguir `CONTENT_SPEC.md` y `content/content-guidelines.md`; conservar IDs/orden y registrar cambios semánticos con revisión o nuevo ID según contrato.
2. Mantener 160–200 preguntas, cuotas por familia, alternativas y cobertura; nunca compensar escasez desactivando cooldown.
3. Registrar revisión humana real, incluyendo efectos triples, pares semánticos pendientes, copy, accesibilidad y recursos. No sustituir nombres de revisores por un agente ni aprobar todo por pasar tests.
4. Actualizar versión/revisión y hashes con las herramientas editoriales **solo dentro de una tarea editorial autorizada**. Las herramientas `content/tools/*` pueden escribir reportes al pasar `--write`; los scripts de la raíz son read-only.
5. Ejecutar validación, tipado del contrato, lint, integridad, pruebas y simulaciones del corpus; después las suites de la app y `npm run release:check`.
6. Verificar recursos/contactos antes de distribuir. Aprobación editorial no significa validación clínica.

No editar los documentos originales para hacer encajar una implementación. Si cambia la semántica, realizar una revisión explícita de la especificación.

## Configuración única

`config/engine-config.v1.json` contiene los valores normativos. El motor rechaza una configuración distinta de su contrato fijo v1; cambios de heurísticas deben versionarse junto con tests y documentación. El tiempo 25 s puede revisarse por release dentro de 20–30, nunca por respuesta ni como preferencia clínica.

Estimación: media ponderada, tamaño efectivo `W²/Σw²`, varianza ponderada y `min(.85,min(1,nEff/3)) × (1−V)`. Omisiones y alternativas sin efectos son desconocidas; cero explícito sí es evidencia. Las sumas se ordenan por ID, los desempates usan SHA-256 y las fechas se comparan como ordinales de calendario, no duraciones locales sujetas a DST.

Q4 aplica el mínimo de dos respuestas, incertidumbre de valencia, razón accionable, veto de dimensiones omitidas, vectores distintos y ganancia ≥.08. No utiliza emociones históricas. La simulación de familias usa las puertas admisibles del estado actual sin historial emocional adicional; `unmetCoverage` pondera valencia doble frente a los cuatro contextos, como la referencia QA del corpus. Activación no sustituye tensión.

## Discrepancia numérica S3

DECISION_ENGINE §3 define inequívocamente el techo .85 **antes** de multiplicar por concordancia. El ejemplo S3 usa valores que omiten ese techo al llegar a tres señales de igual peso. Para `+.8,−.6,0`, `V=.328888…`, por lo que `C=.85×(1−V)=.570444…`, no `.6711` como indica el ejemplo. El motor sigue la fórmula normativa; la prueba conserva esa cifra y el cierre sigue siendo `nonlabel`. Los documentos originales no fueron alterados. No se cambió la fórmula para reproducir el error ilustrativo.


## Catálogo y barrera de aprobación

El catálogo se importa directamente desde content/, sin copia generada. Producción exige contrato compatible, hash canónico, manifiesto release-ready, calidad aprobada y controles humanos completos. En desarrollo, selectable y contentAvailableForSession admiten draft exclusivamente con el modo local y __DEV__; un hash inválido sigue bloqueando la sesión. Las fichas telefónicas pendientes siguen ocultas. Los eligibleBy del pack se interpretan con puertas fijas del motor, no ejecutando expresiones del JSON.

La aceptación editorial histórica y el nuevo tono están registrados en content/human-review.json, reflection-human-review.json y question-tone-review.json. Los metadatos de calidad integral permanecen draft hasta completar las revisiones; no equivale a falta de aprobación del tono.
