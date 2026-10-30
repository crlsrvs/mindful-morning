# PRD — Aplicación de autorreflexión matinal

**Versión:** 1.0.0 · **Fecha:** 2026-10-24 · **Estado:** especificación del MVP, lista para ejecución por agentes · **Idioma de lanzamiento:** español (es-CL).  
**Documentos vinculantes:** `ARCHITECTURE.md`, `DECISION_ENGINE.md`, `CONTENT_SPEC.md`, `EVIDENCE_AND_LIMITATIONS.md`. Ningún documento por sí solo autoriza alterar los invariantes compartidos.

## 1. Resumen ejecutivo

Aplicación privada, offline y no clínica para disponer de un breve espacio de autorreflexión al comenzar el día. Tres preguntas cerradas —a veces una cuarta, si la ambigüedad puede aclararse— invitan a pensar en metáforas, situaciones y observaciones cotidianas. Tras la sesión, la persona recibe **una reflexión breve, no un diagnóstico ni una evaluación de personalidad**. El algoritmo es local, determinista, auditable y explícitamente no validado como medición psicométrica. El valor propuesto es facilitar una pausa amable, no optimizar una puntuación ni maximizar el tiempo de uso.

### Principios no negociables

1. **Autonomía:** nunca bloquear el dispositivo, obligar a completar, castigar una ausencia o restringir acceso a la ayuda.
2. **Honestidad epistemológica:** la salida del motor es una hipótesis contextual interna; jamás una certeza psicológica ni un juicio clínico.
3. **Privacidad por defecto:** sin cuentas, SDK analíticos, anuncios, IA, tracking ni servicios remotos. Datos únicamente en el dispositivo.
4. **Brevedad sin prisa:** objetivo de 2–4 minutos; 25 segundos de observación activa por pregunta, rango configurable de 20–30 s.
5. **Diversidad del contenido:** prohibida la repetición de una pregunta mostrada en los 30 días calendario anteriores, incluso si fue omitida o abandonada.
6. **Salida prudente:** mostrar explícitamente un estado positivo solo ante evidencia suficiente y consistente; en los demás casos, reflexión no etiquetadora.

## 2. Audiencia y problema

**Audiencia inicial:** personas adultas que desean empezar el día con una observación breve y personal, sin registrarse ni aprender terminología clínica. No se dirige a menores ni se posiciona como herramienta sanitaria.

**Problema:** herramientas de bienestar pueden sentirse repetitivas, intrusivas o prescriptivas. Este producto prueba la hipótesis de que preguntas indirectas, variadas y una salida pequeña pueden facilitar una pausa voluntaria sin crear una obligación adicional.

**JTBD:** «Al empezar mi día, quiero detenerme un momento a observar lo que me pasa, sin tener que contar una historia íntima, para continuar con algo de perspectiva».

**Hipótesis de valor (por validar):** percepción de utilidad y tranquilidad ≥ estrategias de preguntas repetitivas o etiquetas categóricas; la espera de 25 segundos resulta tolerable y aporta un momento deliberado, en vez de frustración.

## 3. Alcance

### Dentro del MVP

- Android primero, React Native + Expo + TypeScript; lógica independiente de plataforma y preparada para iOS.
- Onboarding corto: intención del producto, motivo de preguntas indirectas, límites no clínicos, almacenamiento local, preferencias de notificación y hábito.
- **Una sesión por fecha local**: exactamente tres preguntas estándar en una sesión completada y una cuarta solo si se cumplen los criterios de `DECISION_ENGINE.md`.
- Opciones cerradas; `Prefiero no responder` inmediata en todas las preguntas. El resto se habilita después de 25 segundos **de presencia en primer plano** por pregunta (configuración interna 20–30 s, valor de producto 25). Sin reloj visible que induzca presión; indicador tranquilo de disponibilidad.
- Pausar saliendo de la aplicación; reanudar voluntariamente el mismo día sin perder respuestas ni reiniciar la espera ya transcurrida en primer plano para la pregunta activa.
- Reflexión final: positiva explícita solo bajo condiciones estrictas; neutral/contextual cuando no corresponda afirmar positividad; consejo de apoyo opcional y no alarmista en patrón interno 3/5.
- Configuración: recordatorio local opcional y hora; activar/desactivar streak suave; límites y privacidad; `Necesito apoyo`; eliminar todos mis datos.
- Recordatorios matinales exclusivamente locales; no solicitar permiso hasta que el usuario los active.
- Sesiones, exposiciones, señales y decisiones guardadas localmente; sin historial visible.
- Biblioteca editorial incluida en el paquete de app: objetivo **180 preguntas originales (rango de aceptación 160–200)** y 82 reflexiones iniciales conforme al contrato de `CONTENT_SPEC.md`.
- Accesibilidad: lector de pantalla, control de tamaño de fuente, contraste, movimiento reducido y controles táctiles adecuados.

