# CONTENT_SPEC — Contrato editorial y datos versionados

**Versión:** 1.0.0 · **Fecha:** 2026-10-24 · **Contrato de contenido:** `1` · **Locale inicial:** `es-CL`.  
**Destino:** agente de contenido y validador del agente de software. No incluye todavía las 180 preguntas reales: estas son un **entregable posterior** del agente editorial, no deben confundirse con el ejemplo sintético.

## 1. Resultado esperado del agente de contenido

Entregar **un paquete original** que permita al software funcionar 30 días, offline y con selección no repetitiva:

- **180 preguntas como objetivo, mínimo contractual 160 y máximo 200**, originales, auditadas y no clínicas.
- Cada pregunta incluye **3–5 respuestas cerradas significativas**, además de la opción funcional global `Prefiero no responder` que presenta la UI sin esperar y no genera efectos.
- Al menos **82 reflexiones** aprobadas repartidas entre cierres y sugerencias de apoyo, según cuotas de sección 4.
- Archivo `manifest.json`, `dimensions.json`, `questions.json`, `reflection-families.json`, `reflections.json`, `content-sources.json`, `support-resources.json`, `quality-report.json` y `CHANGELOG.md` en `assets/content/es-CL`.
- Informe de cumplimiento de reglas, revisión editorial y QA de 30/365 días con seeds reproducibles. No sustituir el catálogo por plantillas generativas en runtime.

**Independencia:** el agente editorial modifica textos, etiquetas, pesos y metadatos **dentro del contrato**; no cambia límites, fórmulas ni umbrales del motor. Si considera que una regla produce malas preguntas, presenta una propuesta de cambio **separada**, no una nueva interpretación silenciosa.

## 2. Nombres, tipos y reglas globales

- IDs en minúscula, ASCII, estables: `q_0001`, `a_0001_01`, `fam_positive_grounded`, `ref_0001`, `src_who_dwm_2020`. ID no cambia con ajuste ortográfico; `revision` entero comienza en 1.
- Fecha ISO 8601 (`2026-10-24`), semver para paquete, SHA-256 de contenido canónico para integridad, `engineContractVersion=1` y `schemaVersion=1`.
- Texto en Unicode NFC, UTF-8. `locale=es-CL`; espacio listo para futuros `es`, `en`, pero **no** traducciones improvisadas por usuario ni runtime.
- Un efecto siempre se representa como `{dimension, value, weight}`. `value` número finito [-1,1], `weight` número finito (0,1]; dimensiones válidas únicamente `valence`, `activation`, `tension`, `mentalLoad`, `connection`, `motivation`.
- Ausencia de efecto: `effects: []` (desconocido). Efecto `value=0`: evidencia editorial de posición central, **no** ausencia de señal.
- `Prefiero no responder` **NO** es una opción en `answers[]`, no tiene ID de respuesta, peso, efecto ni penalización; es un control funcional siempre visible.
- La sección `quality` sirve para auditoría, pero `quality.status='approved'` es condición absoluta para entrar al catálogo runtime. Revisión por una persona distinta de quien escribió el ítem cuando sea posible.

## 3. Esquema de entidades

### 3.1 `manifest.json`

| Campo | Tipo | Obligatorio | Restricción |
|---|---|---|---|
| `packId` | string | Sí | `morning-reflection-es-CL` para MVP |
| `version` | semver | Sí | Evoluciona con textos o señales |
| `schemaVersion` | integer | Sí | `1` |
| `engineContractVersion` | integer | Sí | `1` |
| `locale` | BCP47 | Sí | `es-CL` |
| `publishedAt` | ISO date | Sí | Fecha de revisión de release |
| `hash` | SHA-256 | Sí | De archivos canónicos, sin incluir campo hash propio |
| `questionCount` / `reflectionCount` | integer | Sí | Calculados, nunca editados a mano |
| `minCompatibleEngine` | semver | Sí | Revisado por implementador |
| `review` | object | Sí | Roles editoriales, estatus, fecha, revisión de seguridad |

