# ARCHITECTURE — Arquitectura y persistencia

**Versión:** 1.0.0 · **Fecha:** 2026-10-24 · **Normativo para el agente de implementación.**  
**Ámbito:** Android primero, iOS preparada. Implementación no incluida en esta especificación.

## 1. Decisiones tecnológicas (ADR resumidos)

| ID | Decisión | Motivo y consecuencias |
|---|---|---|
| ADR-01 | React Native + Expo + TypeScript en modo estricto | Un solo núcleo cross-platform; pruebas del motor en Node sin SDK móvil. |
| ADR-02 | Expo Router para navegación, React Context + reducer para estado de sesión | Navegación declarativa; MVP no requiere librería compleja de estado global. |
| ADR-03 | `expo-sqlite` con **SQLCipher activado en compilaciones finales Android/iOS** | Datos íntimos cifrados en reposo; **requiere development build/prebuild** (SQLCipher no funciona en Expo Go). Si no hay cifrado, no almacenar sesiones reales: fallo cerrado. |
| ADR-04 | Llave aleatoria de DB en `expo-secure-store`, sin biometría obligatoria | Separación material criptográfico/DB; evitar interrupciones por actualización biométrica. Sin backup ni recuperación en la nube. |
| ADR-05 | Contenido JSON estático empaquetado y validado en build | Offline auténtico; versiones auditables. No hacer fetch, no actualizaciones silenciosas de fuentes. |
| ADR-06 | Motor puro TypeScript, I/O por interfaces | Reproducción de resultados y tests sin plataforma; ninguna dependencia de React, reloj o SQLite dentro del motor. |
| ADR-07 | `expo-notifications` solamente con notificaciones locales tipo DAILY y `bestEffort` | Sin token push, backend ni permiso de alarma exacta; horario aproximado según sistema. |
| ADR-08 | `expo-localization` y APIs de calendario/zona; es-CL en MVP | Fechas locales estables y posterior incorporación de otras lenguas. No inferir país a partir de idioma. |
| ADR-09 | Sin telemetría de red, analytics, crash SDK de terceros, redacción libre o publicidad | Privacidad máxima y ausencia de costes recurrentes; diagnóstico técnico solo local con datos sintéticos. |
| ADR-10 | Tests unitarios con `jest-expo`/Jest y React Native Testing Library; E2E instrumentados en dispositivos | Testear lógica, integración y accesibilidad; fijar versiones compatibles con el SDK escogido. |

**Versiones de librería:** al comenzar la implementación, seleccionar un SDK de Expo estable y fijar dependencias **compatibles mediante `expo install`**. No codificar números de versión «latest» en las invariantes del producto. La guía de Expo documenta SQLCipher y sus limitaciones: https://docs.expo.dev/versions/latest/sdk/sqlite/ (consulta 2026-10-24).

## 2. Diagrama conceptual de capas

```text
React Native UI (onboarding / inicio / pregunta / cierre / ajustes / apoyo)
   |                        |                    |
   v                        v                    v
SessionApplication     PreferencesApp      SupportResourcesApp
   |                         |                    |
   v                         v                    v
SessionCoordinator     ReminderScheduler     OfflineCatalog
   |     \                   |                    |
   |      +-- QuestionSelector (motor puro)        |
   |      +-- SignalEstimator (motor puro)         |
   |      +-- ReflectionSelector (motor puro) <---+
   |      +-- PatternEvaluator (motor puro)
   v
Repositories (interfaces) + VersionedContentProvider + Clock/Timezone + SeedProvider
   |
   v
LocalAdapters: encrypted SQLite + Expo Notifications + SecureStore + bundled assets
```

No permitir que `domain/*` importe `react-native`, `expo-*`, módulos de red, SQL o estados de UI. Las interfaces de infraestructura son puertos; adapters realizan todas las operaciones asíncronas.

### Estructura de proyecto sugerida

