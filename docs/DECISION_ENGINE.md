# DECISION_ENGINE — Contrato matemático determinista, v1

**Versión:** 1.0.0 · **Fecha:** 2026-10-24 · **Engine contract:** `1` · **Estado:** especificación heurística NO psicométrica.  
Todas las fórmulas, umbrales y prioridades de este documento son decisiones de producto **sin validación clínica**. Los seis ejes solo organizan señales provenientes de opciones cerradas: no miden rasgos, patologías ni «estado real» de una persona.

## 0. Convenciones e invariantes

- Dimensiones en orden fijo `D=[valence, activation, tension, mentalLoad, connection, motivation]`, rango [-1,1]. `valence`: desagradable (-) a agradable (+). `activation`: reposo/baja (-) a alta (+), **no equivale a estrés**. `tension`: poca tensión (-) a elevada (+). `mentalLoad`: liviandad (-) a carga elevada (+). `connection`: desconexión (-) a conexión (+). `motivation`: impulso bajo (-) a elevado (+).
- `unknown = null`, **distinto de 0**. Cero solo significa «centro del eje» si una opción **afirma** legítimamente tal neutralidad. Las omisiones no se codifican como cero.
- Solo puede haber **un answerId o skip por questionId**, nunca ambos. Cada pregunta puede aportar como máximo un efecto por dimensión. Prohibido duplicar evidencia con una respuesta multietiqueta.
- `confidence` es un índice interno heurístico de **suficiencia y concordancia** [0,0.85]; **no** probabilidad calibrada ni porcentaje de acierto.
- No actualizar reglas en caliente; toda estimación asocia `engineVersion`, `configHash`, `contentPackHash`, fecha, seed, orden de respuestas e IDs/revisiones.
- Para igualdad exacta, ordenar primero por IDs canónicos y después aplicar desempates por hash estable; usar aritmética IEEE-754 double y no redondear para tomar decisiones. Almacenar valores completos; redondeos a 4 decimales solo para reportes sintéticos.

## 1. Configuración única y versionada

El agente de implementación creará **un solo archivo declarativo** `config/engine-config.v1.json`, sometido a esquema/validación, con los siguientes valores. No dispersar valores literales en la UI o selector:

| Campo | Valor v1 | Explicación heurística |
|---|---:|---|
| `reflectionWaitSeconds` | 25 | UI; permitido 20–30, configurable por release, no por respuesta |
| `baseQuestionCount` / `maxQuestionCount` | 3 / 4 | Sesión diaria |
| `questionCooldownCalendarDays` | 30 | Exclusión absoluta de Q expuesta en fechas previas D-30…D-1 |
| `reflectionCooldownCalendarDays` | 7 | Preferencia editorial; relajable si familia sin elegibles |
| `minNonSkippedForAdaptive` | 2 | No prolongar sesiones casi vacías |
| `minEvidenceCountForLabel` | 2 | Dos preguntas independientes sobre `valence` |
| `minEffectiveEvidenceForLabel` | 1.8 | Evitar etiqueta por una respuesta dominante y otra marginal |
| `confidenceSaturationEvidence` | 3.0 | Tres observaciones independientes saturan cobertura |
| `maxConfidence` | 0.85 | Techo explícito anti-falsa precisión |
| `positiveValenceThreshold` | +0.35 | Umbral editorial para cierre positivo |
| `distressValenceThreshold` | -0.35 | Criterio **interno** de malestar consistente |
| `minValenceConfidenceForLabel` | 0.60 | Calidad mínima heurística para positivo/malestar |
| `maxValenceVarianceForLabel` | 0.15 | Consistencia para clasificación |
| `contextMagnitudeThreshold` | 0.35 | Contexto suficiente para familia específica |
| `minContextConfidence` | 0.60 | Evitar interpretar una única señal contextual |
| `adaptiveConflictVariance` | 0.16 | Conflicto potencial en valencia |
| `adaptiveMinExpectedGain` | 0.08 | Beneficio de información, normalizado |
| `adaptiveCandidateMinDistinctOutcomes` | 2 | Debe haber alternativas con efectos diferenciados |
| `patternWindowDays` / `patternRequiredSessions` | 5 / 3 | Regla arbitraria de producto 3/5 |
| `patternCooldownCalendarDays` | 7 | Nueva oferta si fecha actual >= última fecha + 7 días |
| `supportRequiresCurrentDistress` | true | Evita oferta incongruente con día neutral/positivo |
| `baseWeights` | coverage .35 / diversity .25 / novelty .25 / editorial .15 | Selección base; suma 1 |
| `adaptiveWeights` | information .45 / coverage .25 / novelty .20 / diversity .10 | Selección cuarta; suma 1 |

