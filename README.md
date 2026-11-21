# Crowdfunding Platform Frontend

Interfaz web de la plataforma de Crowdfunding (CodeFactory UdeA), construida con **React 19**, **TypeScript**, **Vite** y **Tailwind CSS**. Está pensada para conectarse al backend REST (Spring Boot + JWT + PostgreSQL/Supabase).

---

## Estado Actual

Este repositorio ya incluye:

- Registro de usuarios e inicio de sesión con validación de contraseña (HU-01, HU-02).
- Edición de perfil con confirmación de contraseña (HU-03).
- Recarga de saldo virtual con rango de 10.000 a 1.000.000 (HU-04).
- Panel principal con saldo, historial de movimientos y estadísticas según el rol (HU-05).
- Publicación de campañas con imágenes, recompensas y PIN de seis dígitos (HU-06).
- Edición de campañas activas con bloqueo de meta y fecha límite cuando hay aportes (HU-07).
- Pausar y cerrar campañas; el cierre requiere contraseña de cuenta y PIN, con notificaciones en la interfaz (HU-08).
- Exploración, búsqueda, filtro por categoría y ordenamiento de campañas (HU-09).
- Aportes con selección de recompensa, control de stock y comprobante de contribución (HU-10, HU-11, HU-12).
- Vista de administrador sobre las campañas de toda la plataforma.
- Gestión de usuarios para administrador mediante API: listado, creación, edición y cambio de estado (HU-21).
- Contraseña de la cuenta para editar el perfil, aportar y cerrar campañas, validada por el servidor (HU-S01, HU-S05, HU-S06).
- PIN de campaña validado por el servidor al publicar, editar y cerrar (HU-S02 a HU-S05), con bloqueo tras intentos fallidos (HU-S07).
- Notificaciones de hitos de financiación desde el servidor (HU-15).
- Recaudo por campaña con lista de patrocinadores y filtros (HU-14), historial de aportes (HU-16), registro de transacciones para el admin (HU-17) y reportes de campañas activas y de fondos por periodo (HU-18, HU-19).
- Preferencias de tamaño de texto y tema claro, oscuro o según el sistema, guardadas en el dispositivo y, con una cuenta real, en el servidor (HU-22, HU-23). El cambio de idioma (opcional) no está implementado.
- Rutas protegidas para usuarios autenticados.

> **Integración con el backend.** El frontend consume los servicios de autenticación, perfil, billetera, categorías, campañas, aportes, notificaciones y administración. El PIN de campaña y las contraseñas de confirmación los valida el servidor; el navegador no guarda PIN. Las cuentas de demostración conservan sus datos locales.

---

## Stack Técnico

- **React** 19
- **TypeScript** 5.7
- **Vite** 8 (con `@vitejs/plugin-react`)
- **Tailwind CSS** 4 (`@tailwindcss/vite`) y hojas de estilo por página (`*.css`)
- **React Router** 8 (`createBrowserRouter`)
- **lucide-react** (iconos)
- **axios** (cliente HTTP de `src/api`)
- **oxfmt** (formateo de código)
- **pnpm** (gestor de paquetes; el repositorio incluye `pnpm-lock.yaml` y `package-lock.json`)
- Proyecto generado a partir de **Figma Make** (configuración en `.figma/make`)

---

## Estructura Principal

```
src
├── api/             # Cliente axios (JWT) y módulos auth, users, campaigns, categories, contributions, notifications, reports, admin, mappers
├── context/         # UserContext (sesión, saldo, campañas, aportes, administración) y PreferencesContext (tema y tamaño de texto)
├── lib/             # Utilidades (moneda y fechas), validaciones y cuentas de demostración
├── pages/           # Vistas: Auth, Explore, CampaignDetail, CampaignForm, Dashboard,
│                    #         MyCampaigns, Wallet, Profile, Notifications, Users, PanelLayout
├── routes.tsx       # Definición de rutas y guardas RequireAuth / RequireAdmin
├── App.tsx
├── main.tsx
└── index.css
```