### Fuera del MVP

- Horario alternativo tarde/noche como tipo de sesión, historial navegable, gráficos de progreso emocional, baseline individual, cuestionarios de diagnóstico, preguntas abiertas, chat, IA, personalización aprendida, multicuenta, backend, sincronización, comunidad, gamificación competitiva, exportación de datos y comparación con terceros.
- Predicción de crisis, evaluación de riesgo suicida, asistencia clínica o alertas a contactos.
- Integración con salud del sistema, wearables, ubicación o listas de contactos.

### Preparado para una segunda fase, no activo

Campos de datos para `sessionContext`/`timeOfDay`, estimaciones por versión, `baselineVersion`, locale, soporte a futuras migraciones y componentes de presentación desacoplados. Preparar no significa activar por defecto.

## 4. Experiencia y flujos

### Mapa de navegación

`Bienvenida / Onboarding` → `Inicio` → `Pregunta 1` → `Pregunta 2` → `Pregunta 3` → (`Pregunta 4` condicional) → `Cierre` → `Inicio`. Accesos persistentes desde `Inicio` y `Configuración` a `Necesito apoyo`; salida de sesión a `Inicio` sin diálogo culpabilizante. `Configuración` incluye `Límites` y `Privacidad`.

### Onboarding (máximo cuatro pantallas, omisible sin negar uso)

1. **Propósito:** «Un espacio breve para notar cómo comienza tu día. No hay respuestas correctas».
2. **Preguntas indirectas:** «Una imagen o situación cotidiana puede ayudarte a observar tu experiencia desde otro ángulo. Puedes omitir cualquier pregunta»; no afirmar superioridad científica de metáforas.
3. **Límites y privacidad:** «Esto no diagnostica ni ofrece tratamiento. Las respuestas permanecen en este dispositivo. Puedes borrarlas cuando quieras». Enlace `Conocer los límites` y acceso a apoyo.
4. **Opcionalidad:** recordatorio **desactivado** por defecto; elegir hora solo si se activa (sugerencia visual 09:00, editable); streak desactivado por defecto. No pedir notificaciones si se omite.

Guardar `onboardingCompleted` solo al finalizar o elegir «Empezar ahora»; nunca forzar el permiso de notificaciones ni rellenar respuestas.

### Inicio

- Si hoy no existe sesión iniciada: CTA «Tomarme un momento» y duración orientativa «2–4 min».
- Si existe sesión parcial del día: «Continuar» y «Dejar por hoy».
- Si existe sesión completada: «Ya tuviste tu espacio hoy» y, opcionalmente, acceso únicamente a **su cierre de hoy** (no al historial); no permitir recomputar ni iniciar otra sesión.
- Si ya pasó la mañana: mantener acceso al único espacio del día sin convertirlo en tipo «tarde»; no generar una sesión extra. Producto de intención matinal, no bloqueo por hora.
- `Necesito apoyo` siempre visible desde Inicio y Configuración, sin depender del motor.

### Preguntas

- Combinación preferente de formatos: metáfora, escena cotidiana, observación o introspección suave. No presentar tres preguntas de igual familia ni más de dos con el mismo recurso lingüístico dominante.
- Mostrar primero la pregunta, contexto de una línea si es útil y opciones inicialmente inactivas; mostrar `Prefiero no responder` y `Salir` inmediatamente.
- Temporizador cuenta solo con app activa en primer plano; persistir segundos acumulados. Si la persona sale, se conserva el avance; no hacerla esperar otra vez por los segundos ya consumidos.
- Pregunta respondida u omitida → avanzar. No existe botón de salto a respuesta sin esperar, salvo «Prefiero no responder».
- Evitar reordenar opciones de forma que cambie su significado; orden estable editorialmente, alternancia del texto de las alternativas incluida en el dataset, no paráfrasis automática.
- El usuario puede cerrar la aplicación sin confirmar ni perder el avance de hoy.

### Cierre