`confidence` y todas las puntuaciones **nunca se muestran al usuario**. Si la configuración inválida contiene pesos fuera de [0,1], sumas incorrectas o umbrales inconsistentes: impedir inicio y emitir error de contenido técnico, no adivinar valores.

## 2. Forma de la señal que aporta una respuesta

Cada opción válida puede declarar efectos con esta semántica:

`Effect = {dimension: D, value: x, weight: w}` con `x∈[-1,1]`, `w∈(0,1]` y `dimension` única dentro de la misma opción. `weight` es fuerza editorial de la pista, **no** fiabilidad validada. Una alternativa puede aportar 0–3 dimensiones, aunque se recomienda 1–2, y el **tercer efecto** necesita revisión editorial especial. `skip` no contiene efectos.

Ejemplo **sintético** de una opción: `[{dimension:"valence",value:0.6,weight:1},{dimension:"activation",value:-0.2,weight:0.5}]`; una alternativa «No sé» puede tener `effects: []` (sin evidencia), distinto de `value:0`.

Pregunta `q` respondida: tomar solo los efectos de la respuesta elegida. Pregunta omitida: registrar `skip` y `skippedPrimaryTag` de la pregunta, jamás sumar efecto, variar puntuación, ni computar como voto cero. Toda observación requiere procedencia `{sessionId,questionId,questionRevision,answerId,packHash}`.

## 3. Agregación por dimensión

Para cada dimensión `d`, sea el multiconjunto de observaciones **de preguntas diferentes** `O_d={(x_i,w_i)}`. Definir `n_d=|O_d|`, `W_d=Σw_i`.

Si `W_d=0`:

- `mu_d = null`, `variance_d=null`, `nEff_d=0`, `confidence_d=0`, `n_d=0`.

Si `W_d>0`:

\[
\mu_d=\frac{\sum_iw_ix_i}{W_d};\qquad
n_{eff,d}=\frac{W_d^2}{\sum_iw_i^2};\qquad
V_d=\frac{\sum_i w_i(x_i-\mu_d)^2}{W_d}.
\]

Con `x∈[-1,1]`, `V_d∈[0,1]` para varianza ponderada de estos valores (tolerancia numérica `ε=10^{-12}`; clamp únicamente errores flotantes menores a ε). Definir `agreement_d=1−V_d`, `coverage_d=min(1,nEff_d/3)` y:

\[
C_d = \min(0.85,coverage_d)\,(1-V_d).
\]

Propiedades buscadas: (a) un único voto de peso 1 da `C=1/3`; (b) dos votos coincidentes iguales dan `C=2/3`; (c) tres coincidentes dan `C=0.85`; (d) divergencia disminuye `C`; (e) `C` no puede interpretarse como porcentaje de confianza clínica. Para el caso `W>0, V=0`, una observación neutral explícita (`x=0`) sí cuenta como evidencia, pero no indica valencia positiva/negativa.

Si `nEff` es fraccional, se **conserva** como tal. Contar preguntas no omitidas por separado para umbral de etiqueta. Aplicar las fórmulas también a las dimensiones contextuales: **no usar activación para derivar tensión o viceversa**.

### Evitar precisión ilusoria

- No convertir `mu` en nombre de emoción específica; jamás mostrar número al usuario.
- No interpolar dimensiones sin evidencia ni crear respuestas por promedio de otros ejes.
- Los seis valores son una representación descriptiva de codificación editorial, no una medida en escala intervalar validada. El uso de media/varianza es solo **regla operacional reproducible**.
- No acumular `mu` de otras mañanas para personalizar el usuario en MVP.
- No añadir «boost» positivo por streak, cantidad de respuestas o engagement.

## 4. Clasificaciones internas y familias de cierre

**Dos únicos modos de cierre visibles:** `positive`, `nonlabel`.