La app puede manejar un único pack activo, pero **debe** guardar el manifiesto/revisión que acompañó a cada sesión.

### 3.2 `dimensions.json`

Seis registros exactos en orden canónico. Cada dimensión contiene `{id, negativePoleDescription, positivePoleDescription, semanticCautions, contractVersion}`. Descripciones normativas:

| ID | -1 | +1 | Advertencia editorial |
|---|---|---|---|
| `valence` | Vivencia desagradable | Vivencia agradable | No equiparar con «depresión» ni «felicidad» |
| `activation` | Activación baja | Activación alta | Activación alta puede ser entusiasmo, no «ansiedad» |
| `tension` | Poca tensión | Tensión elevada | No construir «síntomas» |
| `mentalLoad` | Carga mental leve | Carga elevada | No diagnosticar burnout |
| `connection` | Sensación baja de conexión | Conexión elevada | No inferir aislamiento social objetivo |
| `motivation` | Impulso reducido | Impulso elevado | No inferir apatía clínica |

Todo efecto debe justificar semánticamente por qué una respuesta implica *una pista* de ese eje y fuerza, no una conclusión universal.

### 3.3 `questions.json`

Objeto por pregunta (campos obligatorios salvo `helperText`):

| Campo | Tipo y validación | Uso |
|---|---|---|
| `id`,`revision`,`locale` | string, int≥1, BCP47 | Trazabilidad y compatibilidad |
| `prompt` | string 45–180 caracteres orientativos | Pregunta abierta en formulación, **respuesta cerrada** |
| `helperText` | string 0–90 caracteres | Contexto opcional, no presión |
| `style` | enum `metaphor|daily_situation|observation|gentle_introspection` | Diversidad |
| `primaryDimension` | ID de seis dimensiones | Evitar insistir cuando se omite |
| `scenarioTags` | array 1–3 etiquetas aprobadas | Alternancia temática |
| `semanticClusterId` | string | Evitar casi duplicados entre preguntas |
| `narrativeTemplateId` | string | Impedir tres estructuras predecibles |
| `intensity` | `gentle|moderate` | Q1 debe ser `gentle`; no `intense` en MVP |
| `adaptiveEligible` | boolean | Posible Q4 |
| `followUpOnly` | boolean | Exclusión de Q1–Q3 si true |
| `sessionContexts` | array | Debe contener `morning_intent` para MVP |
| `editorialPriority` | 0…1 | Orden de selección; no modificar por resultados |
| `answers` | 3–5 `Answer` | Opciones cerradas únicas |
| `coveragePotential` | mapa derivado de `answers` | Validado; no confiar solo en valor editorial |
| `sourceIds` | array de IDs existentes | Inspiración o justificación, no validación de la señal |
| `quality` | objeto `QualityMetadata` | Revisión, riesgos, originalidad |

**Answer** = `{id, text, effects, interpretationNote}`:

- `text`: recomendado 8–90 caracteres, mismo nivel de concreción en una pregunta; sin solapamiento fuerte ni «respuesta correcta».
- `effects`: 0–3 efectos; preferir 1–2, con revisión especial si hay 3; una dimensión no se repite dentro de una respuesta.
- `interpretationNote`: una frase interna que explique señal/no señal con modestia; **nunca** se muestra al usuario.
- Deben existir al menos dos respuestas semánticamente distintas; para candidatas adaptativas, al menos dos **vectores de efecto** distintos.
- No colocar una alternativa clínica o una negativa extrema para «forzar» cobertura. No usar escalas encubiertas como test de salud mental.

### 3.4 `reflection-families.json`

**ReflectionFamily** = `{id, kind, eligibleBy, priorityBand, recommendedFocus, prohibitedClaims, sourceIds, quality}`.

