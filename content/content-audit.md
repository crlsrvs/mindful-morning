# Auditoría del corpus · es-CL · 1.0.0-draft.1

Fecha: 2026-10-25. Responsable de autoría y autoauditoría: agente de contenido. **No participó una persona revisora independiente ni un panel profesional. No existe validación clínica o psicométrica.**

El corpus de autoría está completo y sus controles técnicos pasan. Su estado es **borrador completo para integración de desarrollo y revisión humana**, con publicación bloqueada. Tener 82 textos terminados no equivale a cumplir el mínimo contractual de 82 reflexiones aprobadas.

## Totales, versiones y conformidad

- 180 preguntas, IDs q_0001…q_0180, revisión 1, locale es-CL.
- 720 alternativas cerradas: cuatro por pregunta, con ID y justificación individual; 696 textos distintos después de normalizar.
- 82 reflexiones: 76 cierres y 6 invitaciones adicionales; nueve familias, seis dimensiones y ocho etiquetas temáticas.
- 165 preguntas suaves y 15 moderadas; 180 candidatas adaptativas, incluidas 130 con dimensión primaria distinta de valence.
- 6 fuentes externas, 2 fichas de apoyo y 1 control funcional global de omisión, separado de las alternativas.
- 144 alternativas con tres efectos, en 48 preguntas; quedan identificadas para revisión editorial especial.
- Esquema 1 y contrato de motor 1; semver de revisión 1.0.0-draft.1. SHA-256 canónico `65562b239b3b786edf3d01ea495c03dcc9f0617a5311bbc413e78d725cf7f219`.

Se entregan los seis archivos solicitados y los complementos normativos de CONTENT_SPEC. Los JSON de runtime mantienen sus entidades sin campos improvisados; matriz, señales, estadísticas y reportes son extensiones separadas y versionadas. README describe el contrato TypeScript, la serialización, los nombres de puertas y los puntos de integración por confirmar.

## Distribución editorial

| Estilo | Preguntas |
|---|---:|
| Situación cotidiana | 45 |
| Introspección suave | 45 |
| Metáfora accesible | 45 |
| Observación concreta | 45 |

| Dimensión primaria | Preguntas |
|---|---:|
| `activation` | 30 |
| `connection` | 25 |
| `mentalLoad` | 25 |
| `motivation` | 25 |
| `tension` | 25 |
| `valence` | 50 |

| Familia | Reflexiones |
|---|---:|
| `fam_activation_high` | 4 |
| `fam_activation_low` | 4 |
| `fam_connection_low` | 8 |
| `fam_mental_load` | 8 |
| `fam_motivation_low` | 8 |
| `fam_neutral_generic` | 18 |
| `fam_positive_grounded` | 18 |
| `fam_support_invitation` | 6 |
| `fam_tension` | 8 |

Las cantidades por familia son de textos redactados, **cero aprobados para runtime**. La proporción de estilos se refiere a contenido disponible, no a estados de las personas.

La cobertura se recalculó desde cada alternativa: 116 preguntas tienen potencial de valencia ≥0.75 frente al mínimo 110; 128 tienen potencial de activación ≥0.50 frente al mínimo 90. Todas las primarias están representadas en efectos posibles. Las respuestas indeterminadas no generan señal; la omisión tampoco. Hay 19 alternativas de valencia central explícita, 185 de valencia positiva y 144 negativa; esos conteos no son probabilidades de respuesta.

Las alternativas positivas se reparten por posiciones 49/45/46/45; las negativas, 35/38/35/36. La indeterminación aparece 45 veces en cada posición. No se reordena nada en runtime. El rango de lectura por pregunta completa es 32–62 palabras, mediana 46; es un conteo, no un test de comprensión o tiempo con lector de pantalla.

## Duplicados, similitud y correcciones