- `positive` **si y solo si** `mu_valence >= +0.35`, `C_valence>=0.60`, `V_valence<=0.15`, `n_valence>=2` y `nEff_valence>=1.8`.
- `distressConsistent` **solo interno**, **si y solo si** `mu_valence <= -0.35` y los otros cuatro filtros de suficiencia anteriores se cumplen; no convertir a título visible.
- En todos los demás casos `nonlabel`; no existe modo público `negative`, `neutral_score`, `anxious` o diagnóstico.
- Una alta `activation` sola nunca fija positivo o malestar. Es posible valencia positiva y tensión alta; la valencia se evalúa solo contra sus propias pruebas. La familia positiva no debe negar otras dificultades, y el contenido no afirmará «todo está bien».

**Selección de familia (`nonlabel`):** examinar `tension` alto, `mentalLoad` alto, `connection` bajo, `motivation` bajo, `activation` alto/bajo. Solo usar un contexto cuando `|mu_d|>=0.35`, `C_d>=0.60` y `n_d>=2`; exigir dirección coherente con familia. Si ninguno cumple, elegir `neutral_generic`. Si hay varios, elegir la familia con **menos exposiciones entre las últimas siete sesiones completadas**, después desempatar por prioridad fija (`tension` → `mentalLoad` → `connection` → `motivation` → `activation_high` → `activation_low`), después por seed+ID. Nunca seleccionar una familia sin umbral. Si `positive`, usar exclusivamente `positive_grounded`.

**Selección de reflexión dentro de la familia:** descartar copy que no pertenezca al locale/revisión, que no tenga `qualityStatus=approved` o incumpla reglas de lenguaje. De elegibles, elegir menor número de exposiciones en últimos 30 días, luego mayor número de días desde último uso, y desempatar con hash estable de seed+reflectionId. Evitar la misma reflexión en los siete días anteriores. Si todas las reflexiones de la familia están en cooldown, relajar **solo** cooldown de reflexiones, nunca reglas de seguridad ni familia. Guardar texto exacto, ID, versión y rationale. `kind=support` es copy adicional, no sustituye la reflexión de cierre.

## 5. Selección de las tres preguntas base

### Filtros absolutos previos

- Misma `locale`, esquema y versión compatibles, `approved`, `safetyFlags` vacíos, habilitada para `morning_intent` y respuestas válidas.
- `questionId` no expuesta durante las **30 fechas calendario anteriores** (D−30…D−1), ni en la sesión actual. Una versión textual cambiada del mismo ID **sigue** bloqueada. También quedan bloqueadas preguntas editoriales con `semanticClusterId` idéntico a otra de la sesión actual.
- No seleccionar preguntas `followUpOnly` para las tres primeras; no elegir más de una perteneciente a la misma `narrativeTemplateId` en una sesión.
- Inicialmente elegir Q1 etiquetada `intensity=gentle`, accesible y de lectura breve. No introducir preguntas clínicas o emocionalmente difíciles.

### Cobertura planificada

Antes de tener respuestas, usar `coveragePotential(q,d)` = proporción de respuestas válidas **no skip** de `q` que aportan efecto de dimensión `d` (peso positivo). El contenido declara ese valor calculable; el validador lo recalcula y no confía en metadatos manuales. Objetivo entre las tres preguntas: mínimo **dos preguntas distintas** con `coveragePotential(valence) >= 0.75` y dos con `coveragePotential(activation)>=0.5` cuando exista catálogo elegible; al menos dos estilos y al menos dos contextos potenciales diferentes. Estos son **objetivos editoriales**, no garantías de que la respuesta elegida produzca evidencia.

Selección **greedy determinista con prueba de completabilidad** en orden Q1, Q2, Q3. Para cada candidata, comprobar primero que existe un conjunto de ítems restantes con el que se pueden satisfacer las restricciones de cobertura/estilo del trío completo; si la candidata haría imposible completarlas, descartarla. Para completar el trío basta comprobar combinaciones de hasta dos ítems restantes (sin ordenar), con orden de IDs estable. Elegir candidata de mayor puntuación en cada paso; si ninguna permite completar, relajar restricciones en el orden especificado abajo y **reiniciar** el greedy desde Q1. Normalizar cada componente en [0,1]:

- `coverage`: `(.50 * v + .25 * a + .25 * k)`, donde `v=1` si candidata cubre `valence` con potencial≥.75 y hay menos de dos preguntas previas que lo hacen; si no `0`. `a` equivalente para `activation` potencial≥.50 y objetivo dos. `k=1` si candidata cubre (potencial≥.50) al menos una dimensión de contexto **no cubierta** por preguntas ya elegidas; si no `0`. Cada pregunta se cuenta a lo sumo una vez por cada eje. El objetivo de **dos contextos distintos** se computa por conjunto, no por cantidad de efectos de una misma pregunta.
- `diversity`: `(s+t+c)/3`, con `s=1` si el `style` no está en lo elegido, `t=1` si existe un `scenarioTag` nuevo, `c=1` si el `semanticClusterId` es nuevo; los tres valen 1 para Q1. Repetir cluster en una sesión ya está prohibido por filtro absoluto.
- `novelty`: `1` si nunca se mostró; en otro caso `min(1, daysSinceLastShown/120)`; usar fecha calendario y preferencias de clusters para evitar ecos semánticos cercanos, sin bloquear indebidamente.
- `editorial`: prioridad aprobada en [0,1], nunca refleja respuesta emocional.

`scoreBase=.35*coverage+.25*diversity+.25*novelty+.15*editorial`.

**Restricciones duras primero, puntuación después.** Si existe suficiente disponibilidad, cumplir los objetivos de cobertura y estilos como restricciones de conjunto. Si no, relajar en este orden: objetivo de activación → diversidad contextual → diversidad de estilo → cobertura de valencia como objetivo, pero **no** elegibilidad, seguridad ni cooldown de 30 días. Si hay menos de tres elegibles en total, impedir iniciar y registrar solo error técnico local; no improvisar preguntas ni reutilizar preguntas recientes.

La selección no depende de estado inferido anterior ni de género/edad; `seed=hashStable(installRandomId|localDate|engineVersion|contentPackHash)`, persistida en sesión. Usar un hash definido y probado idénticamente en plataformas (por ejemplo SHA-256 convertido a orden lexicográfico hexadecimal). No usar `Math.random()` para desempatar.

## 6. Detección y selección de la cuarta pregunta

Se evalúa **exactamente una vez después de Q3** (respuesta u omisión). Nunca por tiempo de pantalla o retención del usuario.

### Requisitos obligatorios

1. Hay al menos **dos respuestas no omitidas** en las tres primeras preguntas.
2. Se verifica incertidumbre relevante en `valence`: `mu_valence=null`, o `C_valence<0.60`, o `|mu_valence|<0.35`, o `V_valence>0.15`.
3. Existe una **razón concreta y abordable**:
   - `CONFLICT`: `n_valence>=2` y `V_valence>=0.16`; **o**
   - `OUTCOME_SENSITIVE`: entre las posibles respuestas no skip de al menos una candidata, algunas llevan a distintos modos de cierre (`positive` versus `nonlabel`) **o** a distintas familias contextuales admisibles con suficiente evidencia. La existencia de una única señal desconocida sin sensibilidad de salida no basta.
4. La candidata no se ha mostrado en los últimos 30 días, es `approved` y `adaptiveEligible=true`, y su `primaryDimension` **no coincide con ningún `primaryDimension` de una pregunta omitida en esta sesión**. Esta última regla protege la autonomía incluso si la pregunta omitida no tenía respuesta.
5. La candidata tiene al menos dos alternativas no skip con **vectores de efecto distintos**; no se fuerza respuesta a un mismo constructo bajo textos diferentes.
6. Su beneficio medio de información es ≥0.08 conforme al cálculo siguiente; no hay más de una candidata seleccionada.

### Ganancia de información operacional, sin probabilidades clínicas

Para candidata `q` con `m` respuestas no skip, recalcular estimaciones hipotéticas `E_j` para cada alternativa `j`, sin alterar historial. Para cada una evaluar:

- `deltaValenceC_j = max(0, C_valence(E_j)−C_valence(E_0))`.
- `deltaValenceV_j = max(0, V_valence(E_0)−V_valence(E_j))` si las dos varianzas son conocidas; si no, `0`.
- `deltaContextCoverage_j = max(0, mean_d∈context(C_d(E_j))−mean_d∈context(C_d(E_0)))` con cuatro contextos (`tension`, `mentalLoad`, `connection`, `motivation`), ignorando `activation`.

Definir:

\[
G(q)=\frac{1}{m}\sum_{j=1}^m\min\big(1,\Delta C_{v,j}+0.5\Delta V_{v,j}+0.25\Delta C_{context,j}\big).
\]

Si `mu_valence=null`, `C_v(E_0)=0`; `V` desconocida hace `deltaV=0`. Se emplea promedio **uniforme de respuestas posibles solo como heurística de diseño**, no como probabilidad de respuesta. `skip` no está en la suma, pero permanece disponible al usuario y no afectará estimación. Candidata con `G<0.08`: descartar. Para la condición `OUTCOME_SENSITIVE`, contar modos/familias distintos en `E_j`; esta simulación **no garantiza** que la persona obtenga etiqueta alguna.

Ordenar candidatas por `scoreAdaptive=.45*min(1,G)+.25*unmetCoverage+.20*novelty+.10*diversity`; `unmetCoverage` es la proporción de dimensiones con `C<0.60` que la pregunta puede potencialmente cubrir (máximo una unidad por dimensión, peso valencia doble respecto a cada contexto; media normalizada). Diversidad y novedad se definen igual que en sección 5. Desempate por seed+ID estable. **No** utilizar historial emocional fuera de la sesión para seleccionar Q4.

Si ninguna candidata satisface **todos** los filtros, terminar en tres preguntas, aunque la información sea insuficiente. La cuarta puede aumentar datos o hacerlos más ambiguos: en ambos casos la salida se recalcula con la respuesta real, sin prometer resolución.

## 7. Patrón de cinco días calendario: invitación prudente

La evaluación se ejecuta tras completar la sesión actual y **nunca** sobre borradores/expiradas:

1. Sea `D` la `local_date` anclada de la sesión actual. Examinar fechas `[D-4,D]` inclusivas, **cinco fechas**; no usar «últimas cinco sesiones».
2. Contar solo sesiones `completed` con `distressConsistent=true` calculado bajo la configuración y catálogo persistidos en su día. El resultado histórico no se vuelve a inferir en el MVP.
3. Si hay ≥3 y la sesión actual es `distressConsistent=true`, considerar invitación. **Ausencias y sesiones sin evidencia no son negativas** y no se imputan.
4. Exigir que no exista última fecha de invitación, o que `D >= lastSupportShownLocalDate + 7 días calendario`; una nueva fecha de viaje no reetiqueta eventos anteriores.
5. Mostrar solo **una invitación no urgente en el propio cierre**, jamás una push, alerta, etiqueta, banner rojo o «detectamos que estás mal». Marcar evento de exposición en la misma transacción de cierre para evitar repeticiones por crashes.

No se afirma que «3 de 5» posea sensibilidad/especificidad; es una hipótesis arbitraria de producto. Recursos de `Necesito apoyo` siempre están disponibles, independientemente de reglas o permisos.

## 8. Casos límite obligatorios

| Caso | Resultado del motor |
|---|---|
| Todas omitidas | Se completan Q1–3, `mu=null`, `C=0` todas; no Q4, `nonlabel`/`neutral_generic`, sin patrón. |
| Dos omitidas | A lo sumo un answer, no Q4; no etiquetas/patrón positivo. |
| `value:0` explícito en dos preguntas | `mu=0`, `C` posible ≥0.60, pero no positivo ni malestar; `nonlabel`. |
| Solo `activation=+1` en tres preguntas | `activation` alta, `valence=null`; no tratarla como estrés, negativo ni positivo. |
| Señales polarizadas `+1` y `−1` de valencia | Media 0, varianza 1, confianza 0; no etiquetas; cuarta solo si hay candidata útil. |
| Q4 omitida | El motor mantiene estimación de Q1–3 sin penalización; cierre coherente. |
| Q4 añade evidencia contradictoria | Recalcular media/varianza; posible cambio de `positive` a `nonlabel`, jamás conservar etiqueta antigua. |
| Contexto `mentalLoad` alto con `valence` positiva clara | `positive` con copy no invalidante; no decir que todo está bien. |
| Un efecto fuera de rango / duplicated dimension | Rechazar pack durante validación; no truncar silenciosamente. |
| Content pack cambia entre inicio y cierre | Usar snapshot/versiones ancladas; si falta material necesario, no inferir con datos nuevos. |
| Empates perfectos entre preguntas/reflexiones | Resolver por hash determinista + ID estable; igualdad de entradas siempre misma salida. |
| Se ignora una dimensión con `Prefiero no responder` | No penalizar, ni seleccionar Q4 con primaryDimension igual a la omitida. |