- `eligibleBy` es una **referencia enumerada** a la lógica fija de `DECISION_ENGINE.md`, no una fórmula nueva escrita por contenido.
- `kind=closing|support`; la familia `support` jamás compite con familias `closing`.
- IDs de familias de cierre exigidos: `fam_positive_grounded`, `fam_neutral_generic`, `fam_tension`, `fam_mental_load`, `fam_connection_low`, `fam_motivation_low`, `fam_activation_high`, `fam_activation_low`; familia adicional `fam_support_invitation`.
- `prohibitedClaims` captura vetos editoriales y pruebas de QA («OMS recomienda esta app», «te diagnosticamos», «estás ansioso», «sabemos cómo te sientes»).

### 3.5 `reflections.json`

**Reflection** = `{id, revision, locale, familyId, kind, title, body, optionalAction, practiceInspiration, sourceIds, sourceRelationship, quality}`.

- `title`: para positivo o cierres genéricos; recomendado 12–65 caracteres. Para `nonlabel`, UI puede usar título universal del producto sin copia redundante.
- `body`: 1–2 frases, recomendado 100–260 caracteres; lenguaje condicional, amable, concreto; **no** instrucciones de respiración como tratamiento o técnicas médicas personalizadas.
- `optionalAction`: texto opcional 0–120 caracteres; no requiere pantalla adicional, dinero, red ni nueva sesión. Puede omitirse sin penalización.
- `practiceInspiration`: `null` o enum `grounding|unhooking|acting_on_values|making_room|being_kind_engaging`. No debe seleccionar por sí mismo la familia emocional.
- `sourceRelationship`: enum `inspiration|directly_described_practice|original_product_heuristic`; **nunca** `algorithm_validated_by_WHO`.
- `quality`: same scheme; la respuesta no se genera ni traduce en tiempo de ejecución.
- `kind=support`: no describir al usuario como «persona en riesgo»; dejar invitación neutral, no urgencia automatizada.

### 3.6 `content-sources.json`

**ContentSource** = `{id, title, authorsOrInstitution, publicationYear, publicationDate, url, doi, sourceType, evidenceRole, consultedAt, license, reuseNotes, limitations}`. `url` verificable; si no hay DOI, usar `null`. `evidenceRole` enum: `direct_support_for_general_practice|conceptual_inspiration|technical_reference|internal_heuristic`. Para textos originales sin fuente externa, `sourceIds:[]` y `sourceRelationship: original_product_heuristic`; **no inventar** bibliografía para legitimar una metáfora. `reuseNotes` debe documentar originalidad y respeto a licencias.

### 3.7 `support-resources.json`

Recursos estáticos revisados para la pantalla permanente: objetos `{id, countryCode, title, serviceScope, phone, actionType, sourceId, lastVerifiedAt, availabilityText, cautionText, quality}`. Solo fichas aprobadas y confirmadas por organismo oficial; edición inicial `countryCode=CL`, con `*4141` y `600 360 7777` como registros independientes. La UI los presenta bajo el encabezado condicional «Si estás en Chile»; no inferir país a partir de locale, IP o GPS. `actionType=dialer`, no llamar automáticamente. El agente de contenido revalida antes de cada release. Si no hay recurso local verificado, mantener texto general universal sin inventar teléfonos.

### 3.8 `QualityMetadata`

Objeto `{status, authorRole, reviewerRole, reviewedAt, originalityChecked, clarityScore, culturalFitScore, invasivenessScore, moralizingRisk, clinicalLanguageRisk, ambiguityNotes, accessibilityChecked, approvals}`. Puntajes editoriales definidos [0,1] y usados para revisión, **no como evidencia psicológica**. Estado `draft|needs_revision|approved|rejected`. Para `approved`: dos roles identificados, originalidad y accesibilidad confirmadas, riesgo clínico/moralizante bajo según rubric, fecha de revisión y sin bloqueos.

## 4. Tamaño, cuotas y disponibilidad del dataset

### Preguntas (objetivo 180)