```text
app/                      # rutas UI (Expo Router)
src/ui/components/        # componentes accesibles y design tokens
src/ui/screens/           # composición sin reglas del motor
src/application/          # casos de uso/orquestación
src/domain/session/       # estados, invariantes, transiciones
src/domain/engine/        # matemáticas, selección, patrones, sorteo
src/domain/content/       # modelos y validadores del contrato editorial
src/infrastructure/db/    # conexión cifrada, migraciones, repositorios
src/infrastructure/system/# reloj, zona, notificaciones, llaves
src/infrastructure/assets/# cargador del contenido empaquetado
src/support/              # recursos verificados empaquetados
assets/content/es-CL/     # manifiesto y JSON firmados por revisión interna
config/                   # engine-config.v1.json, sin heurísticas dispersas
scripts/validation/       # QA de contenido y simulaciones, tooling de build
tests/unit/ tests/integration/ tests/e2e/
```

El contenido y el motor **no** se editan en el mismo paquete fuente: mantener catálogo con su manifiesto; motor referencia solamente IDs y reglas de contrato.

## 3. Contratos de aplicación

**Puertos del motor (datos de entrada inmutables):**

- `QuestionSelector.selectBase({ localDate, seed, manifest, exposureHistory, answeredContext, config }) → QuestionSelection[]` exactamente tres elementos elegibles, en orden. Se ejecuta al iniciar y registra exposición de la primera; las siguientes se pueden preseleccionar y persistir, pero solo cuentan como «mostradas» cuando aparecen.
- `SignalEstimator.estimate({ observedAnswers, contentSnapshot, config }) → EngineEstimate` con dimensiones numéricas o `null`, `confidence`, `nEff`, `variance`, `evidenceCount` y metadatos de versión; sin redondeo para decisiones. Cero señales → `null` y confianza 0.
- `AdaptiveSelector.maybeSelectFourth({ observedAnswers, skippedPrimaryTags, candidatePool, snapshot, config, seed }) → questionId|null`. Decide solo después de registrar la respuesta/omisión de Q3; no realiza I/O.
- `ReflectionSelector.select({ estimate, recentReflectionIds, manifest, config, seed }) → {reflectionId, closureMode, familyId, rationaleCode}`. No genera lenguaje.
- `PatternEvaluator.evaluate({ currentSessionEstimate, previousCompletedSessions, nowDate, lastSupportShownAt, config }) → bool`.
- `SessionCoordinator` **único dueño de escrituras y estados**; ni UI ni motor escriben DB.

**Entradas reproducibles:** motor versionado, versión/config hash, contenido y efecto versionados, orden de respuestas, fechas y seed. El estado de UI o la hora efectiva de evaluación nunca altera el resultado si esas entradas son idénticas.

**Salida de motor:** no expone «diagnóstico», «estado real» ni probabilidades; `closureMode = positive | nonlabel`, `distressConsistent = true|false` (interno) y trazas auditables sin frases sensibles en logs.

## 4. Máquina de estados diaria

```text
NONE -> ACTIVE_Q1 -> ACTIVE_Q2 -> ACTIVE_Q3 -> [ACTIVE_Q4] -> COMPLETED
           \             \              \            \
            +-------------+--------------+-------------+--> ABANDONED

ACTIVE_Qn -- (app en background) --> ACTIVE_Qn (pausado; misma pregunta)
ACTIVE_Qn -- (fecha local cambió) --> EXPIRED
COMPLETED y ABANDONED/EXPIRED son terminales para la misma fecha.
```

- El campo `activeSeconds` de cada exposición se actualiza en checkpoints frecuentes y al salir; no cuenta intervalos en background. **No usar `setTimeout` como única fuente de verdad**: usar deltas de reloj monotónico durante foreground y persistir acumulados al cambiar de estado. Tras proceso muerto, admitir pérdida de hasta 1 s y **nunca habilitar anticipadamente**.
- Cuando el SO cierre el proceso, restaurar Q activa, respuesta pendiente y segundos acumulados. Si el proceso muere durante transición, transacción evita una respuesta guardada sin progreso.
- Mantener respuestas inmutables tras avanzar para impedir «repetir hasta obtener positivo». No ofrecer botón atrás para modificar una respuesta, pero sí navegación a inicio/ayuda.
- Fin de día detectado al foreground: marcar EXPIRED. Sesiones expiradas no se consideran completadas y sí preservan preguntas efectivamente mostradas para exclusión.
- Transición a COMPLETED en transacción **exclusiva**: verificar unicidad de día, persistir estimación final, cierre, recuento, hora, evento de oferta de apoyo (si corresponde). No hay estados completados incompletos.

## 5. Modelo de almacenamiento (schema lógico SQLite v1)