Duplicados exactos finales: **0 prompts y 0 cuerpos de reflexión**, comparados con normalización de mayúsculas, acentos y puntuación. No se detectaron IDs duplicados ni referencias rotas. No se afirma originalidad frente a toda publicación externa.

En la autolectura del borrador se detectó exceso del encuadre genérico «sin exigencias» y observaciones sin referente concreto. Se reescribieron las 45 preguntas de introspección y los 45 prompts de observación. Nueve preguntas recibieron además ajustes específicos por ecos entre estímulos (q_0015, q_0022, q_0056, q_0108, q_0127, q_0129, q_0130, q_0135 y q_0150). Las versiones intermedias y razones están en review-log. Esto no se presenta como nueve duplicados exactos: fueron similitudes y defectos de enfoque detectados por el agente.

También se corrigió una primera asignación cíclica de plantillas: ahora se declaran cuatro macroestructuras reales, una por estilo. El selector puede impedir su repetición dentro de una sesión sin recurrir a IDs artificialmente distintos.

Se compararon los 16.110 pares posibles de preguntas y 3.321 pares de reflexiones mediante TF-IDF, normalización española y un léxico de sinónimos explícito. Umbral de triage 0.35, **no clínico ni calibrado como detector semántico**. Persisten **7 parejas de preguntas y 3 de reflexiones** por revisar. Las tres de reflexiones son variantes de la invitación de apoyo con función compartida; las de preguntas incluyen diferencias de contexto que requieren confirmar si aportan diversidad real.

`semantic-review.json` conserva el juicio preliminar por pareja y la revisión independiente pendiente. Se incluyen también los 40 pares de preguntas y 20 de reflexiones con mayor semejanza, aunque no alcancen el umbral. No se certifica «cero duplicados semánticos». Un puntaje bajo no descarta paráfrasis.

Hay 22 grupos de alternativas con texto normalizado compartido, 24 apariciones repetidas adicionales sobre 696 textos únicos. Son expresiones breves como ritmo o energía; se conservaron dentro de preguntas diferentes para no introducir variación artificial. Debe revisarse si su recurrencia se percibe monótona.

## Cobertura de 30 días y simulación anual

Se ejecutó la batería final sobre el hash indicado arriba, con **1.000 instalaciones sintéticas × 365 fechas**, desde 2026-01-01. Se usa aritmética de fechas de fixture y semillas SHA-256 reproducibles. No se recopilaron respuestas de personas.

Primera batería: 365.000 sesiones seleccionadas; 349.750 completadas y 15.250 abandonadas. Ocho perfiles: todas omitidas, indeterminación, agrado consistente, desagrado consistente, solo activación, polarización, mezcla y abandono. Se registraron 1.194.253 exposiciones, incluidas las preguntas omitidas o mostradas antes del abandono; 122.128 cuartas preguntas cumplieron los filtros de candidatura y ganancia, y 13.759 de ellas se omitieron sin efectos.

- **0 repeticiones** del mismo questionId en D−30…D−1 y sesión actual; **0 agotamientos**.
- 364.955/365.000 tríos cumplieron cobertura, contextos y estilos sin relajación: **99.9877%**, superior al objetivo 95%.
- 45 sesiones usaron alguna relajación de objetivos en el orden permitido por el motor; nunca seguridad, elegibilidad ni cooldown. Entre las primeras 30 fechas, 29.989/30.000 tríos no requirieron relajación.
- 426 selecciones relajaron solo el cooldown editorial de reflexiones de su propia familia, permitido por contrato. Ningún cierre cambió de familia para evitar repetición.

Segunda batería independiente: **365.000 sesiones con cuarta exposición forzada**, 1.460.000 exposiciones. Esta prueba estresa capacidad y deliberadamente no representa la decisión adaptativa real.