| Estilo | Cuota objetivo |
|---|---:|
| Metáforas nuevas y claras | 45 |
| Situaciones cotidianas | 45 |
| Observaciones concretas | 45 |
| Introspección suave | 45 |
| **Total** | **180** |

Distribuir `primaryDimension` de forma orientativa (no clínica): `valence=50`, `activation=30`, `tension=25`, `mentalLoad=25`, `connection=25`, `motivation=25` (suma 180). Para que tres preguntas puedan reunir información sin obsesionarse con una emoción, requerir **≥110 preguntas** con `coveragePotential(valence) ≥0.75` y **≥90** con `coveragePotential(activation) ≥0.50`, admitiendo dimensiones secundarias. Debe haber **≥50** preguntas `adaptiveEligible=true`, de las cuales ≥20 tengan `primaryDimension` diferente de valence. No se impone que todas las respuestas aporten señal; la neutralidad o información faltante es legítima.

### Reflexiones (mínimo 82 aprobadas)

| Familia | Mínimo |
|---|---:|
| `fam_positive_grounded` | 18 |
| `fam_neutral_generic` | 18 |
| `fam_tension` | 8 |
| `fam_mental_load` | 8 |
| `fam_connection_low` | 8 |
| `fam_motivation_low` | 8 |
| `fam_activation_high` | 4 |
| `fam_activation_low` | 4 |
| `fam_support_invitation` | 6 |
| **Total** | **82** |

El motor prioriza no repetir una reflexión en siete días, pero permite relajación editorial si se agota su familia. **Nunca** se relaja el veto a repetir preguntas durante 30 días. A cuatro preguntas diarias por 30 días se requieren máximo 120 IDs distintos; 160–200 da holgura teórica, **pero** el validador debe comprobar filtros de cobertura y estilo reales para no prometer disponibilidad sin demostrarla.

## 5. Ejemplo sintético completo de pregunta

**Ejemplo de contrato; no incorporar sin revisión editorial.** Las puntuaciones representan pistas hipotéticas y **no** equivalencias universales entre metáfora y afecto.

```json
{
  "id": "q_0001",
  "revision": 1,
  "locale": "es-CL",
  "prompt": "Al pensar en las primeras horas de hoy, ¿qué detalle se te hace más presente?",
  "helperText": "Puedes quedarte con la imagen que te resulte más cercana.",
  "style": "observation",
  "primaryDimension": "valence",
  "scenarioTags": ["morning", "attention"],
  "semanticClusterId": "noticing-first-detail",
  "narrativeTemplateId": "present-detail-v1",
  "intensity": "gentle",
  "adaptiveEligible": true,
  "followUpOnly": false,
  "sessionContexts": ["morning_intent"],
  "editorialPriority": 0.8,
  "answers": [
    {
      "id": "a_0001_01",
      "text": "Hay algo pequeño que me da gusto notar.",
      "effects": [
        {"dimension": "valence", "value": 0.6, "weight": 1}
      ],
      "interpretationNote": "Pista explícita de agrado; no concluye bienestar global."
    },
    {
      "id": "a_0001_02",
      "text": "Varias cosas compiten por mi atención.",
      "effects": [
        {"dimension": "mentalLoad", "value": 0.5, "weight": 0.7}
      ],
      "interpretationNote": "Pista de carga; no inferir valencia ni ansiedad."
    },
    {
      "id": "a_0001_03",
      "text": "Aún no lo tengo claro.",
      "effects": [],
      "interpretationNote": "No hay evidencia interpretable."
    }
  ],
  "coveragePotential": {"valence": 0.3333333333, "activation": 0, "tension": 0, "mentalLoad": 0.3333333333, "connection": 0, "motivation": 0},
  "sourceIds": [],
  "quality": {
    "status": "draft",
    "authorRole": "content_agent",
    "reviewerRole": "pending_human_review",
    "reviewedAt": null,
    "originalityChecked": false,
    "clarityScore": 0.7,
    "culturalFitScore": 0.7,
    "invasivenessScore": 0.1,
    "moralizingRisk": 0.0,
    "clinicalLanguageRisk": 0.0,
    "ambiguityNotes": "Validar que respuesta 2 no equivale por sí sola a malestar.",
    "accessibilityChecked": false,
    "approvals": []
  }
}
```

