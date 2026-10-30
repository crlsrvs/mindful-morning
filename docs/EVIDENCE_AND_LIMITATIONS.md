# EVIDENCE_AND_LIMITATIONS — Evidencia, extrapolaciones y límites

**Versión:** 1.0.0 · **Fecha y consulta de referencias:** 2026-10-24.  
**Regla interpretativa:** ninguna referencia citada valida **esta** aplicación, sus preguntas originales, el estimador de seis dimensiones, la selección adaptativa o el patrón 3/5. El documento distingue soporte general de evidencia clínica específica.

## 1. Alcance de la investigación

Fuentes priorizadas: publicaciones originales y páginas oficiales de OMS, artículos fundamentales de afecto y evaluación momentánea, documentación oficial Expo y recursos gubernamentales chilenos para apoyo. Se consultaron páginas bibliográficas y resúmenes oficiales. **No se realizó revisión sistemática de toda la literatura ni evaluación metodológica detallada de cada ensayo**, y la documentación de 2026 de la OMS no se interpretó como una validación independiente de nuestro diseño. Algunas páginas de descarga PDF no fueron accesibles desde el entorno de consulta; las afirmaciones se limitan a lo verificable en páginas oficiales y resúmenes bibliográficos, no al contenido íntegro no comprobado de dichos PDFs.

## 2. Clasificación de respaldo

- **A — Evidencia directamente aplicable a una práctica o concepto general:** por ejemplo, una guía de la OMS describe habilidades de manejo de estrés, pero no necesariamente avala su aplicación mediante nuestras preguntas.
- **B — Inspiración conceptual:** dos ejes del afecto como marco para organizar lenguaje y reflexiones; uso conceptual, no medición validada.
- **C — Decisión técnica/UX:** elección de stack, diseño de 25 s, una sesión al día, recordatorio opcional. Puede ser razonable aunque no esté validada por un estudio.
- **D — Heurística propietaria del producto:** pesos, valores, confianzas, umbrales, selector, reflexión, 3/5. **No atribuirles estatus psicométrico**.
- **E — Supuesto por probar:** experiencia placentera, seguridad percibida, no invasividad, efecto de metáforas, retención voluntaria y ausencia de daño.

La etiqueta A **nunca** autoriza a reclamar eficacia de un algoritmo inventado.

## 3. Matriz evidencia → interpretación → límite

| Fuente / hallazgo verificado | Clasificación | Aplicación permitida | Extrapolación prohibida |
|---|---|---|---|
| Russell (1980) propone una representación circular organizada por placer/desagrado y arousal (activación). | B | Usar `valence` y `activation` como coordenadas conceptuales de un modelo **interno** de señales. | Decir que nuestros tres ítems indirectos miden esas coordenadas con validez o fiabilidad. |
| Russell, Weiss & Mendelsohn (1989) estudian un instrumento específico, Affect Grid, de placer/activación. | B | Reconocer que existen operacionalizaciones rápidas investigadas; **la nuestra es distinta**. | Transferir sus propiedades psicométricas a alternativas metafóricas o a seis dimensiones nuevas. |
| Shiffman, Stone & Hufford (2008) revisan la evaluación ecológica momentánea (EMA) y su relación con menor sesgo de recuerdo retrospectivo; también describen desafíos de diseño. | A/B | Elegir observación próxima al momento y evitar pedir recuerdos extensos. | Afirmar que una sesión matinal única es EMA de alta calidad o que siempre evita sesgos. |
| OMS, *Doing What Matters in Times of Stress* (2020), ofrece prácticas de ayuda para afrontar estrés, con ejercicios breves de grounding, unhooking, making room, etc. | A para habilidades generales; B para nuestro contenido | Inspirarse **con redacción original** en atención presente, trato amable, acciones con valores y acogida de la experiencia. | «La OMS desarrolló, certificó o validó esta app o su motor emocional». |
| OMS, *Psychological self-help interventions* (2026), indica efectividad de intervenciones estructuradas DWM y Step-by-Step en múltiples ensayos; describe condiciones de entrega de esas intervenciones. | A para dichas intervenciones, no para MVP | Citar como contexto sobre intervenciones de autoayuda estructurada. | Concluir que nuestros cierres de 1–2 frases reproducen intervención DWM o heredan eficacia. |
| Expo SQLite, SecureStore, Notifications y Localization (documentación oficial). | C | Justificar viabilidad offline, cifrado local, programación de recordatorios y fechas locales. | Prometer seguridad absoluta, notificaciones exactas o compatibilidad sin pruebas por SO/build. |
| Recurso MINSAL `*4141` y Salud Responde `600 360 7777`, Chile. | A para existencia/contacto administrativo, no ensayo | Incluir fichas estáticas y directas «Si estás en Chile» en `Necesito apoyo`; verificar al lanzar. | Decir que la app detectó una crisis, o que esas líneas cubren otros países. |
| Espera de 25 s, tres preguntas, 160–200 preguntas, 82 reflexiones. | C/D | Parámetros de diseño medibles en usabilidad. | Presentarlos como dosis terapéutica eficaz o número científicamente óptimo. |
| Media ponderada + varianza + `confidence` cap .85, umbrales ±.35, cuarta por ganancia y regla 3/5. | D | Hacer reglas transparentes, reproducibles y conservadoras; evaluar daños potenciales. | Sensibilidad/especificidad, «precisión» de afecto, diagnóstico o predicción clínica. |