- **120 preguntas distintas en los primeros 30 días** en cada instalación de estrés; ninguna pregunta repetida.
- Hasta **124 IDs bloqueados simultáneamente** al incluir la fecha actual y las treinta anteriores. El catálogo de 180 sostuvo la disponibilidad.
- 0 agotamientos y 0 infracciones del cooldown; 2.228 tríos con relajación de objetivos permitida, 99.3896% sin relajación.

El total de ambas baterías es 730.000 sesiones sintéticas. La disponibilidad demostrada es del catálogo **bajo la hipótesis explícita de preaprobación para QA**; el pack actual, con entradas draft, no puede iniciar sesiones de producción. No es una prueba exhaustiva de toda historia posible ni sustituye tests de la app.

Traces reproducibles de muestra: simulation-traces.json. Resultados completos agregados: simulation-results.json. Las frecuencias sintéticas de familias no describen una población; son consecuencia de los perfiles elegidos.

## Verificación técnica y barrera de publicación

Pasaron TypeScript strict sobre los siete JSON normativos; lint de sintaxis/formato/copy; validación estricta de tipos, claves, rangos, referencias, cuotas, cobertura y SHA; 12 pruebas, incluidos 100.000 casos sintéticos de acotamiento, permutación y omisión. Las suites cubren S1…S8, límites de valencia, independencia de ejes, omisión de primarias en Q4, día 30/31 y cooldown de apoyo. No se presenta esta suite acotada como todos los tests de implementación exigidos por DECISION_ENGINE.

El control de release devuelve **exit code 1 esperado**, con 547 diagnósticos de aprobación en 273 entradas y manifiesto. No quedan errores estructurales del borrador. El test verifica que no se pueda aprobar el pack por pasar solo máquinas. Ninguna entrada fue marcada approved ni revisada por una persona ficticia.

## Riesgos, límites y revisión necesaria

1. **Semántica y cultura:** metáforas y opciones pueden significar cosas distintas. Resolver los siete pares de preguntas pendientes y revisar todo el corpus con personas adultas es-CL.
2. **Alternativas compuestas:** las 144 opciones de tres señales pueden forzar combinaciones que no encajan. Confirmar por separado cada cláusula, distinguir ejes y mantener la salida de no encaje.
3. **Codificación no calibrada:** ±0.6 y peso 1 son convenciones explícitas. Hay pocas posiciones centrales y ninguna de activación central; el repertorio puede simplificar matices y generar sesgos. No interpretar confidence como probabilidad.
4. **Hipótesis frente a experiencia:** una respuesta ante una escena imaginada no demuestra cómo actúa o se siente una persona en una situación real. No inferir causas, rasgos o evolución.
5. **Seguridad y tono:** se requiere revisión humana independiente, sin transformarla en claim de validación clínica. Los puntajes de calidad son autoestimaciones preliminares del agente.
6. **Accesibilidad:** no hubo TalkBack, pruebas con lectores de pantalla ni participantes. Los referentes imaginados no garantizan acceso equivalente. La espera de 25 segundos se conserva como requisito, sin evidencia de beneficio atribuida.
7. **Recursos y derechos:** fichas confirmadas por el agente, no por una llamada o revisión humana de release. Revalidar contacto, alcance, derechos y enlaces antes de publicar. No hay cobertura telefónica ni atención inmediata garantizadas.
8. **Integración:** confirmar nombres de puertas, proyección de safetyFlags y mínimo de motor descritos en README. Este trabajo no implementa la app, ni prueba cifrado, fechas persistidas, plataforma o privacidad de red.
9. **Originalidad y monotonía:** comparación interna y autolectura no sustituyen búsqueda externa ni entrevistas de uso durante 30 días. Compartir vocabulario entre ejes no demuestra comprensión ni utilidad.

No se modificó ningún documento original. reference-integrity.json y tools/integrity.mjs permiten comprobar sus cinco huellas junto a la integridad del paquete. La siguiente etapa es revisar y registrar aprobaciones humanas sobre este corpus concreto, corregir hallazgos y repetir la batería sobre la nueva versión.