**Observación:** en este ejemplo solo una de tres respuestas produce valencia, de modo que `coveragePotential(valence)=1/3`. Puede ser útil para diversidad, pero **no** por sí sola para cumplir el objetivo de dos preguntas con cobertura ≥0.75 de una sesión.

## 6. Ejemplo de familia y reflexión

```json
{
  "id": "fam_neutral_generic",
  "kind": "closing",
  "eligibleBy": "NONLABEL_NO_CONTEXT_GATE",
  "priorityBand": "fallback",
  "recommendedFocus": "observación sin interpretar el ánimo",
  "prohibitedClaims": ["diagnóstico", "certeza emocional", "OMS validó este motor"],
  "sourceIds": ["src_who_dwm_2020"],
  "quality": {"status": "draft", "approvals": []}
}
```

```json
{
  "id": "ref_0001",
  "revision": 1,
  "locale": "es-CL",
  "familyId": "fam_neutral_generic",
  "kind": "closing",
  "title": "Una idea para acompañarte",
  "body": "No necesitas entender todo lo que sientes ahora. Tal vez baste con notar un detalle de este momento antes de seguir.",
  "optionalAction": "Si te sirve, observa durante unos segundos algo que tengas cerca.",
  "practiceInspiration": "grounding",
  "sourceIds": ["src_who_dwm_2020"],
  "sourceRelationship": "inspiration",
  "quality": {"status": "draft", "approvals": []}
}
```

Los objetos abreviados del ejemplo **no** son paquetes publicables: el validador exige `QualityMetadata` completo, revisión de fuentes y cuotas antes de `approved`. La reflexión se inspira genéricamente en la atención al presente, no reproduce instrucciones protegidas ni afirma validación de la OMS.

## 7. Reglas editoriales sustantivas

### Preguntas

1. **Una idea por pregunta:** metáfora comprensible sin jerga, escena reconocible, acción observacional o pregunta introspectiva suave. Evitar imágenes que implican patología, supervivencia, culpa o trauma.
2. **Sin moralizar:** no «¿qué hiciste mal?», «¿por qué no eres agradecido?», «¿qué deberías cambiar hoy?». Sin insinuar que el bienestar es obligación.
3. **Sin clichés en cadena:** revisar «si fueras un clima/color/animal» y «energía del día»; incluso si alguno aparece, mantener diversidad real en dispositivos retóricos, sensoriales y contextos.
4. **Sin presión íntima:** no preguntar por experiencias traumáticas, diagnósticos, consumo de sustancias, autolesión, violencia, sexualidad, datos personales, relaciones identificables o situación económica específica.
5. **Opciones igualmente dignas:** no ofrecer una respuesta «buena» y otras humillantes; lenguaje de primera persona opcional y neutral, incluyente y no sexista; sin caricaturizar emociones difíciles.
6. **Interpretación conservadora:** una metáfora no tiene significado fijo entre personas/culturas. Preferir efectos para alternativas que expresen directamente agrado, distracción, carga o impulso; si la correspondencia es dudosa, `effects:[]`.
7. **Sin vincular omisión a malestar:** la omisión global no es respuesta editorial ni señal, y se puede elegir inmediatamente.
8. **Diversidad de respuestas:** variar longitud/estilo, no usar las mismas alternativas cambiando un sustantivo; no ordenar siempre de «optimista» a «pesimista»; el orden editorial es estable por pregunta.
9. **Tamaño humano:** lectura de pregunta + alternativas objetivo ≤15–25 s, sin tecnicismos ni párrafos de terapia; permitir 25 s de observación sin rellenar artificialmente con texto.
10. **Intensidad moderada máxima:** no pedir analizar conflictos importantes, recordar pérdidas o revivir escenas difíciles.