Los nombres son guía contractual; columnas pueden normalizarse más, pero no eliminar campos semánticos.

### `app_settings`

- `setting_key TEXT PRIMARY KEY`, `value_json TEXT NOT NULL`, `updated_at_utc TEXT NOT NULL`.
- Claves: `onboarding_completed`, `reminder_enabled` (default false), `reminder_hhmm` (default `09:00`), `streak_enabled` (default false), `reflection_wait_seconds` (25, solo configuración interna), `last_support_shown_local_date` (nullable), `install_sentinel_version`.
- No guardar estados emocionales en preferencias.

### `sessions`

- `id TEXT PRIMARY KEY` (UUID local aleatorio); `local_date TEXT NOT NULL UNIQUE` (`YYYY-MM-DD`); `started_at_utc TEXT`; `finished_at_utc TEXT NULL`; `time_zone_id TEXT`; `utc_offset_at_start_minutes INTEGER`; `session_context TEXT DEFAULT 'morning_intent'`; `state TEXT` (`active|completed|abandoned|expired`); `question_count INTEGER`; `engine_version TEXT`; `config_hash TEXT`; `content_pack_id TEXT`; `content_pack_version TEXT`; `content_pack_hash TEXT`; `seed TEXT`; `base_question_ids_json TEXT` (3 IDs); `fourth_question_id TEXT NULL`; `closure_mode TEXT NULL`; `reflection_id TEXT NULL`; `reflection_family_id TEXT NULL`; `distress_consistent INTEGER NULL`; `support_suggestion_shown INTEGER DEFAULT 0`; `baseline_version TEXT NULL` (reservado, no usar en MVP).
- `local_date UNIQUE`: no más de un registro incluso abandonado por día; permite reabrir solo ACTIVE. Si persona cancela, no reiniciar ese día.

### `question_exposures`

- `id TEXT PRIMARY KEY`; `session_id TEXT`; `question_id TEXT`; `question_revision INTEGER`; `sequence INTEGER` (1–4); `first_shown_at_utc TEXT`; `active_seconds INTEGER DEFAULT 0`; `response_status TEXT` (`pending|answered|skipped`); `answer_id TEXT NULL`; `answered_at_utc TEXT NULL`; `question_snapshot_json TEXT` con texto de pantalla y efectos ligados a las opciones.
- Restricciones: UNIQUE(`session_id`,`sequence`); UNIQUE(`session_id`,`question_id`); CHECK(`sequence BETWEEN 1 AND 4`); `skipped` → `answer_id IS NULL`; `answered` → `answer_id IS NOT NULL`.
- Índice `question_exposures(question_id,first_shown_at_utc)` y `sessions(local_date,state)`. Exclusión de repetición se determina por **fecha local asociada a la sesión**, no por timestamp o orden de exposición.

### `engine_estimates`

- `session_id TEXT PRIMARY KEY`; `engine_version TEXT`; `config_hash TEXT`; `content_pack_hash TEXT`; `vector_json TEXT` (6 dimensiones, null permitidos); `confidence_json TEXT`; `variance_json TEXT`; `n_eff_json TEXT`; `evidence_counts_json TEXT`; `rationale_codes_json TEXT`; `closure_mode TEXT`; `distress_consistent INTEGER`; `derived_at_utc TEXT`.
- Snapshot **inmutable tras completar**. Reprocesamientos posteriores de investigación usarían otra tabla/versionado, no sobrescriben el resultado mostrado en el MVP.

### `reflection_exposures`

- `id TEXT PRIMARY KEY`; `session_id TEXT NOT NULL`; `reflection_id TEXT NOT NULL`; `family_id TEXT NOT NULL`; `kind TEXT` (`closing|support`); `shown_at_utc TEXT`; `content_revision INTEGER`; `copy_snapshot TEXT`.
- Se escribe en la misma transacción final **antes de presentar** pantalla; si UI nunca se abre por crash, se conserva como seleccionada. En este caso «mostrada» significa comprometida para mostrar y no debe repetirse por un reinicio.

### `schema_migrations`

- `version INTEGER PRIMARY KEY`, `applied_at_utc TEXT`, `checksum TEXT`. Usar también `PRAGMA user_version`. Todas las migraciones son incrementales e idempotentes desde v1; sin borrar datos en una actualización.

### Índices, claves y restricciones