- **Positivo sustentado:** título corto y explícito pero tentativo, por ejemplo «Hay señales agradables en este comienzo»; texto que reconozca recursos o experiencias, sin exageraciones.
- **Otros resultados:** encabezado universal «Una idea para acompañarte»; una o dos frases neutrales o adaptadas a contexto observado, sin «estás triste», «tienes ansiedad», «necesitas», «deberías» ni puntajes.
- Máximo una invitación discreta a una acción optativa que no exija abrir otra pantalla; no crear tareas o metas pendientes.
- Si hay **patrón de malestar 3/5**, solo tras una sesión actual con evidencia consistente de malestar y sin cooldown, agregar tarjeta textual no urgente «Si te ha resultado difícil últimamente, hablar con alguien de confianza podría ayudar. Puedes encontrar opciones en Necesito apoyo». No afirmar conocimiento de su vivencia.
- Botón «Terminar» → Inicio. No mostrar vector, percentiles, etiquetas negativas, ni supuestas tendencias.

### Recursos: `Necesito apoyo`

Acceso permanente que funciona offline con texto local: «Esta app no puede saber si estás en una crisis. Si necesitas ayuda ahora, busca una persona de confianza o servicios locales». Para la edición es-CL, incluir recursos **verificados al 2026-10-24**: `*4141` (apoyo en crisis suicida, Chile, 24/7) y `600 360 7777` (Salud Responde, 24/7), con el ámbito y fuente oficial; ambos accesibles con una acción `Llamar` que abre el marcador y requiere confirmación del sistema. Mostrar aviso de que llamar necesita cobertura telefónica; no prometer atención instantánea ni asumir ubicación por idioma. Para usuarios fuera de Chile: «Busca servicios de emergencia o salud de tu localidad» sin inventar números. Las fichas son texto empaquetado y requieren revisión editorial antes de cada release.

## 5. Reglas de tiempo y continuidad

- `sessionDate` se fija en `YYYY-MM-DD` de la zona horaria local del dispositivo **al iniciar**; guardar además zona IANA y timestamp UTC. Una sesión pertenece siempre a esa fecha anclada.
- Máximo una sesión **completada** por fecha local y un único borrador para esa fecha; si se abandona, puede retomarse el mismo día o empezar de nuevo **sin reutilizar las preguntas ya mostradas**. Elección de MVP: «Dejar por hoy» cierra el borrador y no permite reiniciar ese día; reduce tentación de rehacer inferencias.
- Si la sesión pasa de medianoche: expira como abandonada; no se completa al día siguiente ni cuenta para patrones/streak. Se puede comenzar la nueva sesión de la nueva fecha. Cambios de zona horaria no reetiquetan sesiones pasadas.
- Cambio manual de fecha: no modificar registros pasados. Si la fecha local retrocede a un día ya completado, no crear duplicado; documentar que cambiar la hora del dispositivo puede alterar la disponibilidad y que **no se pretende antifraude**.
- Exposición se registra al mostrar cada pregunta, **antes de habilitar respuestas**. La misma pregunta del mismo borrador puede reabrirse en la reanudación; exposiciones de otras sesiones bloquean los 30 días siguientes (ventana de los 30 días calendario previos, incluyendo hoy).
- El cierre solo se confirma mediante escritura atómica de sesión completada + estimación + reflexión elegida + contador de hábito y, si aplica, evento de apoyo mostrado. Reabrir cierre no vuelve a registrar eventos ni modifica la estimación.

## 6. Hábitos, recordatorios y accesibilidad

**Recordatorio:** uno local diario, opt-in y con hora ajustable; redacción neutral («Si te apetece, tienes un momento para ti»). Ningún push remoto, SMS ni email. No solicitar permisos para exact alarms: usar entrega flexible/best-effort, la puntualidad no está garantizada por restricciones del SO. Cuando una notificación llega tras completar el día, abrir Inicio y no otra sesión; el SO podría mostrarla igualmente antes de que el app la pueda cancelar. Reconciliar agenda al abrir/cambiar la preferencia y cuando haya cambios de hora/zona.

**Streak opt-in:** conteo de fechas locales consecutivas completadas (no exigencia moral); si se corta, ocultar mensaje de pérdida y mostrar sencillamente las nuevas sesiones acumuladas desde el último inicio. En días sucesivos mostrar un saludo sobrio («Gracias por reservarte este momento»), sin fuegos artificiales, umbrales de premio, notificaciones extra, promesas de salud ni vergüenza. Si está desactivado, el cálculo puede existir localmente, pero no se exhibe. No se permite usar streak para elegir preguntas ni reflexiones.

**Accesibilidad obligatoria:** textos ajustables sin truncamiento, objetivos táctiles mínimos equivalentes a 44 pt, navegación por lector de pantalla con anuncio de habilitación, no depender solo del color, reducción de animación, contraste verificado WCAG AA para texto cuando sea aplicable; temporizador sin distracciones e idéntico tiempo de habilitación para tecnologías de asistencia, con `Prefiero no responder` inmediato. Probar Android TalkBack y posteriormente VoiceOver iOS.