## 9. Simulaciones numéricas sintéticas (pesos 1 salvo indicación)

**S1 — Dos señales agradables.** Efectos observados sobre valence `+0.6,+0.4` (Q3 aporta otro eje). `W=2`, `mu=+0.50`, `nEff=2`, `V=((.1)^2+(-.1)^2)/2=0.01`, `C=(2/3)*0.99=0.6600`. `positive=true`, `distress=false`, ninguna Q4 por necesidad de valencia. Cierre: positivo tentativo.

**S2 — Dos señales desagradables coherentes.** `−0.6,−0.5`: `mu=−0.55`, `V=0.0025`, `C=0.6650`, `distressConsistent=true`. Cierre: `nonlabel`; cero etiquetas negativas. Si S2 ocurre en fechas D−4, D−2 y D (no hay otras negativas), aparece oferta de apoyo en D si cooldown permite; si D−4 y D−2 fueran los únicos días y D neutral, **no** aparece.

**S3 — Contradicción aclarable.** Tres respuestas completadas; valence observada `+0.8,−0.6` y tercera respuesta solo contextual. `mu=+0.1`, `V=0.49`, `C=(2/3)*0.51=0.34`. Candidata permitida con opciones de valence `−0.8,0,+0.8` tendría beneficios positivos: `C_after ≈0.4933,0.6711,0.5644`; `G` supera 0.08. `CONFLICT=true`: aparece Q4 si no hay omisión del mismo `primaryDimension` y pasa filtros. Si elige `0`, `mu≈0.0667`, `V≈0.3289`, `C≈0.6711`; cierre **no etiquetado** pese a C>0.60 por varianza/umbral de valencia.

**S4 — Omisión.** Q1 omitida (primaryDimension `valence`); Q2 observa valence `+0.8` y Q3 observa otro eje. `n_v=1,C_v≈0.3333`; ninguna candidata con `primaryDimension=valence` es elegible para Q4, aunque el usuario haya «dejado sin responder» esa dimensión. Cierre `nonlabel`.

**S5 — Activación no es malestar.** `activation` observada `+0.9,+0.7`, `valence=null`: `mu_activation=+0.8,V=.01,C≈.66`, `mu_valence=null,C_v=0`. No hay diagnóstico, malestar, ni cierre positivo por activación alta. Es elegible una familia contextual de activación si las otras condiciones se cumplen, sin asociar alta activación a ansiedad.

**S6 — Evidencia desigual.** valence `+0.9 (w=1)`, `+0.8 (w=0.1)`; `nEff=(1.1²)/(1+.01)=1.198...`, `C<=0.40`, falla `nEff>=1.8` y `C>=.60` aunque la media sea agradable. No positivo.

**S7 — Neutralidad explícita.** valence `0,0` con `w=1`: `mu=0`, `V=0`, `C=2/3`; no positivo, no malestar, no Q4 salvo `OUTCOME_SENSITIVE` con ganancia válida.

**S8 — Fechas de ventana.** D=2026-10-24; revisar 20,21,22,23,24. Días 20/22/24 con `distressConsistent=true` → conteo 3; también cumple la condición de malestar interno de la sesión actual y no hubo oferta en últimos 7 días → texto de apoyo elegible. Fechas 19/20/22 son solo dos en ventana → no. Repetir la invitación el 29 si última fue 24 → prohibido; el 31 → permitido (siete días calendario de diferencia) si vuelve a darse 3/5.

## 10. Pruebas matemáticas, de propiedades y de regresión

### Invariantes algebraicas comprobables

