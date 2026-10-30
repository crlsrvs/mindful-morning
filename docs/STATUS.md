# Estado y continuidad del proyecto

Actualizado: 2026-10-30. Punto de entrada para cualquier asistente que retome Mindful Morning. Contrastar siempre este resumen con los archivos y comprobaciones actuales.

## Situación actual

Versión de prueba funcional avanzada en Android. El recorrido principal está implementado y hay evidencia automatizada y física inicial. La app todavía no está lista para distribución pública: quedan revisión humana, accesibilidad y pruebas nativas. Tener el código en GitHub no equivale a haber publicado la app.

- Catálogo: `1.0.0-draft.3`, 180 preguntas, 720 respuestas, 82 reflexiones y nueve familias.
- Hash: `81fbcfb1985a89a6e15a37059385ee118d91b9dac6eb78bbaed8c89b8fa3838c`.
- Expo 58.0.19, React Native 0.88.0, React 19.3.0 y TypeScript 7.0.2. Mantener las versiones compatibles fijadas en package.json y package-lock.json.
- Una app en la raíz del repositorio; sin backend, cuentas, analítica ni IA durante el uso.
- Android ARM64 compilado e instalado en emulador y Samsung Galaxy S20 SM-G980F con Android 10. Se usa development build con SQLCipher; Expo Go no sirve.
- iOS generado, sin compilación verificada: faltan Xcode completo y CocoaPods en el entorno observado.
- Git: rama main; remoto https://github.com/crlsrvs/mindful-morning. Consultar Git para conocer el último commit y su sincronización; este documento no fija el hash del commit que lo contiene.

## Trabajo terminado

- Bienvenida simplificada, inicio, sesión, cierre, configuración, límites/privacidad y apoyo.
- Motor determinista: tres preguntas y cuarta condicionada, omisión inmediata, espera de 25 segundos en primer plano, cooldown y sesión por fecha local en producción.
- SQLite cifrado, clave en SecureStore, snapshots, transacciones y recuperación; existe evidencia inicial de cifrado, no una auditoría nativa completa.
- Reformulación autorizada del tono de las 180 preguntas y 567 respuestas; las 153 respuestas ya claras se conservaron. Efectos, IDs, orden y cobertura intactos. No volver a generar ni reformular el catálogo sin una nueva petición.
- Modo de prueba local autorizado e implementado, solo con __DEV__, aviso visible y almacenamiento separado private-preview.
- «Iniciar otra prueba» implementado en Inicio/Cierre solo en modo local. Esquema de prueba v2 admite varias sesiones por día con UUID y seed propios, conserva historial y excluye preguntas ya expuestas según cooldown. Nunca sustituye una sesión activa. Producción conserva esquema v1 y fecha única.
- Simulación anual sobre el motor TypeScript implementada y ejecutada por Gemini el 28-10-2026: 1.000 semillas × 365 días en decisión y otras 1.000 × 365 en estrés de cuatro exposiciones/día. La suite rápida también la ejecuta con 16 semillas.

## Decisiones vigentes del propietario

- Leer completamente docs/ y revisar/validar content/ antes de implementar. Los cinco documentos originales se preservan: PRD, ARCHITECTURE, DECISION_ENGINE, CONTENT_SPEC y EVIDENCE_AND_LIMITATIONS.
- Textos de preguntas aceptados por muestra; nuevo estilo aprobado con autorización de aplicación al resto. Reflexiones aprobadas editorialmente tras suavizar el lenguaje. No atribuir lectura individual completa ni revisión clínica.
- La bienvenida dice «No hay respuestas incorrectas»; privacidad breve y una acción principal por paso.
- El modo de prueba local ya está autorizado. No volver a solicitar esa autorización ni falsificar estados de calidad para habilitarlo.
- No responder preguntas ni elegir omisiones por el propietario. No cambiar fechas ni borrar datos para facilitar ensayos.
- Conservar herramientas, cachés y emulador. La autorización posterior de limpieza se refiere a documentación redundante; no extiende el permiso a datos, contenido o herramientas.
- No publicar un binario ni eludir el gate de release. Código MIT; catálogo editorial reservado según LICENSE.
- No incluir rutas personales del equipo, identificadores del teléfono, claves, correos personales ni respuestas del usuario en documentos publicados.

## Evidencia y límites de las pruebas

Reejecutado por Codex el 30-10-2026: npm run check (estructura/configuración, TypeScript, 40 pruebas en siete suites), content:test (12 pruebas), format:check e integridad correctos. Total: 52 pruebas. Integridad: 45 archivos de content/, cinco originales intactos y hash canónico correcto. La simulación completa de 1.000 semillas está documentada desde el 28; no se volvió a ejecutar el 30, solo la variante rápida de la suite.

Prueba física del 30-10-2026: arranque, inicio de sesión, alternativas bloqueadas durante la espera, pausa tras al menos 30 segundos en segundo plano, habilitación en primer plano, acceso inmediato a omisión/apoyo, recuperación de la misma pregunta y espera ya cumplida después de force-stop, y acceso a apoyo/regreso. Ver detalles y límites en VERIFICATION.md.