## 7. Reglas de motor que el producto exige

La especificación **normativa y única** está en `DECISION_ENGINE.md`. Este PRD fija solo las invariantes externas:

- Vector interno normalizado `valence`, `activation`, `tension`, `mentalLoad`, `connection`, `motivation` en [-1,+1] cuando hay datos; `null` cuando no los hay. `tension`/`mentalLoad`: valores positivos significan mayor intensidad/carga; `connection`/`motivation`: valores positivos mayor sensación de conexión/impulso. No asociar activación alta con malestar por sí sola.
- Respuestas cerradas aportan efectos ponderados independientes; omisiones **no generan efectos** ni penalizaciones.
- Confianza/suficiencia es **indicador interno heurístico de consistencia y cobertura**, jamás probabilidad de «verdad», de diagnóstico o de correlación clínica.
- Cuarta pregunta depende de ambigüedad **accionable**, de un candidato editorialmente seguro y de beneficio esperado bajo una simulación de respuestas; no por engagement ni omisiones.
- Resultado con potencial malestar nunca exhibe esa etiqueta, incluso si se usa internamente para una oferta de apoyo prudente.
- Regla 3/5 en **cinco fechas calendario inclusivas**: contar ≥3 sesiones completadas internamente clasificadas como malestar consistente; exigir que la sesión actual también cumpla y cooldown de siete días completos entre apariciones del mensaje. Días sin sesión, omitidos o desconocidos no cuentan.

## 8. Indicadores de éxito y validación (sin telemetría remota)

**Evaluación de producto antes de liberar:** sesiones presenciales moderadas y pruebas voluntarias de prototipo, sin subir respuestas reales a herramientas de análisis. Medir mediante observación consentida y datos ficticios en ensayos; métricas agregadas solo si el participante lo acepta fuera de la app. No incorporar SDK de analytics.

| Objetivo | Criterio inicial (heurístico) | Cómo probar |
|---|---|---|
| Experiencia breve | Mediana 2–4 min en pruebas moderadas; no prometerlo para lector de pantalla | Cronometría observacional consentida |
| Espera aceptable | ≥70 % no la percibe como frustrante | Entrevista cualitativa, no telemetría |
| Percepción respetuosa | ≥85 % no considera las preguntas invasivas o moralizantes | Revisión editorial + prueba de comprensión |
| Seguridad del lenguaje | 0 etiquetas clínicas o afirmaciones categóricas en 100 % de salidas simuladas | Linter + revisión editorial |
| Determinismo | Mismas entradas y versiones → salida idéntica | Tests de snapshots en el motor puro |
| Privacidad | 0 llamadas salientes de la aplicación en flujos MVP | Inspección de red en build release |
| Integridad | 0 sesiones duplicadas o repetición de preguntas en ventana 30 días | Tests de integración + simulación anual |

Los umbrales de usabilidad son **objetivos iniciales**, no predicciones ni resultados observados.

## 9. Historias y criterios de aceptación (Given / When / Then)

