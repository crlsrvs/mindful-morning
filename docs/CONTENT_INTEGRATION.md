# Contenido y heurísticas

## Estado real y conservación

Se leyeron los cinco documentos originales, las guías del corpus y los reportes; todos los JSON fueron parseados, y el validador verificó tipos, IDs, efectos, pesos, dimensiones, referencias, cobertura, cuotas y hash. Se ejecutaron las pruebas editoriales existentes. No se corrió ningún comando con `--write`, ni se regeneraron reportes, hashes o texto de `content/`.

El pack `1.0.0-draft.1` tiene hash `65562b239b3b786edf3d01ea495c03dcc9f0617a5311bbc413e78d725cf7f219`. Hay 180 preguntas, 720 alternativas, 82 reflexiones y dos fichas de apoyo. **No hay entradas aprobadas para runtime.** El gate existente reporta 547 diagnósticos de aprobación, no errores de estructura.

La cobertura técnica del borrador incluye 116 preguntas con potencial de valencia ≥.75 y 128 con activación ≥.5. El reporte editorial previo documenta simulaciones de 1.000 instalaciones por 365 días y estrés a cuatro exposiciones; esos resultados no se presentan como pruebas de esta app. La implementación añade una simulación anual propia con 365 días a cuatro exposiciones y pruebas de escenarios, bajo preaprobación sintética exclusiva de tests. La cobertura real de 30 días con contenido aprobado sigue pendiente.

## Carga y aprobación

`src/infrastructure/catalog.ts` importa los archivos existentes directamente. La app exige compatibilidad de esquema/contrato, hash, manifiesto release-ready, calidad aprobada con fecha/roles/aprobaciones, originalidad/accesibilidad confirmadas y UI copy aprobado. No existe bypass de aprobación en runtime.

`quality.status` es la fuente del estado editorial. La especificación menciona `safetyFlags`, pero el esquema normativo no define ese campo: la proyección de elegibilidad usa la aprobación humana de calidad y seguridad del pack, sin añadir flags inventados a las preguntas. Una entrada draft/rechazada nunca es elegible. Los nombres `eligibleBy` del pack mapean a las puertas fijas del motor, no ejecutan fórmulas del JSON.

Las fichas de apoyo pendientes no se convierten en teléfonos aprobados. La pantalla permanente mantiene el texto general normativo y agrega fichas/acciones de marcador cuando cumplan el gate.

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

## Aceptación editorial del titular · 2026-10-26

El titular aceptó los textos y alternativas de las 180 preguntas tras leer las primeras cinco y autorizar la extensión de esa aceptación al resto. El registro exacto y su alcance están en `content/human-review.json`. No se modificaron preguntas, efectos, revisiones, estados de calidad integral ni hash del pack. Los cuatro estilos mantienen el contrato y tono general; no son todas metáforas. Continúan pendientes las comprobaciones de efectos, originalidad y accesibilidad, y la revisión del resto de entidades. Esta aceptación editorial por muestreo no se registra como una lectura individual de 180 preguntas ni como validación clínica.

## Actualización `1.0.0-draft.3` y simulación del motor de producción · 2026-10-28

El 2026-10-28 se aprobaron las 82 reflexiones (`content/reflection-human-review.json`), se aplicó la corrección de `q_0084` (`revision: 3`) y se reformuló el tono de las 180 preguntas y 567 de las 720 respuestas (`content/question-tone-review.json`), produciendo el paquete `1.0.0-draft.3` (hash `81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c`) sin alterar IDs, orden, efectos ni metadatos `quality.status="draft"`. Asimismo, se implementó y superó en `tests/engine-simulation.ts` (`npm run engine:simulate`) la simulación anual de 1.000 semillas × 365 días en modo decisión (8 perfiles) y estrés de capacidad a 4 exposiciones/día directamente sobre el motor TypeScript de producción (`src/domain/engine/*`).
