# Caramelo · App Android

Aplicación móvil de **inventario y ventas** para un local de ropa, construida con **React Native + Expo** y basada en el backend de [caramelo_inventario](https://github.com/yunb12345/caramelo_inventario).

Es un cliente de la API existente (Fastify + PostgreSQL + JWT): no guarda datos de negocio en el teléfono. Necesita conexión con el servidor para consultar y registrar información.

## Funcionalidades

- **Panel**: ventas e ingresos del día y del mes, valor del stock, alertas de reposición y gráfico de los últimos 7 días.
- **Punto de venta**: búsqueda por nombre/SKU/color, lector de códigos de barras, carrito, edición de precio, descuento y medios de pago.
- **Productos**: listado con filtros por categoría y stock bajo, alta/edición, variantes por talle y color, SKU, código de barras, precio, costo y stock mínimo.
- **Ventas**: historial paginado por período (hoy, 7 días, 30 días, todas) y comprobante compartible.
- **Movimientos**: ingresos, egresos y ajustes de stock con motivo, referencia y auditoría por usuario.
- **Categorías**: alta, edición, color y eliminación.
- **Ajustes**: URL del servidor configurable, prueba de conexión y cierre de sesión.

## Requisitos

### Para la app

- Node.js 20 o superior y npm.
- Un teléfono Android con **Expo Go** (para probar sin compilar), o Android Studio / EAS para generar un APK.
- El teléfono y la computadora en la **misma red WiFi** (si la API corre localmente).

### Para el backend

- Node.js 22+ y pnpm 11.
- PostgreSQL 17 local o una base en Supabase.
- El repositorio [caramelo_inventario](https://github.com/yunb12345/caramelo_inventario).

## 1. Instalar la app

```bash
npm install
```

## 2. Levantar la API (opcional)

La app ya apunta a la API desplegada en Render, así que este paso solo es necesario si querés correr el backend en tu computadora.

En una copia del repositorio del backend:

```bash
pnpm install

# Windows (PowerShell)
Copy-Item apps/api/.env.example apps/api/.env
# macOS / Linux
cp apps/api/.env.example apps/api/.env
```

Editá `apps/api/.env`:

```env
DATABASE_URL="postgresql://caramelo:caramelo@127.0.0.1:5432/caramelo"
PORT=3001
HOST=0.0.0.0
JWT_SECRET="un-secreto-largo-y-aleatorio"
CORS_ORIGIN="http://localhost:5173"
ADMIN_NAME="Administrador"
ADMIN_EMAIL="admin@caramelo.local"
ADMIN_PASSWORD="caramelo123"
CURRENCY="ARS"
```

> `HOST=0.0.0.0` es importante para que el celular pueda acceder a la API por la red local.

Creá las tablas y los datos iniciales:

```bash
pnpm db:migrate
pnpm db:seed
```

Levantá la API:

```bash
pnpm dev:api
```

Verificá desde la computadora que responda:

```
http://localhost:3001/api/health
```

Debería devolver `{"ok":true,...}`.

Credenciales del seed:

- Email: `admin@caramelo.local`
- Contraseña: `caramelo123`

> Si cambiás `ADMIN_EMAIL` o `ADMIN_PASSWORD` en `.env`, el seed crea el usuario con esos valores.

## 3. Servidor de la API

La app apunta por defecto a la API desplegada en Render:

```
https://caramelo-api-tijm.onrender.com/api
```

No hace falta configurar nada: al abrir la app ya consulta ese servidor. La URL se puede revisar o cambiar desde:

- **Login → Servidor**, antes de iniciar sesión.
- **Más → Servidor**, con la sesión iniciada.

La app agrega `/api` automáticamente si no lo incluís y acepta HTTP o HTTPS.

> La instancia gratuita de Render se suspende cuando está inactiva. La primera petición puede tardar hasta un minuto en despertarla; la app espera hasta 60 segundos. Si falla, volvé a intentar.

### Usar un backend local (opcional)

| Entorno | URL |
| --- | --- |
| Emulador Android | `http://10.0.2.2:3001/api` |
| Teléfono físico (misma WiFi) | `http://IP-DE-LA-PC:3001/api` |

Podés cambiar la URL desde la pantalla **Servidor** o definirla al iniciar Expo:

```powershell
# Windows (PowerShell)
$env:EXPO_PUBLIC_API_URL="http://192.168.0.10:3001"
npm start
```

```bash
# macOS / Linux
EXPO_PUBLIC_API_URL=http://192.168.0.10:3001 npm start
```

### Obtener la IP de la PC

```powershell
ipconfig
```

Usá la dirección IPv4 de la interfaz WiFi, por ejemplo `192.168.0.10`. La URL queda:

```
http://192.168.0.10:3001/api
```

### Firewall de Windows

Si el celular no conecta, permití el puerto `3001` para Node.js:

```powershell
New-NetFirewallRule -DisplayName "Caramelo API" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

También podés probar desde el navegador del teléfono:

```
http://192.168.0.10:3001/api/health
```

Si esa URL no responde, el problema es de red/servidor, no de la app.

## 4. Ejecutar la app

```bash
npm start
```

- Escaneá el QR con **Expo Go** en Android.
- O presioná `a` para abrir el emulador Android.

En el login, la app ya viene apuntando a la API de Render. Solo abrí **Servidor** si querés usar otra dirección, tocá **Probar conexión** y luego iniciá sesión.

### Probar en el navegador (web)

El backend solo acepta CORS desde `https://caramelo-web.onrender.com`, así que el navegador bloquea las llamadas directas desde `http://localhost:8081`. Para desarrollo web usá:

```bash
npm run web
```

Ese comando levanta un proxy local en `http://localhost:3002/api` y abre Expo web con `EXPO_PUBLIC_API_URL` apuntando al proxy. El proxy agrega los headers CORS y reenvía todo al backend, sin modificar la API desplegada.

> En Android no hace falta el proxy: la app llama directo a Render.
> Para publicar la versión web, servila desde un origen incluido en `CORS_ORIGIN` del backend o detrás de un proxy del mismo origen.

### Probar el escaneo de códigos

El lector usa la cámara trasera. Para una prueba rápida:

1. Creá o editá un producto y asigná un código de barras a una variante (podés escanearlo con la cámara o escribirlo).
2. En **Vender**, tocá el ícono de escaneo y apuntá al código.
3. Si el código existe y tiene stock, se agrega solo al carrito. Si no existe, se muestra un aviso.

## 5. Generar un APK

### Opción A: EAS Build (recomendada, no requiere Android SDK local)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

El perfil `preview` genera un **APK** instalable. El perfil `production` genera un **AAB** para Play Store.

La primera vez EAS va a pedir vincular el proyecto con tu cuenta de Expo (`eas init`). El `package` de Android ya está definido en `app.json` como `com.caramelo.inventario`.

### Opción B: Build local

Requiere **JDK 17** y el **Android SDK** instalados, con `ANDROID_HOME` configurado.

```bash
npm run prebuild
npm run build:android:local
```

En Windows el APK queda en `android/app/build/outputs/apk/release/`. En este proyecto no se pudo compilar localmente porque el entorno no tenía Java ni Android SDK; EAS o Expo Go son las alternativas inmediatas.

> También podés generar el proyecto nativo con `npx expo run:android` si tenés Android Studio.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm start` | Inicia Metro/Expo |
| `npm run web` | Expo web + proxy local contra la API (evita CORS) |
| `npm run android` | Abre Expo en un emulador Android |
| `npm run typecheck` | Verifica TypeScript sin emitir archivos |
| `npm run prebuild` | Genera las carpetas nativas `android`/`ios` |
| `npm run build:android:local` | Prebuild + APK release local (requiere JDK/SDK) |
| `npm run build:android:apk` | APK con EAS (perfil `preview`) |

## Estructura

```
├── App.tsx                     Providers (Query, Auth, Toast) y navegación
├── app.json                    Configuración Expo/Android, permisos y splash
├── eas.json                    Perfiles de compilación
├── index.ts                    Entry point de Expo
├── assets/                     Íconos, splash y favicon
└── src/
    ├── api/client.ts           Cliente HTTP, URL configurable, token y errores
    ├── auth/AuthContext.tsx    Sesión, login/logout y cambio de servidor
    ├── components/             UI base, modales, escáner, toasts y gráfico
    ├── constants.ts            Medios de pago, tipos de movimiento, talles
    ├── lib/                    Formato de moneda/fechas, helpers y querystring
    ├── navigation/             Stack raíz + tabs y tipos de rutas
    ├── screens/                Panel, POS, Productos, Ventas, Movimientos, etc.
    ├── theme.ts                Colores, tipografía, espaciados y sombras
    └── types.ts                DTOs y payloads de la API
```

## Notas y limitaciones

- **No funciona offline**: todas las operaciones requieren la API encendida.
- Los datos de sesión (token y URL) se guardan con AsyncStorage; el logout los elimina.
- El backend usa **un único usuario administrador** (no hay roles ni multiusuario con permisos diferenciados).
- La moneda está fijada en **ARS** (`src/constants.ts`).
- El tráfico HTTP sin TLS está permitido mediante `expo-build-properties` para desarrollo. Para producción usá **HTTPS** y quitá `usesCleartextTraffic`.
- El stock solo cambia por movimientos o ventas; editar una variante no permite modificar el stock directamente.

## Problemas frecuentes

| Problema | Solución |
| --- | --- |
| "No se pudo conectar con el servidor" | Revisá tu conexión a internet y que la URL mostrada en **Servidor** termine en `/api`. La instancia gratuita de Render puede tardar ~1 minuto en despertar. |
| En el navegador no conecta | El backend no permite CORS desde `localhost`. Usá `npm run web` (levanta el proxy local). |
| El emulador no conecta con un backend local | Usá `http://10.0.2.2:3001/api` (no `localhost`). |
| El celular no conecta con un backend local | Usá la IP LAN de la PC, misma WiFi, y `HOST=0.0.0.0` en la API. |
| "Email o contraseña incorrectos" | Revisá `ADMIN_EMAIL`/`ADMIN_PASSWORD` y volvé a ejecutar `pnpm db:seed`. |
| La cámara no escanea | Concedé el permiso de cámara desde Ajustes de Android y verificá que haya luz. |
| `npm start` pide elegir conexión | Elegí **LAN** para probar en un teléfono físico. |