## 4. Fuentes verificadas y comentarios bibliográficos

### [E1] OMS (2020) — *Doing What Matters in Times of Stress: An Illustrated Guide*

- Organismo: World Health Organization, Department of Mental Health and Substance Use.
- Publicación: 29 de abril de 2020, guía ilustrada; ISBN 978-92-4-000391-0.
- Enlace oficial en español: https://www.who.int/es/publications/b/53604
- Ficha institucional / resumen verificable: https://tdr.who.int/home/our-work/global-engagement/9789240003927
- En la ficha oficial se destacan habilidades de ayuda personal con práctica de algunos minutos al día. Se enumeran audios complementarios para atención, conexión al momento, separación de pensamientos, hacer espacio y amabilidad personal.
- **Alcance real:** sirve como inspiración de principios prácticos. Que unas reflexiones originales evoquen esos principios **no constituye la misma intervención**.
- **Derechos:** ficha bibliográfica OMS indica licencia CC BY-NC-SA 3.0 IGO para material 2020 y condiciones para uso comercial. El MVP no copia imágenes, tablas o textos extensos ni redistribuye adaptación del manual; si en el futuro lo hiciera, se debe revisar legalidad y atribución.

### [E2] OMS (2026) — *Psychological self-help interventions: Delivering self-help for individuals, featuring Step-by-Step and Doing What Matters in Times of Stress*

- World Health Organization, publicada el **1 de junio de 2026**, ISBN 978-92-4-012078-5.
- Ficha oficial: https://www.who.int/publications/i/item/9789240120785
- La ficha presenta modalidades guiadas y no guiadas de intervenciones estructuradas y afirma que Step-by-Step y DWM han mostrado efectividad en múltiples ensayos controlados aleatorizados.
- **Límite crucial:** las intervenciones incluyen estructura y materiales específicos que esta app **no implementa**. No derivar eficacia ni recomendaciones clínicas del «parecido» de una frase con un principio OMS. Los RCT individuales no se examinaron aquí.

### [E3] Russell (1980) — *A circumplex model of affect*

- James A. Russell. *Journal of Personality and Social Psychology*, 39(6), 1161–1178 (1980).
- DOI: https://doi.org/10.1037/h0077714
- Ficha / resumen bibliográfico verificable: https://www.tandfonline.com/servlet/linkout?type=Scholix&url=https%3A%2F%2Fdx.doi.org%2F10.1037%252Fh0077714
- Propone relación sistemática entre placer-desagrado y activación para describir conceptos afectivos.
- **Límite:** no respalda nuestro mapeo de respuestas metafóricas, sus pesos ni cuatro ejes contextuales. Además, una representación conceptual no convierte en directa la medida indirecta.

### [E4] Russell, Weiss & Mendelsohn (1989) — *Affect Grid: A Single-Item Scale of Pleasure and Arousal*

- J. A. Russell, A. Weiss, G. A. Mendelsohn. *Journal of Personality and Social Psychology*, 57(3), 493–502 (1989).
- Artículo disponible en copia institucional de investigación: https://emotiondevelopmentlab.weebly.com/uploads/2/5/2/0/25200250/russell_j.a._weiss_a.__mendelsohn_g.a._1989.pdf
- Se describe una escala original de un solo ítem de placer-activación y evidencia de estudios para **ese instrumento**.
- **Límite:** nuestra experiencia no administra ese instrumento ni reivindica su validación. Nota: la cita y resumen se verificaron en el registro disponible, sin auditoría metodológica completa del documento PDF.