Último estado observado del Samsung: Pregunta 1 de 3 «Imagina una pausa antes de pasar a lo siguiente. ¿Cómo te sentirías en ese momento?», alternativas habilitadas, sin respuestas ni omisiones ejecutadas por el asistente. No asumir que esta pantalla sigue abierta: comprobarla antes de interactuar. El cambio de fecha puede expirar esa sesión por diseño.

Metro se inició offline en el puerto 8082 y se redirigió por USB. Tras force-stop, el cliente de desarrollo requirió reconexión a Metro mediante deep link. Procesos y permisos pueden haber cambiado al retomar; no son evidencia de funcionamiento independiente de Metro.

## Pendientes por orden recomendado

1. Completar el recorrido en el Samsung con respuestas del propietario; evaluar claridad, legibilidad, cierre y la acción «Iniciar otra prueba». Está implementada y tiene pruebas automatizadas, pero no se completó una segunda sesión física en el bloque del 30-10-2026.
2. Pruebas nativas: recuperación durante escrituras y checkpoints, segundo plano/pérdida de foco, notificaciones permitidas/denegadas, horarios, cambio de día/zona y modo offline de un binario independiente. No confundir la recuperación básica ya verificada con durabilidad ante cualquier interrupción.
3. TalkBack, fuente ampliada, navegación y comprensión con personas. La escala del sistema observada fue 1.0; desplazarse hasta los botones no constituye auditoría de accesibilidad.
4. Revisión de interpretación/efectos, originalidad, similitudes y demás entidades del catálogo: ver REMAINING_CONTENT_REVIEW.md y EFFECTS_FOR_REVIEW.md. No volver a pedir aprobación del tono ya aceptado.
5. Pruebas destructivas de borrado/pérdida de clave solo con datos de prueba y autorización correspondiente; completar verificación nativa de DB/WAL/SHM, SecureStore y backup.
6. Revisar los avisos de dependencias documentados con información vigente y soluciones compatibles; no forzar actualizaciones mayores para obtener un audit limpio.
7. Completar aprobaciones reales, release:check, firma y pruebas del binario de producción: privacidad, cifrado, backup, permisos y ausencia de tráfico inesperado. Después, iOS cuando haya herramientas; no distribuir sin instrucción explícita.

La publicación sigue bloqueada: quality.status conserva draft y el gate registra 547 diagnósticos de aprobación pendientes. Pasar tests o aprobar el tono no sustituye las revisiones restantes. La prioridad puede cambiar con la siguiente petición del propietario.

## Retomar y comprobar

Leer README, este archivo, el resto de docs/ y las guías/datasets de content/. Inventariar herramientas, dispositivo y estado Git antes de instalar o ejecutar prebuild. El development build existente puede servir sin recompilar cambios de texto/JavaScript. En el equipo del propietario se solicita prefijar comandos de terminal con rtk; si no existe en otro entorno, informar de ello y usar equivalentes disponibles.

```sh
git status -sb
node --version
npm run check
npm run content:test
npm run content:integrity
npm run format:check
adb devices -l
```

Para retomar el teléfono, ver LOCAL_TESTING.md. Si una herramienta no está disponible, continuar con tareas independientes y documentar lo que no se pudo verificar. No reinstalar dependencias ni regenerar Android/iOS por cambiar de asistente.

Mapa rápido: app/ contiene pantallas; src/application/coordinator.ts coordina sesiones; src/domain/engine/ contiene el motor; src/domain/session/timer.ts mide primer plano; src/infrastructure/ contiene catálogo, SQLCipher y repositorio; tests/engine-simulation.ts simula el motor; scripts/release-gate.mjs y plugins/ protegen publicación.

## Fuentes de verdad y mantenimiento

- content/manifest.json, questions.json y reflections.json: versión y textos actuales.
- content/human-review.json, reflection-human-review.json, question-tone-review.json y review-log.json: autorizaciones e historial. Conservarlos sin reetiquetar evidencias históricas.
- content/signal-rationales.json y docs/EFFECTS_FOR_REVIEW.md: textos, efectos y fundamentos.
- content/checksums.json y reference-integrity.json: integridad exacta; no regenerarlos para ocultar cambios.
- VERIFICATION.md: evidencia cronológica; sus secciones antiguas describen estados de su fecha.
- IMPLEMENTATION.md, DEVELOPMENT.md y LOCAL_TESTING.md: decisiones técnicas, herramientas y conexión.

Al terminar cada bloque, actualizar este archivo con el estado, límites y próximo paso; añadir pruebas reales a VERIFICATION.md. Mantener la continuidad necesaria en archivos versionados, sin depender del chat, /tmp o archivos ignorados. Esta guía reemplaza las copias locales de traspaso y las muestras intermedias eliminadas el 30-10-2026; la evidencia editorial literal se conserva en content/.

Prompt breve para cualquier IA:

> Continúa Mindful Morning desde docs/STATUS.md. Lee la documentación y valida content/ antes de implementar. Contrasta el estado con los archivos actuales, conserva decisiones y aprobaciones, y retoma la siguiente tarea pendiente según mi instrucción. No respondas por mí ni borres datos para probar. Documenta cambios, comprobaciones y próximos pasos para que otra IA pueda continuar. Si no tienes acceso al repositorio o al terminal, indícalo.