1. **Acotamiento:** para datos válidos, `-1<=mu<=1`, `0<=V<=1`, `0<=C<=.85`, `1<=nEff<=n` cuando n>0 (con tolerancia flotante).
2. **Permutación:** reordenar preguntas respondidas sin alterar su identidad/efectos no modifica estimación (sumar en orden canónico de questionId para evitar diferencias flotantes).
3. **Idempotencia:** estimar dos veces mismos insumos/seed/versiones produce bytes idénticos en el JSON canónico.
4. **Omisión:** agregar una pregunta omitida no altera `mu`, `V` ni `C` de ninguna dimensión. **Puede** afectar solo elegibilidad de una futura Q4 vía `skippedPrimaryTags`.
5. **Sin evidencia ≠ neutralidad:** `[]` → `mu=null,C=0`; `[{x:0,w:1}]` → `mu=0,C=1/3`.
6. **Independencia de ejes:** cambiar solo `activation` no cambia `valence`, `tension`, `mentalLoad`, `connection` ni `motivation` (salvo selección editorial posterior).
7. **Repetición en 30 días:** para toda pareja de exposiciones a la misma pregunta en sesiones diferentes, distancia entre fechas locales >30 días si la más nueva es posterior. Q4 incluida.
8. **Determinismo de desempate:** comparar seed y pack hash idénticos bajo Android/iOS/Node devuelve mismos IDs y orden.
9. **Sin clínica:** todo cierre emitido por motor tiene `closureMode∈{positive,nonlabel}`, nunca códigos de patologías.
10. **Monotonía restringida:** al duplicar **no** una pregunta (prohibido), sino agregar una nueva observación **idéntica** con igual peso y sin contradicción, `nEff` crece y `C` no decrece hasta el cap; para evidencia contradictoria, `C` sí puede bajar (no exigir falsa monotonía general).

### Suite de ejemplos base / boundary tests

- Usar fixtures **factibles** que alcancen por separado las fronteras `mu=+.35`, `C=.60`, `V=.15` y `nEff=1.8`: las cuatro igualdades no pueden asumirse simultáneamente porque `C=min(.85,nEff/3)*(1−V)`. Por ejemplo, con `nEff=1.8` y `V=0`, `C=.60` exacto; exigir comparaciones inclusivas. Perturbar cada frontera por ε en el sentido desfavorable y verificar la transición cuando las otras condiciones siguen siendo válidas.
- `mu=-.35` con todos los filtros → malestar interno true; `mu=-.349999` → false.
- Q4: `nAnswered=1` → false aunque `G` alto; `V=.16`/`G=.08` → elegible inclusivo; `G=.079999` → no; contenido sin alternativas distintas → no.
- Cooldown: mostrado en D, imposible en D+1…D+30; D+31 se puede; si hay exposición a D+31, volver a bloquear por 30 días.
- Soporte: 3/5 pero fecha actual no distress → false; 3/5 y última invitación hace 6 días → false; hace 7 → true; 2/5, incluso todos los días anteriores vacíos → false.
- Estrés contextual: `tension` 0.7 con C 0.66 y valencia desconocida → familia `tension`; si C .33 → `neutral_generic`.
- Monte Carlo/properties: generar 100.000 sesiones sintéticas válidas con seeds fijas y verificar rangos, ausencia de crashes, estabilidad y restricciones; no considerar estos datos validación empírica.
- Simular 365 fechas con máximo 4/día, 160–200 preguntas y todos los skips/estilos admisibles; sin repetición de pregunta en 30 fechas y sin violaciones de 3+1.
- Snapshot de S1…S8 con precisión mínima 1e-9 y hash de config/pack; una modificación de pesos exige actualizar versión y documentación de diferencias.

## 11. Auditoría y gobernanza

Cada decisión conserva `rationaleCodes` internos predefinidos (`NO_VALENCE_EVIDENCE`, `INSUFFICIENT_COVERAGE`, `CONFLICT`, `OUTCOME_SENSITIVE`, `POSITIVE_GROUNDED`, `DISTRESS_INTERNAL`, `CONTEXT_TENSION`, `GENERIC_NEUTRAL`, `SUPPORT_3_OF_5`, `SUPPORT_COOLDOWN`, etc.). La traza no contiene comentarios privados ni texto libre y se guarda cifrada junto a la sesión. Un revisor técnico puede reproducir una sesión con un fixture sintético de las opciones seleccionadas y sus revisiones.

**Caveat científico:** adoptar ejes bidimensionales se inspira en literatura del afecto, pero asignar señales desde metáforas, combinar seis dimensiones, el cálculo de `C`, los umbrales y la regla 3/5 **son propios del producto**, no validados, y requieren pruebas de comprensión, sesgos, sensibilidad y daño potencial antes de posicionar la aplicación. Véase `EVIDENCE_AND_LIMITATIONS.md`.