### Reflexiones

1. Distinguir hecho de posibilidad: «Tal vez…», «Podría ser útil…», «Si te sirve…». Evitar repetir «tal vez» mecánicamente en cada texto.
2. **Positivas sin euforia forzada:** reconocer pistas agradables sin convertirlas en promesas ni negar tensión coexistente.
3. **Neutrales sin «todo estará bien»:** no etiquetar la persona; enfocarse en una elección amable o un instante concreto.
4. Inspirarse en cinco familias OMS, **sin tratar el manual como certificado del motor**: *Grounding* (contacto con el momento), *Unhooking* (separación amable de pensamientos), *Acting on Values* (pequeña acción elegida), *Making Room* (permitir la experiencia sin lucha), *Being Kind / Engaging* (trato amable y reconexión). Cada reflexión refiere la categoría `practiceInspiration` en metadatos si corresponde.
5. Nada de prescripciones terapéuticas, exposición, técnicas de emergencia, recomendaciones médicas, promesas de reducción de ansiedad ni terapia encubierta.
6. Oferta de apoyo: redactada como invitación opcional, no como alarma. Nunca referir los últimos «3 de 5 días» ni contar puntuaciones al usuario.
7. Una reflexión + a lo sumo una acción optativa. Sin deberes para después, sin vínculos de pago ni planificaciones forzadas.

### Fuentes y derechos

- El material OMS puede inspirar prácticas generales; no copiar párrafos, gráficos, personajes ni instrucciones extensas. Conservar atribución bibliográfica en `content-sources.json` y `EVIDENCE_AND_LIMITATIONS.md`.
- La edición 2020 de OMS menciona licencia **CC BY-NC-SA 3.0 IGO** con restricciones de uso comercial; la decisión del MVP es crear **redacción completamente original** y no adaptar/redistribuir ilustraciones ni ejercicios protegidos. Para cualquier reutilización futura, revisar condiciones y permisos jurídicos.
- Referencias científicas respaldan marcos generales y límites; **no** usar fuente de circumplex o EMA para justificar un peso particular asignado a «camino», «ventana» o «ruido».

## 8. Validación automatizada y humana

### Esquema/consistencia (bloquea compilación)

- JSON válido, validación por schema estricto, claves obligatorias, no campos desconocidos salvo extensiones versionadas, Unicode NFC y `locale` uniforme.
- 160–200 preguntas, ≥82 reflexiones y cuotas por familia/estilo/coverage establecidas.
- Unicidad global de ID+revision; IDs de respuesta únicos por pregunta, referencias de fuentes y familias existentes, atributos enumerados válidos.
- Comprobar `coveragePotential(q,d)` como proporción derivada de las opciones (sin omisión) con tolerancia 1e-9; verificar valores de efectos finitos, pesos y duplicaciones de dimensión por respuesta.
- Confirmar `quality.status=approved` **en cada entrada incluida en runtime**, con revisión humana y seguridad. Los ejemplos `draft` no se distribuyen.
- Rechazar pares casi duplicados por coincidencia textual normalizada exacta y por `semanticClusterId` utilizado indebidamente; un informe semántico adicional requiere revisión humana, no fingir que un umbral de similitud es perfecto.
- Si `adaptiveEligible=true`: al menos dos respuestas no skip con vectores de efecto distintos; que no dependan de una única identidad metafórica culturalmente ambigua.
- Si una familia es `nonlabel`, no admitir títulos/copy que afirmen «te sientes [emoción]» ni texto que indique certeza. Revisión humana final obligatoria incluso tras el linter.

### Tests de distribución y simulación (bloquean release)

