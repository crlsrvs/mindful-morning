# Implementación del MVP · 2026-10-25

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

Una fecha local es única, incluso después de abandono. La fecha, zona IANA, offset UTC, contexto, locale, seed, versiones, hash de configuración y pack quedan anclados. Una sesión que cambia de fecha expira. Al cambiar pack o configuración durante un borrador se elige la alternativa segura de la especificación: expirar sin recomputar con contenido distinto. Los cierres completados conservan snapshots y no se recalculan.

Se guardan preguntas preseleccionadas completas, preguntas expuestas, respuestas por ID, tiempos, efectos, estimación, motivos de decisión, cierre, apoyo y streak. `baselineVersion=null` y `timeOfDay=morning` quedan reservados; no hay baseline ni historial visible.

El timer usa `performance.now()`, pausa con AppState y al perder foco de la ruta. Hace checkpoints de segundos completos aproximadamente cada segundo y al salir. Nunca acredita tiempo transcurrido mientras el proceso estaba cerrado. Una escritura fallida muestra un error y no habilita una respuesta en el coordinador; los tiempos de durabilidad bajo bloqueo/disco lento requieren comprobarse en dispositivo.

## Persistencia y adaptación de la API SQLite

Tablas v1: `app_settings`, `sessions`, `question_exposures`, `engine_estimates`, `reflection_exposures`, `schema_migrations`. Campos variables y snapshots van en JSON dentro de SQLite; `local_date UNIQUE`, las claves foráneas y las restricciones de respuesta/orden son SQL. WAL y `busy_timeout=2500`. El repositorio serializa lecturas y escrituras; un fallo revierte la transacción.

**Adaptación técnica respecto al nombre de API propuesto en ARCHITECTURE:** se usa `BEGIN EXCLUSIVE`/`COMMIT`/`ROLLBACK` sobre una sola conexión cifrada, en una cola privada. Se inspeccionó `expo-sqlite/src/SQLiteDatabase.ts` de SDK 58: `withExclusiveTransactionAsync` abre otra conexión que no hereda `PRAGMA key` ni `foreign_keys`. Reutilizar esa API sin inicializar correctamente la nueva conexión rompería el cifrado. El adaptador explícito preserva la exclusividad y atomicidad requeridas y se prueba con SQLite real. Nunca se entrega la conexión a la UI. `useNewConnection:true` también evita registrar la BD en el inspector de desarrollo de SQLite.

Se comprueba `PRAGMA cipher_version` antes de crear tablas. La llave se genera con 32 bytes de RNG nativo y se guarda con `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Solo hex validado se interpola en el PRAGMA, que no admite parámetros; todo dato de aplicación usa parámetros SQL. Una BD existente sin llave produce error, nunca recreación silenciosa. Un sentinel del sandbox detecta instalaciones nuevas frente a Keychain persistente.

El borrado cancela notificaciones, registra intención de borrado, cierra la conexión y elimina DB/WAL/SHM, llave y sentinel. Una intención interrumpida se completa al abrir de nuevo. Android deshabilita backup; un config plugin marca Documents como excluido de backup en iOS. Los defaults se recrean al volver a la bienvenida. No se promete limpieza forense.

## Presentación y accesibilidad

Tipografía del sistema escalable, contenido desplazable, botones de al menos 52 unidades y estado `disabled` semántico. El reloj no muestra cuenta atrás. Se anuncia la habilitación al lector de pantalla. No hay animación obligatoria y las rutas usan transición sin movimiento, por lo que no contradicen la preferencia de movimiento reducido.

Texto emocional solo del catálogo aprobado. Los textos generales de onboarding, límites y apoyo proceden del PRD y EVIDENCE_AND_LIMITATIONS. No se muestran ejes, confianza, etiquetas negativas ni razones internas. Las llamadas abren el marcador tras confirmación; no se infiere ubicación.

## Límites de esta entrega

El pack sigue pendiente de revisión humana. Hay código para los flujos completos y pruebas de integración con fixtures, pero no se habilitaron sesiones reales. El 2026-10-26 se completó la build development Android ARM64, se instaló en el emulador API 37 y se abrió la bienvenida. La DB creada no presenta cabecera SQLite plana y SQLite estándar sin clave la rechaza; faltan las pruebas nativas completas de recuperación, borrado y dispositivos físicos. La app no debe declararse lista para release hasta cumplir el checklist de VERIFICATION.