### [E5] Shiffman, Stone & Hufford (2008) — *Ecological momentary assessment*

- Saul Shiffman, Arthur A. Stone, Michael R. Hufford. *Annual Review of Clinical Psychology*, 4, 1–32 (2008).
- DOI: https://doi.org/10.1146/annurev.clinpsy.3.022806.091415
- Registro bibliográfico: https://pubmed.ncbi.nlm.nih.gov/18509902/
- EMA implica observaciones repetidas cercanas a la experiencia en entornos naturales; puede minimizar algunos sesgos de recuerdo global, pero requiere resolver frecuencia, cumplimiento, interferencia y contexto.
- **Límite:** una única sesión matinal con preguntas indirectas no adquiere automáticamente la validez de un instrumento EMA, ni describe el resto del día.

### [E6] Expo — documentación técnica oficial

Consultadas el 2026-10-24:

- Portal: https://docs.expo.dev/
- SQLite y soporte de SQLCipher (requiere build nativa; no Expo Go): https://docs.expo.dev/versions/latest/sdk/sqlite/
- SecureStore (ciclo de vida Android/iOS): https://docs.expo.dev/versions/latest/sdk/securestore/
- Notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- Localization y zona horaria: https://docs.expo.dev/versions/latest/sdk/localization/
- Unit testing Jest: https://docs.expo.dev/develop/unit-testing/

Estas referencias documentan **factibilidad** técnica, no privacidad ilimitada. Android puede retrasar notificaciones de mejor esfuerzo; claves pueden perderse; el sistema operativo puede crear capturas o poseer permisos fuera del control de la app. Compilaciones con SQLCipher deben verificar la extensión en runtime para evitar almacenar accidentalmente en claro.

### [E7] Chile — líneas de apoyo verificadas

- Ministerio de Salud, `*4141`, línea de prevención del suicidio y crisis asociadas, gratuita y disponible 24/7: https://www.minsal.cl/linea-de-atencion-4141-no-estas-solo-no-estas-sola/
- Ficha pública estatal, actualizada **28 de septiembre de 2026**, confirma `*4141`, disponibilidad 24/7 y operación desde teléfonos: https://www.ventanillaunicasocial.gob.cl/ficha/310/fono-prevencion-suicidio
- Ficha pública estatal, actualizada **28 de septiembre de 2026**, Salud Responde `600 360 7777`, orientación de salud por profesionales, 24/7: https://www.ventanillaunicasocial.gob.cl/ficha/311/fono-salud-responde
- Las fichas públicas pueden cambiar, sufrir interrupciones o restricciones de llamada. El producto no determina país mediante localización y no debe mostrar estos recursos como universales. El acceso al marcador puede funcionar offline; **la llamada requiere una red telefónica**.

## 5. Origen de cada gran decisión

| Decisión | Clasificación | Justificación de producto | Validación necesaria |
|---|---|---|---|
| Preguntas indirectas / metáforas | B/E | Invitar a pensar sin interrogatorio íntimo directo | Comprensión, aceptabilidad cultural y lectura de alternativas |
| Un espacio al día | C/E | Pequeño ritual sin compulsión | Percepción de carga, retorno voluntario y percepción de utilidad |
| 25 s antes de responder (20–30 configurable) | C/D/E | Crear una pausa deliberada; **no** afirmar neuroefecto | Frustración, accesibilidad, duración y abandono |
| Tres preguntas + eventual cuarta | C/D | Mantener acotación y evitar preguntas innecesarias | Coste/beneficio frente a 2 y 4 ítems, sin declarar ganancia clínica |
| Dimensiones valence/activation | B | Modelo conceptual de dos ejes | Comparación solo exploratoria con autoinforme validado, bajo consentimiento |
| Cuatro ejes contextuales | D | Mejorar repertorio de cierres sin nombre de emociones | Validar semántica, correlaciones espurias y sesgos |
| Asignar `value` / `weight` desde opciones | D/E | Heurística editorial auditada | Revisión independiente por expertas/os; test cognitivo |
| `confidence`, media y varianza, etiquetas | D | Elegir **cuándo no afirmar** lo que se desconoce | Tests de robustez y sesgos; no llamar sensibilidad clínica |
| Umbral positivo +0.35/C≥0.60/V≤0.15 | D | Ser selectivo antes de etiqueta explícita | Estudio de comprensión, calibración en marco **no clínico** |
| Malestar interno -0.35/3 de 5 | D/E | Activar acceso amable a apoyo si hay señales consistentes | Riesgo de falso positivo/negativo, malinterpretación, daño potencial |
| Sugerencia cooldown de 7 días | D/E | Evitar presión repetitiva | Entrevistas y revisión de aceptabilidad |
| Cierre de inspiración OMS | A/B | Ofrecer idea breve de atención/amabilidad/valores | **No equiparable** a una intervención validada; evaluar seguridad de copy |
| SQLCipher, sin red, sin cuentas | C | Reducir exposición, coste y complejidad | Pruebas de reposo/copia de seguridad/red/build |
| Streak y notificaciones opt-in | C/E | Respetar autonomía, no maximizar sesiones | Pruebas de percepción de culpa y compulsión |

