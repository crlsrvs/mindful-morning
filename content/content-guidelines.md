# Guía editorial · es-CL · 1.0.0-draft.1

Fecha de preparación: 2026-10-25. Fuente contractual: los cinco documentos originales de `../docs/`, versión 1.0.0. Este archivo guía la autoría y revisión del catálogo; no modifica sus fórmulas, umbrales, alcance ni requisitos. El catálogo contiene texto completo, no instrucciones para generar textos durante el uso.

## Propósito y tono

Ofrecer un momento de observación a personas adultas, sin pedir relatos íntimos. Escribir en español natural y comprensible en Chile, evitando modismos locales excluyentes, anglicismos, diminutivos condescendientes y supuestos sobre empleo, familia, vivienda, dinero o compañía. Usar primera persona en las alternativas cuando resulte natural. Ninguna alternativa hace mejor o peor a quien la elige.

No convertir tranquilidad, actividad, cercanía ni ganas en obligaciones. Energía alta puede resultar grata o incómoda; energía baja también. Poca conexión no implica estar físicamente a solas. Poco impulso no equivale a falta de esfuerzo. Las preguntas no deben pedir hechos delicados, diagnósticos, conflictos importantes, recuerdos de pérdidas ni información personal.

## Sistema editorial

Hay cuatro estilos, con 45 preguntas por estilo: metáfora accesible, situación cotidiana, observación concreta e introspección suave. Las ocho etiquetas temáticas de `categories.json` organizan estímulos, no personas. Los seis ejes normativos están en `dimensions.json`; las nueve familias, en `reflection-families.json`. Son archivos equivalentes a una taxonomía de categorías, con funciones distintas y explícitas.

Cada pregunta conserva un ID aunque se corrija su ortografía. Una revisión publicada no se sobrescribe para cambiar semántica: se incrementa revisión y versión, o se usa un nuevo ID si hay incompatibilidad. Los cambios de este borrador aún no publicado están registrados en `review-log.json`. `editorial-matrix.json` permite revisar estilos, contextos, coberturas y estructuras sin extraerlos a mano.

El orden de las alternativas ya está guardado. La rotación se hizo una vez durante la preparación para repartir posiciones; la aplicación no las vuelve a rotar ni parafrasear. Los IDs de respuesta conservan la semántica de su alternativa aunque su posición visible sea otra. `editorialPriority=0.8` es igual para todo el catálogo: no supone que unos estados emocionales sean preferibles.

Las cuatro macroestructuras declaradas son `physical_analogy`, `imagined_everyday_action`, `present_cue_notice` y `conditional_personal_choice`, una por estilo. Se agruparon de forma conservadora; no se distribuyeron IDs distintos arbitrariamente para aparentar diversidad. El veto del motor a repetir plantilla limita cada macroestructura a una aparición por sesión, incluida la cuarta en las pruebas. Las agrupaciones requieren también juicio editorial humano.

## Preguntas y alternativas

Una pregunta debe invitar a una observación manejable, no a explicar toda una mañana. Las metáforas funcionan como entrada al tema, nunca como códigos universales. La respuesta explicita la experiencia: no se deriva agrado de una ventana abierta ni tensión de un cordón por sí solos.

Las escenas son hipotéticas y las observaciones pueden emplear un referente real, imaginado o recordado. No se exige realizar el gesto. Las opciones de falta de encaje aportan `effects: []`. La revisión humana debe verificar que los estímulos sensoriales no excluyan a personas con diversidad visual, auditiva o motora; suponer una alternativa imaginada no sustituye probar accesibilidad.

Cada pregunta tiene cuatro alternativas editoriales. La cuarta alternativa de autoría expresa falta de encaje o indeterminación y puede aparecer en cualquier posición. Es diferente del control **Prefiero no responder**, definido en `ui-copy.json`: inmediato, fuera de `answers[]`, sin answerId y sin efectos. Una alternativa indeterminada elegida después de la espera tampoco equivale a malestar ni neutralidad central.

No hay alternativas humillantes, catastrofistas o redactadas para que una opción positiva parezca correcta. Se incluyen combinaciones de agrado con tensión, poca conexión con agrado, energía baja con impulso y energía alta sin impulso. Con cuatro alternativas no se representan todas las combinaciones posibles; no deben forzarse encajes. Esa limitación requiere entrevistas cognitivas, especialmente en opciones con varias cláusulas.

## Justificación de señales

`signal-rationales.json` conserva, para cada una de las 720 alternativas, su texto, efectos exactos, regla aplicada y necesidad de revisión especial. `interpretationNote` repite la razón local dentro del contrato normativo. Ambos son internos; no se muestran al usuario.

| Regla de autoría | Valor | Razón y límite |
|---|---:|---|
| Agrado, ritmo/energía alta, tensión alta, mucha carga, conexión o impulso expresos | +0.6 | Convención de intensidad moderada, sin usar extremos universales |
| Desagrado, ritmo/energía baja, poca tensión, poca carga, poca conexión o poco impulso expresos | −0.6 | Misma convención simétrica; el signo sigue el eje normativo, no «bueno/malo» |
| «Ni grato ni ingrato» u otra posición central inequívoca | 0 | Evidencia explícita del centro de ese eje |
| No sé, no encaja o no distingo | Sin efecto | Ausencia de evidencia, sin imputación |
| Cláusula explícita con señal asignada | weight=1 | Peso uniforme de codificación; no fiabilidad ni precisión |