- Simular **365 fechas** y ≥1.000 seeds de instalación con perfiles sintéticos, 3–4 preguntas por día y omisiones extremas; nunca repetir questionId en cualquier ventana de 30 fechas previas.
- En la simulación elegir respuestas deliberadamente variadas; comprobar que no se agotan candidatos bajo las restricciones de sesión e intensidad. Si se agotan, corregir contenido/metadata (no permitir romper cooldown).
- Medir distribución de estilos, clusters, posiciones de respuesta y familias; investigar tendencias de sesgo como que una alternativa positiva siempre aparezca primero.
- Verificar que ≥95 % de rutas sintéticas diversas puede completar tres preguntas sin relajar diversidad contextual; este porcentaje es objetivo de QA editorial, no precisión clínica.
- Ejecutar 100 % de respuestas sintéticas todas-omitidas, neutrales, polarizadas, altamente activas y discordantes. Revisar manualmente un muestreo de cierres: ninguna etiqueta negativa, ninguna afirmación causal inventada.

### Rubrica para revisión humana (escala 1–5)

| Eje | Aceptar si… | Rechazar si… |
|---|---|---|
| Claridad | Entendible sin explicar la metáfora | Necesita interpretación esotérica |
| Amabilidad | Ofrece alternativas no estigmatizantes | Sugiere que una opción es moralmente mejor |
| No invasividad | No requiere revelar historia personal delicada | Induce recuerdos de trauma o autodiagnóstico |
| Diversidad | Agrega una perspectiva original al pack | Es sinónimo de otra pregunta |
| Fidelidad de efecto | Nota explica una pista modesta y plausible | Se asigna un ánimo completo a un símbolo cultural |
| Accesibilidad | Lectura simple, opciones distinguibles con voz | Opciones dependen de emoji o color |

Se aprueba solo si todos los ejes ≥4/5 y la revisión de seguridad concluye riesgo bajo; este umbral es editorial y no psicológico.

## 9. Flujo de trabajo del agente de contenido

1. Producir **taxonomía temática** (sin metadatos identificadores de usuario) y matriz de 180 espacios, cruzando estilos, dimensiones primarias y elementos narrativos.
2. Redactar preguntas y 3–5 opciones con textos genuinamente distintos; asignar `effects` únicamente cuando la semántica lo justifique; si es ambiguo, dejar sin efecto.
3. Generar reflexión por familia a partir de cinco líneas de inspiración OMS, usando escritura propia y sin tono clínico.
4. Referenciar fuentes, relación con la evidencia, originalidad/licencia y notas de interpretación. Ninguna pregunta necesita una cita académica para existir.
5. Revisión humana con metodología consistente, corrección de etiquetas, y aprobación por roles.
6. Validar esquemas, tamaños, cobertura, 365 días y casos adversos.
7. Entregar pack semver, SHA y `quality-report.json` que incluya conteos, fallos cero, revisores, fecha y limitaciones pendientes.

## 10. Aceptación editorial final

**C-01** 160–200 preguntas, con 3–5 opciones y metadatos completos. **C-02** ≥82 reflexiones y cuotas exactas mínimas. **C-03** omisión siempre UI fuera de respuestas. **C-04** esquema/config compatibles y efectos válidos sin inferencias clínicas. **C-05** ≥30 días consecutivos sin Q repetida bajo 3–4 preguntas diarias. **C-06** no se repite vocabulario predecible ni opciones sesgadas sistemáticamente. **C-07** cada ítem contiene historia de revisión y fuente/decisión editorial verificable. **C-08** tres respuestas contradictorias no provocan una reflexión que exagere una certeza. **C-09** apoyo no se convierte en diagnóstico. **C-10** agente de software puede cargar y validar el paquete sin leer instrucciones de autoría fuera de este documento.

**Fuentes iniciales de inspiración y límites:** OMS 2020 https://www.who.int/publications/b/53604; OMS 2026 https://www.who.int/publications/i/item/9789240120785. Véase bibliografía crítica en `EVIDENCE_AND_LIMITATIONS.md` (consulta 2026-10-24).