## 6. Límites de inferencia: interpretación correcta

1. **Tres o cuatro preguntas no bastan para caracterizar un estado emocional complejo.** Al elegir respuestas diseñadas editorialmente, una persona puede seleccionar una metáfora por estética o costumbre y no por su estado.
2. **Falta de respuesta no representa patología ni evitación:** puede deberse a cansancio, distracción, accesibilidad, privacidad o simple elección. `Prefiero no responder` aporta cero información y nunca penalización.
3. **Ambigüedad cultural y lingüística:** metáforas tienen significados diversos; incluso un efecto marcado `value:+0.6` es una convención, no una verdad psicológica.
4. **No extrapolar de una mañana al día completo, a personalidad ni a tendencia clínica.** El estado interno es una estimación local del patrón de respuestas en esa sesión.
5. **Confianza no es probabilidad:** `C=0.66` **no** significa «66 % de certeza de que estás bien». Su techo .85 es una barrera de presentación arbitraria.
6. **Patrones 3/5 no equivalen a detección de síntomas**, gravedad, riesgo suicida ni indicación de tratamiento; son únicamente un disparador editorial de una oferta neutral.
7. **La app no detecta crisis o emergencias.** No intentar detectar ideación suicida con preguntas indirectas, ni agregar a futuro sin protocolos de seguridad y evidencia robusta.
8. **No OMS validated:** cinco temas de habilidades OMS son inspiración general; la correspondencia de vector/familias/reflexiones la inventa el equipo de producto.
9. **Privacidad no equivale a invisibilidad perfecta:** alguien con acceso al dispositivo desbloqueado puede ver la pantalla; pérdida de llave cancela acceso; el usuario puede capturar pantallas. No hay backups ni recuperación remota.
10. **Ausencia de datos no es ausencia de malestar:** el app no puede evaluar qué ocurre fuera de su interacción breve y jamás debe ofrecer garantías de seguridad.

## 7. Copy normativo sobre límites

### Onboarding (versión breve)

> «Este es un espacio personal para observar cómo comienza tu día. Las preguntas y reflexiones no son una evaluación de salud mental. La app no diagnostica ni ofrece tratamiento, y no puede detectar emergencias. Tus respuestas permanecen en este dispositivo y puedes borrarlas cuando quieras. Si necesitas ayuda, siempre tendrás disponible “Necesito apoyo”.»

### Acerca de esta app / Configuración

> «Esta app ofrece preguntas de autorreflexión y reflexiones generales. Sus interpretaciones se basan en reglas de producto no validadas psicométricamente; pueden no coincidir con tu experiencia. No sustituyen la atención profesional ni detectan crisis o riesgo suicida. No está diseñada para tratar ansiedad, depresión u otras condiciones. Puedes omitir preguntas, abandonar la sesión o borrar toda la información local sin consecuencia.»

### Cierre sin evidencia suficiente

> «Una idea para acompañarte. No necesitas interpretar este momento a la fuerza; si te sirve, puedes notar un detalle de lo que te rodea antes de continuar.»

### Invitación por patrón interno (sin mencionar números)

> «Si estos días han resultado difíciles, quizá te sirva conversar con alguien de confianza. Si prefieres, puedes consultar opciones en “Necesito apoyo”.»

### Necesito apoyo (texto permanente)

> «No es necesario completar preguntas para buscar apoyo. Esta app no sabe si estás en una emergencia. Si te sientes en peligro inmediato, busca servicios de emergencia de tu localidad o apoyo presencial. Si estás en Chile, la línea *4141 atiende crisis de salud mental asociadas al suicidio, y Salud Responde 600 360 7777 ofrece orientación en salud. Los servicios y horarios pueden cambiar; consulta las fuentes oficiales cuando tengas conexión.»

