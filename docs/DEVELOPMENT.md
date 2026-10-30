# Desarrollo Android y preparación iOS

Estado actual: [STATUS.md](STATUS.md). El inventario siguiente es histórico; comprobar disponibilidad antes de instalar. Android compiló correctamente tras liberar espacio el 26-10-2026 y las pruebas en Samsung continuaron el 30-10-2026.

## Inventario observado el 25-10-2026

| Herramienta | Estado |
|---|---|
| Node.js | 24.17.0 LTS |
| npm | 11.13.0 |
| TypeScript | 7.0.2 local al proyecto |
| Expo | 58.0.19 estable, con React Native 0.88.0 y React 19.3.0 según `expo install` |
| Android Studio | `/Applications/Android Studio.app` existe |
| Java/Javac | Zulu OpenJDK 17.0.21 |
| Android SDK | `~/Library/Android/sdk` |
| Platforms | android-36, extensiones 18/19, android-37.0 |
| Build tools | 36.0.0 y 37.0.0 |
| adb/emulator | Disponibles en PATH |
| AVD | `Medium_Phone_API_37.0` listado; no se inició ni verificó en ejecución |
| sdkmanager | No disponible en PATH; usar SDK Manager de Android Studio |
| watchman | Instalado |
| Xcode | No hay Xcode completo seleccionado; solo CommandLineTools |
| CocoaPods | `pod` no encontrado en PATH |
| Gradle | Wrapper 9.4.1 descargado; dependencias incompletas por falta de disco |

Versiones fijadas mediante `package-lock.json`; usar `npm ci`. No se usaron canary/beta. [Release oficial SDK 58](https://expo.dev/changelog/sdk-58) y [SQLite/SQLCipher](https://docs.expo.dev/versions/latest/sdk/sqlite/).

## Android, primera ejecución

1. Mantener varios GB de espacio libre. El primer intento se interrumpió por ENOSPC; tras liberar espacio el propietario, la compilación del 2026-10-26 terminó correctamente.
2. Instalar Node 24 (`nvm use`) y JDK 17. Configurar `JAVA_HOME` según la instalación local.
3. Abrir Android Studio → SDK Manager. Instalar la plataforma, Build Tools, Platform Tools, NDK y CMake que solicite Gradle. La configuración generada de Expo determina las versiones exactas.
4. Configurar en el shell:

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

5. Abrir Device Manager e iniciar un AVD, o conectar un teléfono con depuración USB y autorizarlo. Verificar con `adb devices`.
6. Desde **la raíz mindful-morning**:

```sh
npm ci
npm run check
npx expo prebuild --platform android --no-install
npm run android
```

`npm run android` compila el development build con SQLCipher. No usar Expo Go para datos reales. Para compilar sin ejecutar emulador:

```sh
cd android
./gradlew :app:assembleDebug --no-daemon -PreactNativeArchitectures=arm64-v8a
```

Seleccionar la arquitectura que corresponda al dispositivo. Este comando terminó correctamente el 2026-10-26 y produjo `android/app/build/outputs/apk/debug/app-debug.apk`. Se instaló en el emulador existente API 37. Su partición predeterminada de 12 GB no cabía; se pudo arrancar con `emulator -avd Medium_Phone_API_37.0 -partition-size 4096 -no-snapshot-save -no-boot-anim`, sin borrar archivos existentes.

## Release Android

Antes de firma/publicación: contenido aprobado, `npm run release:check`, pruebas de dispositivo y auditoría de privacidad. El plugin instala `validateMorningReleaseContent` como dependencia de `preReleaseBuild`, por lo que un corpus draft bloquea la compilación release. Preparar una llave de firma propia fuera del repositorio; no distribuir con la llave debug del template. No se configuraron cuentas, EAS ni publicación.

## iOS

Se generó el proyecto con `npx expo prebuild --platform ios --no-install` y se verificó la inyección del ajuste de backup. No equivale a compilar o probar iOS.

Instalar Xcode completo compatible con RN 0.88/Expo 58, seleccionarlo con `xcode-select`, aceptar licencia, instalar runtimes de simulador y CocoaPods. Luego:

```sh
npm ci
npx expo prebuild --platform ios
npm run ios
```

Revisar firma y bundle identifier `cl.mindfulmorning.app` antes de dispositivo físico. Validar Keychain después de reinstalar, exclusión de Documents de iCloud backup, SQLCipher real, permisos/notificación DAILY, safe areas, fuente grande y VoiceOver. El flag de export compliance debe revisarse con los requisitos de distribución aplicables antes de App Store; no se envió ninguna declaración a Apple.

## Red y desarrollo

Metro/npm/Gradle realizan tráfico de desarrollo. El producto no incorpora cliente backend, tokens push, fetch ni servicios de analítica. Las notificaciones son locales y abrir una fuente oficial es una acción explícita del usuario. Verificar ausencia de tráfico iniciado por la app en un binario release real; el bundle estático y el análisis del código no sustituyen esa prueba.

## Preferencia de limpieza · 2026-10-28

El propietario pidió conservar por ahora todas las herramientas y archivos. No borrar sin una nueva instrucción. Candidatos identificados para una limpieza futura: AVD y sus datos (~2,6 GB), imagen Android 37 (~2,6 GB), ejecutable del emulador (~1,2 GB) y caché npm (~2,6 GB). Son tamaños observados, no espacio garantizado a recuperar. Conservar las herramientas de compilación y ADB para pruebas con el Samsung Galaxy S20 SM-G980F, Android 10, ARM64.