Claves foráneas con `PRAGMA foreign_keys=ON`, WAL, transacciones `withExclusiveTransactionAsync` para decisiones terminales; sentencias parametrizadas siempre. La DB sólo contiene contenido de respuesta cerrada y snapshots mínimos; **ninguna nota libre**. No persistir textos mostrados en logs, crash reports, portapapeles ni capturas automáticas.

## 6. Cifrado, privacidad, borrado y backups

1. Generar llave de 256 bits con RNG seguro nativo; guardar en `expo-secure-store`. Nunca contraseña hardcoded o derivada de ID; no enviar llave fuera de la app.
2. Verificar `PRAGMA cipher_version` antes de abrir datos; **fail-closed** si SQLCipher no está disponible (Expo Go puede servir solo para pantallas con fixtures no personales). Abrir BD cifrada, aplicar `PRAGMA key` de manera segura y minimizar paso por logs. Revisar cuidadosamente el manejo de materiales secretos de acuerdo con plataforma.
3. Desactivar backup automático de DB/archivos locales sensibles en Android y excluir DB de iOS/iCloud backup mediante configuración nativa; documentar que desinstalar implica perder el historial. No hacer exportación en MVP.
4. `Borrar mis datos`: cerrar conexiones, borrar DB y archivos auxiliares (`-wal`, `-shm`), limpiar llave SecureStore, cancelar notificaciones locales, restablecer configuración/sentinel y comprobar re-onboarding. El borrado del contenedor **no garantiza limpieza forense de bloques flash**, transparencia en privacidad.
5. iOS Keychain puede conservar valores tras desinstalar; detectar instalación nueva usando un marcador dentro del sandbox normal y, al no existir, descartar la llave antigua antes de crear otra. No intentar restaurar BD de una instalación anterior.
6. No usar datos productivos en snapshots de test, analytics, capturas, logs o reportes de error. Depuración solo con fixtures sintéticos, errores genéricos e IDs no sensibles.
7. Modelo de amenazas: dispositivo desbloqueado y comprometido, procesos con privilegios, screenshot manual del usuario, llamada telefónica/red del SO, y pérdida del dispositivo **no se resuelven** por completo con SQLCipher.

## 7. Content lifecycle y compatibilidad

- Cada paquete trae `{packId, version, schemaVersion, locale, hash, questions, reflectionFamilies, reflections, sources, supportResources, qualityMetadata}` y `compatibility.engineContract=1`. El validador de build verifica SHA-256, IDs, referencias, tipos, copys seguros y disponibilidad 30 días.
- La app empaqueta una sola revisión activa del catálogo por release. Mantener snapshots de ítems mostrados **y efectos** en `question_exposures` para que una actualización no reinterprete una respuesta antigua.
- Una sesión activa termina usando la misma versión de contenido y config con la que se inició. Si el nuevo binario ya no trae el paquete anterior, snapshots suficientes preservan preguntas preseleccionadas y sus respuestas; de otro modo, cancelar como `expired/abandoned` **sin calcular con datos incompatibles**, comunicarlo sin culpar.
- No cambiar significado de un `answer_id` o `question_id` en una revisión existente; corrección semántica → nueva revisión con snapshot explícito, cambio incompatible → nuevo ID.
- El motor declara `engineContractVersion`; si el paquete no coincide, impedir inicio y mostrar mensaje genérico de mantenimiento local, nunca una pregunta inventada.
- Catálogos y configuraciones deben quedar bajo control de versiones del repositorio, no del servidor.

## 8. Reloj, zonas horarias y notificaciones

- Usar un `ClockPort` que separa tiempo monotónico de espera, instante UTC para persistencia y `YYYY-MM-DD` en la zona activa al inicio. El `DatePort` compara fechas calendario con aritmética real (no dividir ms por 86.400.000 en DST).
- Una sesión completada preserva `time_zone_id` original. Al volver de viaje o modificar zona, no cambiar el `local_date` guardado. Si el día actual coincide con fecha ya usada, no reiniciar otra sesión; en caso de ambigüedad, priorizar **no duplicación**.
- Notificación `DAILY` en hora:minuto del dispositivo, sin permiso `SCHEDULE_EXACT_ALARM`; no prometer entrega exacta en Android. Cuando cambie el horario, cancelar anteriores y programar **una sola** notificación. Si se desactiva, cancelar totalmente.
- Calendario local sigue variaciones horarias del dispositivo. La notificación no transporta respuestas, estado emocional ni contenido íntimo a la pantalla de bloqueo.