El alias `@` apunta a `src`.

---

## Requisitos Previos

- **Node.js** 22 o superior compatible con las versiones instaladas de Vite y React Router (se recomienda una versión LTS actualizada).
- **pnpm** (o npm)
- **Backend en ejecución** (por defecto en `http://localhost:8081`): necesario para registrarse y usar cuentas reales. Las [cuentas de demostración](#cuentas-de-demostración) funcionan sin backend. Ver el README del repositorio del backend.

---

## Variables y Configuración

Opcionalmente, crear un archivo `.env` en la raíz para cambiar la URL del backend:

```bash
VITE_API_URL="http://localhost:8081"
```

| Variable | Uso | Valor por defecto |
|----------|-----|-------------------|
| `VITE_API_URL` | URL base del backend (sin `/api`) | `http://localhost:8081` |
| `PORT` | Puerto del servidor de desarrollo | `8443` |

El backend debe permitir CORS para el origen del frontend. No subir archivos `.env` al repositorio.

---

## Ejecutar Proyecto

```bash
# Instalar dependencias
pnpm install

# Modo desarrollo
pnpm dev
```

Con npm:

```bash
npm install
npm run dev
```

La aplicación queda disponible en:

- **Frontend:** `http://localhost:8443` (puerto por defecto; se cambia con la variable `PORT`)

El servidor usa `strictPort`: si el puerto está ocupado, falla en lugar de elegir otro.

### Cuentas de demostración

Permiten probar la interfaz sin backend. Sus datos (saldo, historial, perfil) se guardan solo en el navegador.

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Patrocinador | `test@example.com` | `Demo1234!` |
| Patrocinador | `user@catalyst.com` | `Demo1234!` |
| Administrador | `admin@catalyst.com` | `Admin1234!` |

Estos correos están reservados: nunca se consultan en el backend. Las cuentas de demostración mantienen datos locales; las cuentas creadas mediante la API de administración utilizan el backend. Las operaciones de campañas y aportes requieren los servicios correspondientes. Para usar datos reales, regístrate en `/auth` (contraseña de 8 a 16 caracteres, con 1 mayúscula, 1 número y 1 carácter especial) o inicia sesión con una cuenta existente en el backend.

---

## Rutas de la Aplicación

### Públicas

| Ruta | Descripción | HU |
|------|-------------|----|
| `/` | Explorar campañas: búsqueda, filtro por categoría y ordenamiento | HU-09 |
| `/campanas/:id` | Detalle de campaña, recompensas y aporte | HU-09, HU-10, HU-11, HU-12 |
| `/auth` | Registro e inicio de sesión | HU-01, HU-02 |

| `/preferencias` | Tamaño de texto (Normal, Grande, Extra grande) y tema (claro, oscuro o según el sistema); funciona también sin sesión | HU-22, HU-23 |

`/explorar` y cualquier ruta desconocida redirigen a `/`.

### Protegidas (requieren sesión)

| Ruta | Descripción | HU |
|------|-------------|----|
| `/dashboard` | Panel principal: saldo, estadísticas y actividad | HU-05 |
| `/perfil` | Editar nombre y correo | HU-03 |
| `/billetera` | Recargar saldo e historial de movimientos | HU-04, HU-05 |
| `/mis-campanas` | Gestión de campañas propias (pausar/cerrar); el administrador ve todas | HU-08 |
| `/campanas/nueva` | Publicar campaña | HU-06 |
| `/campanas/:id/editar` | Editar campaña activa (solo el creador o un administrador) | HU-07 |
| `/notificaciones` | Notificaciones del servidor, como los hitos de financiación | HU-15 |
| `/historial` | Historial de aportes: fecha, campaña (enlace), monto, recompensa, estado actual de la campaña y total acumulado | HU-16 |
| `/campanas/:id/recaudo` | Recaudo de una campaña propia y lista de patrocinadores, filtrable por patrocinador o recompensa | HU-14 |
| `/reportes` | Campañas activas con alerta (5 días o menos y menos del 50 %) y fondos recaudados por periodo; el creador ve las suyas y el admin todas | HU-18, HU-19 |

### Solo administrador

| Ruta | Descripción | HU |
|------|-------------|----|
| `/usuarios` | Listado, filtros, creación, edición, deshabilitación y eliminación de usuarios | HU-21 |
| `/transacciones` | Registro de transacciones de solo lectura, filtrable por fechas, tipo y usuario | HU-17 |

Si el usuario no ha iniciado sesión, `RequireAuth` lo redirige al inicio de sesión. Si no es administrador, `RequireAdmin` muestra un aviso de acceso restringido.

---

## Roles

El rol llega desde el backend al iniciar sesión:

- `sponsor`: patrocinador (rol por defecto).
- `creator`: creador de campañas.
- `admin`: administrador; puede editar y cambiar el estado de cualquier campaña, ve las métricas de toda la plataforma y gestiona usuarios en `/usuarios`.

En la interfaz actual cualquier usuario autenticado puede publicar campañas y aportar; el rol se muestra en el panel principal.

---

## Funcionalidades por Historia de Usuario

### Cuentas y billetera (HU-01 a HU-05)

- **Registro:** nombre, correo y contraseña (8-16 caracteres, mínimo 1 mayúscula, 1 número y 1 carácter especial). Mensaje de confirmación y error si el correo ya existe.
- **Login:** acceso al panel con correo y contraseña; error si la contraseña es incorrecta.
- **Perfil:** edición de nombre y correo con validación de campos obligatorios y confirmación de contraseña.
- **Recarga de saldo:** monto entre 10.000 y 1.000.000; se rechazan montos fuera del rango.
- **Saldo:** el creador ve los fondos recaudados por campaña; el patrocinador ve el total aportado y el detalle por campaña. Se actualiza tras cada aporte y se puede consultar el historial de movimientos.

### Campañas (HU-06 a HU-09)

- **Publicar:** título, descripción, categoría, meta, fecha límite posterior a hoy, hasta 4 imágenes y hasta 6 recompensas opcionales con monto mínimo y unidades disponibles; PIN de seis dígitos con confirmación.
- **Editar:** si la campaña ya recibió aportes, meta y fecha límite quedan bloqueadas; las recompensas se muestran en solo lectura y no son editables. Se requiere el PIN de campaña.
- **Pausar/cerrar:** una campaña pausada muestra su etiqueta y no admite aportes; al cerrarla se bloquean los aportes de forma permanente y se generan notificaciones locales. El cierre requiere contraseña de cuenta y PIN.
- **Explorar:** búsqueda por nombre, filtro por categoría y orden por popularidad, fecha límite o mayor recaudo; mensaje cuando no hay resultados.

### Aportes (HU-10 a HU-12)

- **Aporte:** monto mayor a cero y no superior al saldo; si el saldo es insuficiente se sugiere recargar. Se confirma la contraseña antes de enviar el aporte.
- **Recompensas:** solo seleccionables si el monto alcanza el mínimo; las agotadas se muestran deshabilitadas y se descuenta una unidad de stock al confirmar.
- **Comprobante:** resumen de la transacción con campaña, monto, recompensa y saldo restante.
- **Errores:** se informa el fallo de la operación; la casilla de simulación de error se retiró de la interfaz.

### Administración de usuarios (HU-21)

- **Listado:** nombre, correo, rol (Patrocinador / Creador / Administrador) y estado (Activo / Inactivo), con búsqueda y filtros.
- **Crear:** nombre, correo, rol y contraseña (8-16 caracteres, 1 mayúscula, 1 número y 1 carácter especial). El usuario creado puede iniciar sesión.
- **Editar:** nombre, correo y rol; se rechazan campos vacíos y correos que ya pertenecen a otro usuario.
- **Deshabilitar / eliminar:** las cuentas reales se deshabilitan mediante el endpoint de estado; no existe una operación DELETE en el cliente de administración. La eliminación local corresponde a datos de demostración. Una cuenta inactiva no puede iniciar sesión.
- **Permisos:** solo los administradores acceden al módulo, y un administrador no puede deshabilitar ni eliminar su propia cuenta ni quitarse el rol.

> La administración de cuentas reales utiliza `admin.ts`; los roles y estados se conservan según los datos del servidor.

---

## Integración con el Backend

La capa `src/api` consume el backend con axios (`baseURL` = `VITE_API_URL` + `/api`):

Las rutas de la tabla son relativas al prefijo `/api`.

| Módulo | Endpoints | Estado |
|--------|-----------|--------|
| `auth.ts` | POST /auth/register, POST /auth/login | Integrado |
| `users.ts` | GET /users/balance, PUT /users/profile, POST /users/recharge | Integrado |
| `users.ts` | GET /users/preferences, PUT /users/preferences (HU-22, HU-23) | Integrado |
| `categories.ts` | GET /categories, POST /categories | Cliente implementado |
| `campaigns.ts` | GET /campaigns, GET /campaigns/mine, GET /campaigns/{id}, POST /campaigns, PUT /campaigns/{id}, PATCH /campaigns/{id}/status | Integrado |
| `campaigns.ts` | GET /campaigns/{id}/earnings (HU-14) | Integrado |
| `campaigns.ts` | GET /campaigns/contributions/summary (HU-14) | Cliente implementado; el panel calcula el resumen con el historial |
| `contributions.ts` | POST /campaigns/{id}/contributions/confirm | Integrado |
| `contributions.ts` | GET /contributions/history (HU-16) | Integrado |
| `notifications.ts` | GET /notifications, PATCH /notifications/{id}/read, PATCH /notifications/read-all (HU-15) | Integrado |
| `reports.ts` | GET /reports/active-campaigns, GET /reports/funds-by-period (HU-18, HU-19) | Integrado |
| `admin.ts` | GET /admin/users, GET /admin/users/{id}, POST /admin/users, PUT /admin/users/{id}, PATCH /admin/users/{id}/status | Integrado |
| `admin.ts` | GET /admin/transactions (HU-17) | Integrado |

Comportamiento:

- El token se guarda en `localStorage` y se envía como Authorization Bearer.
- Un 401 fuera de las rutas de autenticación cierra la sesión y redirige a /auth.
- Los errores del servidor se presentan mediante message o details.
- Sin sesión, la página de exploración carga las campañas públicas del servidor.
- El historial y el saldo salen del servidor; los movimientos locales solo existen en las cuentas de demostración.

### Contraseñas y PIN de campaña

El servidor valida todas las credenciales; el frontend solo las envía en la misma petición de la operación:

| Operación | Campos enviados | HU |
|-----------|-----------------|----|
| Publicar campaña (POST /campaigns) | `pin` (6 dígitos; el formulario pide confirmarlo) | HU-S02 |
| Editar campaña (PUT /campaigns/{id}) | `pin` de esa campaña | HU-S03, HU-S04 |
| Cerrar campaña (PATCH /campaigns/{id}/status con `CLOSED`) | `pin` y `password` | HU-S05 |
| Aportar (POST /campaigns/{id}/contributions/confirm) | `password` | HU-S06 |
| Editar perfil (PUT /users/profile) | `password` | HU-S01 |

- Si algún dato es incorrecto, el servidor responde con un mensaje genérico que no revela cuál falló.
- Tras 5 intentos fallidos la verificación queda bloqueada durante unos minutos (HU-S07); el servidor responde 429 y la interfaz muestra su mensaje con el tiempo de espera.
- El servidor solo guarda el hash del PIN, así que no se puede consultar ni mostrar después de publicarlo.

---

## Comandos Útiles

```bash
# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Vista previa del build
pnpm preview

# Formatear código
pnpm format
```

Con npm usar `npm run <script>`.

---

## Licencia

MIT — Uso académico CodeFactory UdeA.