| ID | Dado / Cuando | Entonces |
|---|---|---|
| AC-01 | Primera apertura offline / completo u omito onboarding | Puedo iniciar sesión sin cuenta ni red; veo límites y tengo acceso a `Necesito apoyo`. |
| AC-02 | Pregunta recién mostrada / antes de 25 s en primer plano | Solo `Prefiero no responder` y `Salir` están activos; a 25 s se habilitan las otras opciones. |
| AC-03 | 10 s de reflexión y app en background por 5 min / regreso | Quedan ~15 s por cumplir, no 0 y no 25; nunca se habilita por reloj en background. |
| AC-04 | Elijo `Prefiero no responder` inmediatamente | Avanza en menos de 1 s sin señal negativa ni temporizador. |
| AC-05 | Tres preguntas coherentes y sin incertidumbre accionable | Cierre tras pregunta 3; la cuarta no aparece. |
| AC-06 | Tres respuestas contradictorias y candidato que puede aclarar / con datos suficientes | Aparece **a lo sumo** una cuarta pregunta según umbrales del motor; no se hacen cinco. |
| AC-07 | Omito una pregunta / cuarta candidata con dimensión principal omitida | El motor descarta la candidata; puede finalizar en tres. |
| AC-08 | Un ítem fue mostrado en fecha D / sesión en cualquiera de D a D+30 | No se elige el mismo ítem en otra sesión de los 30 días siguientes a D. |
| AC-09 | Ya completé hoy / vuelvo a abrir la app | No puedo iniciar otra sesión; sí puedo revisar el cierre de hoy, sin duplicar registros. |
| AC-10 | Sin datos o con evidencias mezcladas / termino | Solo reflexión neutral, nunca etiqueta negativa ni puntuación. |
| AC-11 | Evidencia positiva válida / termino | Título positivo tentativo y reflexión positiva; no número ni diagnóstico. |
| AC-12 | Tres días internos consistentes de malestar en los últimos 5, incluido hoy / nunca mostrada oferta en 7 días | Aparece una invitación neutral y discreta a buscar apoyo; el resultado principal sigue sin etiquetas negativas. |
| AC-13 | Hay tres días malos pero hoy no es uno, o se mostró apoyo hace menos de 7 días | No aparece nueva invitación contextual. `Necesito apoyo` sigue accesible. |
| AC-14 | Rechazo permiso de notificaciones | La app funciona íntegramente y no vuelve a preguntar sin acción explícita. |
| AC-15 | Elijo borrar todos mis datos | Se eliminan sesiones, exposiciones, preferencias y llave local; la app vuelve a bienvenida sin sincronización ni recuperación prometida. |
| AC-16 | Reinicio la app offline, cambio zona y ajusto hora | No se corrompen registros ni se reinterpretan fechas históricas; el recordatorio se reconcilia sin servidor. |
| AC-17 | Uso TalkBack y fuente ampliada | Todas las opciones son accesibles, habilitación anunciada, sin texto cortado ni necesidad de gestos complejos. |
| AC-18 | Simulo 365 días a máximo cuatro preguntas/día con catálogo válido | No hay duplicados en los 30 días previos y cada sesión del test dispone de tres preguntas estándar. |

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación operativa | Estado |
|---|---|---|
| Tres preguntas no sostienen una inferencia emocional fiable | Umbrales conservadores, `null`, etiquetas restringidas, pruebas adversariales | Mitigado solo en diseño; no validado |
| Metáforas ambiguas por cultura | Revisión con participantes es-CL; variantes y vetos editoriales | Por validar |
| La espera de 25 s es molesta | Prueba de usabilidad; configuración interna versionada 20–30; omisión inmediata | Por validar |
| Sesgo del contenido genera salidas «positivas» por wording | Auditoría de efectos por revisores; balanced scenarios, simulaciones | Por validar |
| Dispositivo comprometido, copias o recuperación de datos | DB cifrada, backups desactivados, borrado local, divulgación de límites | Diseño técnico definido |
| Recursos externos quedan obsoletos | Fichas con `lastVerifiedAt`, revisión antes de cada publicación | Proceso obligatorio |
| Usuarios interpretan apoyo como diagnóstico | Invitación condicional con lenguaje no categórico; nunca «detectamos» | Validación de copy |

## 11. Plan de entrega y responsabilidades entre agentes

**Orden de trabajo sin interdependencia cíclica:** (1) agente de contenido produce catálogo JSON/archivos y QA conforme a `CONTENT_SPEC.md`; (2) agente de software construye motor, persistencia, validadores, UI y pruebas contra el mismo contrato; (3) integración y pruebas cruzadas de compatibilidad. Puede desarrollarse el motor con *fixtures sintéticas*, sin esperar el catálogo final.

**Contrato de handoff del contenido:** paquete versionado es-CL con preguntas, respuestas, efectos, familias, reflexiones, fuentes, metadatos de calidad y reporte de validación. **Contrato de handoff del software:** app offline, motor puro, snapshot de config, migraciones, pruebas y guías de ejecución Android e iOS. Ningún agente debe reinterpretar silenciosamente fórmulas, términos de dimensiones, criterios del 3/5 ni copy de seguridad.

## 12. Criterio de liberación (Definition of Done)

El MVP solo se considera terminado si pasan todos los criterios AC-01…18, las validaciones estructurales/editoriales, las suites de determinismo y límites de `DECISION_ENGINE.md`, las pruebas de privacidad, el paquete de 160–200 preguntas con cobertura 30 días y la revisión humana de recursos de apoyo. Las revisiones de evidencia y seguridad **no** convierten la app en producto clínico. Cualquier cambio de semántica requiere nueva versión y cambios concordantes en los cinco documentos.

**Referencias base:** `EVIDENCE_AND_LIMITATIONS.md`. Consulta realizada el **2026-10-24**. El producto no es una intervención de la OMS.
