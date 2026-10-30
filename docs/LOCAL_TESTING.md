# Modo de prueba local

Autorización del propietario, 2026-10-28: «Autorizo el modo de prueba local».

Esta autorización permite probar las preguntas y reflexiones del borrador en la versión de desarrollo aunque no se hayan completado todos los controles editoriales del contrato original. No aprueba el paquete para publicación ni afirma que se realizaron pruebas de accesibilidad u originalidad pendientes.

## Funcionamiento

- Activo únicamente cuando `__DEV__` es verdadero, en `src/infrastructure/local-preview.ts`.
- Aviso visible en todas las pantallas: «Modo de prueba local · Contenido en revisión».
- La comprobación normal `contentStatus()` sigue devolviendo `pending_review`; la disponibilidad de sesiones permite esa situación solo en desarrollo. Un hash inválido sigue bloqueando el inicio.
- El motor admite entradas draft mediante una opción explícita y comprobación adicional de `__DEV__`. No acepta rejected ni needs_revision; no se cambian metadatos de calidad, textos, efectos ni aprobaciones.
- Se mantienen 25 segundos en primer plano, omisión inmediata, 3–4 preguntas, cooldown y una sesión por fecha local. No se simula haber respondido ni se cambian las fechas del teléfono.
- Cada sesión de prueba se identifica mediante LOCAL_PREVIEW en sus códigos internos.
- Base de datos cifrada en private-preview y clave SecureStore mindful-morning-preview-db-v1, distintas de las del uso normal. No se borran ni migran datos anteriores.
- Las fichas de apoyo no aprobadas siguen ocultas; el apoyo general permanece disponible.

## Uso en el Samsung y repetición de recorridos («Iniciar otra prueba»)

Mantener Metro y la conexión USB activos para esta versión de desarrollo. Al entrar por primera vez en el espacio de prueba se muestra de nuevo la bienvenida. Después puede utilizarse «Tomarme un momento».

Si se completa o abandona una sesión en modo de prueba local, se muestra **«Iniciar otra prueba»** tanto en el inicio como en la pantalla de cierre:

- Solo está disponible cuando `__DEV__` y `localPreview` están activos y ya existe una sesión previa no activa en la fecha local actual. Nunca reemplaza una sesión `active` en curso (`ACTIVE_SESSION_EXISTS`).
- En el almacenamiento cifrado de prueba (`private-preview/morning.db`), el esquema v2 retira la restricción SQL `UNIQUE` sobre `local_date` (con migración automática no destructiva v1 → v2 al abrir la base existente) y carga las sesiones en orden de inserción (`ORDER BY local_date, rowid`). En el almacenamiento normal de producción (`private/morning.db`), `local_date TEXT NOT NULL UNIQUE` y el límite estricto de una sesión diaria en `start()` permanecen intactos.
- Cada recorrido repetido recibe su propio UUID, seed determinista diferenciada (`...|preview:<n>`) y código interno `LOCAL_PREVIEW_REPEAT` además de `LOCAL_PREVIEW`.
- Las exposiciones de todas las sesiones previas (incluidas las del mismo día) alimentan el historial de `selectBase` y `selectFourth`, por lo que las preguntas mostradas en recorridos anteriores del mismo día quedan excluidas por el cooldown de 30 días. Las reflexiones e invitaciones de apoyo de recorridos completados se incorporan al balance de familias y cooldown de reflexiones; el conteo de días consecutivos (`streak`) y la ventana 3/5 operan por conjunto de fechas calendario (`Set`), de modo que varias pruebas en un mismo día cuentan como una sola fecha calendario.

Para reiniciar por completo el espacio de prueba, el propietario puede seguir usando Configuración → Borrar todos mis datos; esa acción no se ejecuta automáticamente.

## Barrera de publicación

En un bundle de producción `__DEV__` es falso: se desactiva el modo, no se renderiza «Iniciar otra prueba», `startAnotherPreview()` rechaza con `PREVIEW_ONLY`, se usa el almacenamiento normal v1 con `local_date UNIQUE` y el selector exige aprobación completa. `scripts/release-gate.mjs` y la barrera Gradle de release permanecen vigentes y bloquean este catálogo. No distribuir el APK de desarrollo como versión final.

Pruebas automatizadas añadidas: sesión de borrador hasta cierre sin mutar aprobaciones; repetición en el mismo día tras completar o abandonar sin sobrescribir sesiones ni repetir preguntas; migración SQLite v1 → v2 de la tabla `sessions` en modo local; cooldown y exclusión de entradas rechazadas; rechazo del modo y de la repetición en producción; bloqueo por hash inválido. Los ensayos no equivalen a validación clínica ni a una auditoría completa en dispositivo.

## Servidor de esta prueba · 2026-10-28

Para el catálogo 1.0.0-draft.3 se mantiene Metro en el puerto 8082 (`npm run start -- --port 8082 --offline`), con `adb reverse tcp:8082 tcp:8082` y URL de desarrollo `http://127.0.0.1:8082`. En el Samsung Galaxy S20 de pruebas se verificó la migración automática de `private-preview/morning.db`, la aparición de «Iniciar otra prueba» en el inicio tras la sesión previa y la apertura de una nueva sesión con `Pregunta 1 de 3` del catálogo `1.0.0-draft.3` sin borrar el historial anterior.