Escoger 0.6 y no 0.5 es una decisión editorial operacional, sin estimación empírica que prefiera uno. Se evita fingir gradaciones más finas o extremos ±1 a partir de adjetivos cotidianos. No se eligieron pesos individuales para conseguir un porcentaje de cierres positivos. El diseño de alternativas y este mapeo aún pueden producir sesgos: la simulación no los elimina.

Cada efecto exige una cláusula diferenciable. Una respuesta con tres efectos tiene tres pistas expresas, no tres votos del mismo eje. Las 144 alternativas con tres efectos quedan marcadas para revisión especial; no inferir carga desde velocidad, tensión desde energía, ni conexión desde presencia física. Una respuesta hipotética es una pista elegida ante una escena, no evidencia observada de cómo actuaría la persona.

`primaryDimension` es una etiqueta de selección presente en los efectos posibles; no calcula la estimación. `coveragePotential` se recalcula contando alternativas que aportan ese eje, incluida una respuesta explícita con valor cero y excluida la omisión funcional. `adaptiveEligible=true` significa candidatura técnica posible; nunca obliga a mostrar una cuarta pregunta. Las reglas de beneficio, evidencia, omisiones, seguridad y disponibilidad siguen en el motor.

## Reflexiones y familias

Las positivas reconocen señales de las respuestas, de manera tentativa. Las demás usan el título universal «Una idea para acompañarte», sin nombrar una emoción ni afirmar conocimiento de la persona. Un cierre contiene una o dos frases y como máximo una invitación concreta opcional. Las acciones no requieren dinero, red, abrir otra pantalla ni comprometer una tarea futura. Cuando existe `optionalAction`, el cuerpo no añade otra instrucción de acción.

La invitación de apoyo es copy adicional, no cierre alternativo. Puede mencionar opciones en Necesito apoyo, como exige el contrato; esa excepción corresponde al acceso permanente a recursos. No usa alarmas, no menciona puntuaciones, patrones o cantidades de días y no representa detección de riesgo.

| Familia editorial | Inspiración usada | Límite específico |
|---|---|---|
| positive_grounded | Presente, hacer espacio, amabilidad, valores, distancia de pensamientos | No negar dificultades coexistentes ni exigir conservar agrado |
| neutral_generic | Las cinco líneas generales | Funcionar incluso si todas las respuestas fueron omitidas |
| tension | Presente, hacer espacio, amabilidad, valores, distancia de pensamientos | No prometer relajación ni prescribir técnicas |
| mental_load | Presente, distancia de pensamientos, amabilidad, valores, hacer espacio | No añadir una tarea de organización |
| connection_low | Hacer espacio, amabilidad, presente, valores, distancia de pensamientos | No forzar contacto ni inferir aislamiento |
| motivation_low | Amabilidad, valores, hacer espacio, distancia de pensamientos, presente | No prescribir productividad o entusiasmo |
| activation_high | Hacer espacio, presente, amabilidad, distancia de pensamientos | No equiparar velocidad con ansiedad |
| activation_low | Hacer espacio, presente, amabilidad, valores | No equiparar lentitud con tristeza |
| support_invitation | Decisión original de UX; sin atribución clínica externa | La regla 3/5 no procede de la OMS |

`practiceInspiration` identifica una idea general por texto. No decide elegibilidad ni reemplaza umbrales. La redacción es original y no reproduce una intervención DWM, ejercicios completos, ilustraciones ni instrucciones clínicas. Inspiración **no significa validación clínica**, aprobación de la OMS o revisión profesional.

## Revisión y aprobación

El agente realizó autolectura y controles automáticos. Todas las entradas permanecen en `draft`, con `reviewerRole=pending_human_review`, `reviewedAt=null`, `approvals=[]`, originalidad y accesibilidad humanas sin confirmar. Los puntajes de calidad son estimaciones editoriales preliminares homogéneas del agente; no son resultados de un panel, pruebas con personas ni puntuaciones psicológicas.

La persona revisora debe registrar identidad o rol verificable, fecha, comentarios y decisión por entrada. Evaluar claridad, amabilidad, no invasividad, diversidad, fidelidad de cada efecto y accesibilidad con la rúbrica 1–5 del contrato: aceptar solo todos los ejes ≥4 y seguridad sin bloqueos. No sustituir esa evaluación por los puntajes preliminares ni aprobar todo el pack en bloque para pasar el validador.

Revisar además las parejas de `similarity-report.json`, los efectos triples, las correspondencias hipotéticas y las fichas de apoyo. Probar comprensión con personas adultas es-CL y lectura con TalkBack. Registrar correcciones y repetir formato, tipo, lint, tests, hash y simulaciones tras cambiar contenido. La revisión de comunicación y seguridad tampoco valida psicométricamente el motor.
