# Corpus de autorreflexión matinal · es-CL

Versión **1.0.0-draft.1**, contrato de motor y esquema **1**. Contenido completo para integración de desarrollo y revisión: **180 preguntas, 720 alternativas y 82 reflexiones**. No está aprobado para publicación ni clínicamente validado.

## Archivos para integrar

`questions.json`, `reflections.json`, `dimensions.json`, `reflection-families.json`, `content-sources.json`, `support-resources.json` y `manifest.json` siguen las entidades de CONTENT_SPEC. `categories.json` añade taxonomía temática versionada y referencias a dimensiones y familias. `ui-copy.json` define la omisión funcional y textos auxiliares; no introduce campos ajenos en las entidades normativas. `content-contract.ts` ofrece tipos estrictos; `schema/` contiene esquemas JSON y el registro de archivos.

El usuario pidió esta entrega en `content/`, por eso no se escribió en `assets/`. Después de la revisión y aprobación, el implementador puede incorporar el catálogo aprobado a `assets/content/es-CL/` según ARCHITECTURE. El runtime debe rechazar cualquier entrada no aprobada. No cambiar `draft` a `approved` para sortear el control.

Todas las opciones de respuesta están escritas. No se necesitan un LLM, plantillas de lenguaje ni red al usar el contenido. La app debe conservar el texto y el orden, la exposición antes de habilitar opciones, la omisión inmediata independiente y los snapshots de ID/revisión/efectos por sesión. No mostrar notas de interpretación, señales ni metadatos de QA.

## Comprobaciones reproducibles

Requisitos locales de herramientas: Node.js moderno y TypeScript disponible como `tsc` en PATH. No hay dependencias de runtime ni paquetes que instalar para validar, hacer lint o simular. `typecheck` usa el compilador TypeScript del proyecto integrador; alternativamente `CONTENT_TSC` acepta la ruta a `typescript/bin/tsc`. Ninguna herramienta descarga un modelo o un paquete.

```sh
npm run typecheck
npm run lint
npm test
npm run content:validate
npm run content:similarity
npm run content:simulate
```

`typecheck` construye temporalmente literales tipados de los siete archivos normativos y verifica `satisfies` con TypeScript strict. El linter combina sintaxis, formato y reglas de copy; no se presenta como una suite ESLint. `content:validate` verifica el borrador estructuralmente. `content:release-check` **debe fallar en esta versión**, porque faltan aprobaciones humanas. Ese resultado es un bloqueo de gobernanza explícito, no un error de JSON o un test roto.

`content:simulate` reproduce 1.000 instalaciones × 365 fechas con respuestas variadas, y otras 1.000 × 365 con una cuarta exposición forzada para probar capacidad. Los tests de omisión, clasificación y reglas de fechas usan datos sintéticos. Las trazas de muestra son sintéticas y no contienen personas reales.

Los scripts en `tools/` son referencias de QA, no implementación del motor móvil. Para simular capacidad se permite explícitamente acceder a los borradores dentro de las herramientas; no se aprueba ni modifica ninguna entrada por ello. El motor de producción debe implementarse y comprobarse contra DECISION_ENGINE con su configuración única y sus adaptadores. Estas pruebas no sustituyen integración Android, persistencia, TalkBack, cifrado ni análisis de red.

## Compatibilidad e integridad

`hash-scope.json` define la serialización y los archivos cubiertos por el SHA-256 del manifiesto. `checksums.json` cubre los archivos entregados byte por byte, salvo él mismo. Si cambia copy o semántica, actualizar versión/revisión, ejecutar `content:hash`, repetir las pruebas y regenerar los reportes. No editar una huella a mano.

CONTENT_SPEC enumera un ejemplo de `eligibleBy` pero no los literales de todas las puertas. Este paquete explicita esos nombres en tipos y esquemas: `POSITIVE_GROUNDED_GATE` refiere a §4 positivo; `NONLABEL_*_GATE`, a §4 familia contextual correspondiente; `NONLABEL_NO_CONTEXT_GATE`, al fallback de §4; `SUPPORT_3_OF_5_GATE`, a §7. Los nombres no son expresiones ejecutables ni cambian umbrales. El implementador debe confirmar el mapeo y `minCompatibleEngine=1.0.0` antes de aprobar compatibilidad.

La ficha `quality` es la única ubicación de `status` en las entidades del catálogo. La mención `qualityStatus` del selector se interpreta como lectura de `quality.status`; no se añade un campo desconocido. `safetyFlags` aparece en el motor pero no en el contrato de pregunta: este paquete no lo inventa. El integrador debe definir su proyección desde el proceso de seguridad al crear su modelo de carga, conservando los filtros absolutos.

`manifest.publishedAt` registra la preparación del artefacto de revisión, **no** una publicación pública. `manifest.review.releaseReady=false` y `quality-report.json` resuelven su estatus. El mínimo de 82 reflexiones **aprobadas** del contrato todavía no se cumple; existen 82 textos completos con aprobación pendiente. No se atribuye revisión a profesionales ni a personas que no participaron.

## Evidencia editorial

Leer `content-guidelines.md`, `content-sources.md` y `content-audit.md`. Los archivos adicionales de matriz, justificación de señales, revisión, similitud, simulaciones e integridad son extensiones versionadas de auditoría, separadas del JSON de runtime. No cargarlos como preguntas o reflexiones.