## 9. Manejo de errores offline

| Caso | Comportamiento | Invariante preservada |
|---|---|---|
| DB bloqueada momentáneamente | Reintento acotado en repositorio; UI neutra sin perder la pregunta | Nunca duplicar respuesta ni completar sin transacción |
| SQLCipher ausente | No guardar sesiones reales; error amistoso y pruebas técnicas | Confidencialidad antes que disponibilidad |
| Contenido corrupto/incompatible | Deshabilitar inicio con explicación breve; `Necesito apoyo` aún accesible | Ningún texto improvisado ni resultado inválido |
| Pocas preguntas elegibles | Relajar diversidad/penalización, **no** cooldown ni seguridad; si siguen menos de 3, no iniciar | No infringir regla de 30 días |
| Se mata proceso entre selección y escritura | Restaurar estado confirmado por transacción; deduplicar por IDs | Determinismo e integridad |
| Denegación notificaciones | Conservar opción off y flujo completo | No coerción |
| Falta de red | Flujos internos inalterados; recursos de llamada dependen de señal telefónica | Offline primero |
| Cambio de zona/fecha | Fecha anclada a sesión y validación UNIQUE local_date | Como máximo una sesión por día registrado |

## 10. Pruebas y pipeline de calidad

1. **Validación estática** (`content:validate`): esquema, integridad referencial, originalidad, 160–200 ítems, límites editoriales, familias, seguridad, simulación de 30 días, cruces de dimensiones.
2. **Unitarias del dominio:** scoring y agregación con aritmética reproducible, invariancias, desempates, saltos sin efecto, umbrales exactos y patrones. Tests de propiedades y tablas de `DECISION_ENGINE.md`.
3. **Integración SQLite cifrada:** migración, cierre atómico, restauración, SQLCipher real, borrado (en development/release build, no Expo Go), ataques de doble click y reinicio en transacción.
4. **UI:** tiempo foreground/background, accesibilidad de habilitación, permiso opt-in, ajuste de tipografía, no etiquetas negativas.
5. **End-to-end:** 30 días y 365 días con reloj inyectado, zona horaria y DST; modo avión; negativa de permisos; notificación programada.
6. **Release smoke Android:** pruebas en dispositivo Android reciente y un Android de menor potencia; **compatibilidad lógica iOS** y prueba de build iOS antes de declarar listo para la plataforma.
7. **Auditoría privacidad:** monitor de tráfico 0 requests iniciadas por app, revisiones de manifiestos/entitlements, backup y dependencia; sistema operativo/tienda pueden efectuar tráfico ajeno a la app.

## 11. Observabilidad sin datos privados

Instrumentación **solo durante desarrollo local**: `traceId` aleatorio, `rationaleCodes`, IDs sintéticos, duración agregada temporal en memoria; desactivarla para compilación final. No emitir respuestas, seis dimensiones, reflexión, URLs con parámetros identificadores, cronología personal ni fecha personal a consola/telemetría. Los tests sí guardan resultados sintéticos versionados en fixtures.

## 12. Transferencia al agente de software

Entregables esperados: árbol modular; interfaz de los puertos descritos; esquemas/migraciones versionadas; paquete JSON validador; implementación de `DECISION_ENGINE.md` sin fórmulas alternativas; diseño UI; pruebas automatizadas y manuales; instrucciones de builds cifradas y QA. **No** añadir backend, IA, rastreadores, permisos de ubicación, exact alarms, almacenamiento en claro ni filtros emocionales «inteligentes». La interfaz debe mostrar exclusivamente copy preaprobado del catálogo.

**Fuentes técnicas oficiales (consulta 2026-10-24):**
- Expo SQLite / SQLCipher / transacciones: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Expo SecureStore / diferencias Android-iOS: https://docs.expo.dev/versions/latest/sdk/securestore/
- Expo Notifications, permisos y DAILY: https://docs.expo.dev/versions/latest/sdk/notifications/
- Expo Localization: https://docs.expo.dev/versions/latest/sdk/localization/
- Expo Jest: https://docs.expo.dev/develop/unit-testing/