Estas versiones son **modelos normativos de tono** para el agente de contenido; la pantalla final debe seguirlos sin transformarlos en una alarma automatizada.

## 8. Agenda mínima de validación posterior y ética de producto

### Antes de implementación pública

- Sesiones de *think-aloud* con personas adultas diversas: comprensión de metáforas, interpretaciones de opciones, diferencia entre «respuesta cerrada» y prueba clínica, tono de cierres.
- Consulta a especialistas de salud mental sobre **riesgos de comunicación**, sin llamarla validación clínica del motor; revisar guías de derivación, efectos indeseados, sesgos culturales.
- Ensayos con alternativas a los 25 s usando prototipos y consentimiento; medir abandonos y presión autopercibida, sin instrumentación externa en la app real.
- Auditoría adversarial de copy: temas de muerte, violencia, trauma, culpa, activación, insomnio, tensión y atribución de certeza.
- Pruebas de seguridad sobre pack y cambios de versión, transacciones cifradas, pérdida de llave, backup, zonas horarias y desinstalación.

### Si en el futuro se estudia eficacia

- Registrar hipótesis y criterios previos; usar medidas apropiadas y voluntarias **fuera** del mecanismo actual de inferencia; consentimiento informado y resguardo de datos.
- Comparar con control de pausa breve y, si procede, instrumentos validados separados, sin tratar al propio algoritmo como verdad de referencia.
- Observar efectos adversos (más rumiación, culpabilidad, abandono, incomodidad) y diferencia entre grupos culturales/accesibilidad; no perseguir solo más sesiones.
- Una investigación que concluyera utilidad percibida no equivale a eficacia terapéutica ni habilita claims clínicos.

## 9. Registro abierto de supuestos/riesgos para seguimiento

| ID | Supuesto pendiente | Evidencia que faltaría | Decisión provisional |
|---|---|---|---|
| H-01 | Las preguntas indirectas ayudan a reflexionar sin invadir | Estudio cognitivo es-CL | Mantener preguntas originales suaves, omisión siempre disponible |
| H-02 | 25 s mejora la pausa sin elevar frustración | Prueba comparativa 20/25/30 s | 25 s configurable por release |
| H-03 | 3+1 es suficiente como experiencia de producto | Usabilidad + evaluación de utilidad y costes | Nunca añadir Q4 por retención |
| H-04 | La correspondencia opción→dimensión es comprensible | Revisión experta/cognitiva de cada efecto | Efectos conservadores o [] |
| H-05 | Etiqueta positiva aporta valor sin falsear | Pruebas de lenguaje, falsos consensos | Solo umbrales estrictos y condicionales |
| H-06 | El patrón 3/5 produce invitaciones oportunas | Pruebas de daño/aceptabilidad, no claims clínicos | Texto neutro y cooldown |
| H-07 | Streak sin castigo no genera compulsión | Entrevistas y observación | Desactivado por defecto, opt-in |
| H-08 | Contenido de 180 preguntas evita monotonía 30 días | Simulación de cobertura + evaluación cualitativa | 180 con cuotas y bloqueo de 30 días |
| H-09 | SQLCipher + SecureStore cumple privacidad esperada | Auditoría builds/dispositivos/backup | Fail-closed, sin sync, explicación de límites |

## 10. Política de mantenimiento de evidencia y recursos

- Antes de cada release, verificar enlaces, números telefónicos, términos de licencia y posibles cambios normativos. Actualizar `consultedAt` y `lastVerifiedAt` por recurso con nombre del revisor.
- Nuevos estudios pueden modificar la **interpretación** del producto, pero no sus fórmulas en caliente: un cambio de engine requiere nueva versión de config, tests y nota explícita de no comparabilidad.
- Si existe un riesgo de daño claro, priorizar remover el copy o regla insegura incluso si afecta una métrica de uso; no prometer inferencia exacta por necesidades de marketing.
- Queda prohibido hacer claims de «aprobación OMS», «detección temprana», «prevención de suicidio», «predice tu ánimo», «precisión 85 %», «mejora clínicamente tu salud mental» o «terapia» sin evidencia específica y revisión regulatoria posterior.

**Conclusión de alcance:** el MVP es una **experiencia personal de autorreflexión, voluntaria y no clínica**. Su éxito inicial se mide por respeto, claridad, seguridad, privacidad y utilidad percibida; no por diagnosticar, tratar, vigilar emociones ni retener usuarios.
