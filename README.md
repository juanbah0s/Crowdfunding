# Crowdfunding Platform Frontend

Interfaz web de la plataforma de Crowdfunding (CodeFactory UdeA), construida con **React 19**, **TypeScript**, **Vite** y **Tailwind CSS**. Está pensada para conectarse al backend REST (Spring Boot + JWT + PostgreSQL/Supabase).

---

## Estado Actual

Este repositorio ya incluye:

- Registro de usuarios e inicio de sesión con validación de contraseña (HU-01, HU-02).
- Edición de perfil (HU-03).
- Recarga de saldo virtual con rango de 10.000 a 1.000.000 (HU-04).
- Panel principal con saldo, historial de movimientos y estadísticas según el rol (HU-05).
- Publicación de campañas con imágenes y recompensas (HU-06).
- Edición de campañas activas con bloqueo de meta y fecha límite cuando hay aportes (HU-07).
- Pausar y cerrar campañas, con notificaciones a los patrocinadores (HU-08).
- Exploración, búsqueda, filtro por categoría y ordenamiento de campañas (HU-09).
- Aportes con selección de recompensa, control de stock y comprobante de contribución (HU-10, HU-11, HU-12).
- Vista de administrador sobre las campañas de toda la plataforma.
- Rutas protegidas para usuarios autenticados.

> **Integración parcial con el backend.** El registro, el inicio de sesión (JWT), la edición de perfil, la recarga de saldo y la consulta de saldo/historial usan el backend real. Las campañas, los aportes con recompensa, el comprobante y las notificaciones siguen simulados en el navegador (`localStorage`) hasta conectar los endpoints `/api/campaigns`. Ver [Integración con el Backend](#integración-con-el-backend).

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
├── api/             # Cliente axios (JWT) y módulos del backend: auth, users, mappers
├── context/         # UserContext: sesión y saldo (backend) + campañas y aportes simulados
├── lib/             # Utilidades (formato de moneda y fechas) y cuentas de demostración
├── pages/           # Vistas: Auth, Explore, CampaignDetail, CampaignForm, Dashboard,
│                    #         MyCampaigns, Wallet, Profile, Notifications, PanelLayout
├── routes.tsx       # Definición de rutas y guarda RequireAuth
├── App.tsx
├── main.tsx
└── index.css
```

El alias `@` apunta a `src`.

---

## Requisitos Previos

- **Node.js** 22 o superior
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

Estos correos están reservados: nunca se consultan en el backend. Para usar datos reales, regístrate en `/auth` (contraseña de 8 a 16 caracteres, con 1 mayúscula, 1 número y 1 carácter especial) o inicia sesión con una cuenta existente en el backend.

---

## Rutas de la Aplicación

### Públicas

| Ruta | Descripción | HU |
|------|-------------|----|
| `/` | Explorar campañas: búsqueda, filtro por categoría y ordenamiento | HU-09 |
| `/campanas/:id` | Detalle de campaña, recompensas y aporte | HU-09, HU-10, HU-11, HU-12 |
| `/auth` | Registro e inicio de sesión | HU-01, HU-02 |

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
| `/notificaciones` | Notificaciones del usuario | HU-08 |

Si el usuario no ha iniciado sesión, `RequireAuth` lo redirige al inicio de sesión.

---

## Roles

El rol llega desde el backend al iniciar sesión:

- `sponsor`: patrocinador (rol por defecto).
- `creator`: creador de campañas.
- `admin`: administrador; puede editar y cambiar el estado de cualquier campaña y ve las métricas de toda la plataforma.

En la interfaz actual cualquier usuario autenticado puede publicar campañas y aportar; el rol se muestra en el panel principal.

---

## Funcionalidades por Historia de Usuario

### Cuentas y billetera (HU-01 a HU-05)

- **Registro:** nombre, correo y contraseña (8-16 caracteres, mínimo 1 mayúscula, 1 número y 1 carácter especial). Mensaje de confirmación y error si el correo ya existe.
- **Login:** acceso al panel con correo y contraseña; error si la contraseña es incorrecta.
- **Perfil:** edición de nombre y correo con validación de campos obligatorios.
- **Recarga de saldo:** monto entre 10.000 y 1.000.000; se rechazan montos fuera del rango.
- **Saldo:** el creador ve los fondos recaudados por campaña; el patrocinador ve el total aportado y el detalle por campaña. Se actualiza tras cada aporte y se puede consultar el historial de movimientos.

### Campañas (HU-06 a HU-09)

- **Publicar:** título, descripción, categoría, meta, fecha límite (posterior a hoy y máximo 90 días), hasta 4 imágenes y hasta 6 recompensas opcionales con monto mínimo y unidades disponibles.
- **Editar:** si la campaña ya recibió aportes, meta y fecha límite quedan bloqueadas; las recompensas se muestran en solo lectura y no son editables.
- **Pausar/cerrar:** una campaña pausada muestra su etiqueta y no admite aportes; al cerrarla se bloquean los aportes de forma permanente y se notifica a los patrocinadores.
- **Explorar:** búsqueda por nombre, filtro por categoría y orden por popularidad, fecha límite o mayor recaudo; mensaje cuando no hay resultados.

### Aportes (HU-10 a HU-12)

- **Aporte:** monto mayor a cero y no superior al saldo; si el saldo es insuficiente se sugiere recargar.
- **Recompensas:** solo seleccionables si el monto alcanza el mínimo; las agotadas se muestran deshabilitadas y se descuenta una unidad de stock al confirmar.
- **Comprobante:** resumen de la transacción con campaña, monto, recompensa y saldo restante.
- **Prueba del caso de error (HU-12):** la pantalla de aporte incluye la casilla "Demo: simular error de procesamiento"; al marcarla, el aporte falla, se muestra el error y no se descuenta saldo.

---

## Integración con el Backend

La capa `src/api` consume el backend con axios (`baseURL` = `VITE_API_URL` + `/api`):

| Módulo | Endpoints | Estado |
|--------|-----------|--------|
| `auth.ts` | `POST /auth/register`, `POST /auth/login` | Conectado |
| `users.ts` | `GET /users/balance`, `PUT /users/profile`, `POST /users/recharge` | Conectado |
| Campañas | `/api/campaigns`, `/api/categories` | Pendiente (simulado) |
| Aportes | `/api/campaigns/{id}/contributions[/confirm]` | Pendiente (simulado) |

Comportamiento:

- El token se guarda en `localStorage` y se envía como `Authorization: Bearer <token>`.
- Ante un `401` fuera de login/registro se cierra la sesión y se redirige a `/auth`.
- Los errores se muestran con el `message` (o el primer `details`) que devuelve el backend.
- Mientras los aportes sean simulados, su monto se descuenta del saldo real solo en el navegador; al conectar `/contributions/confirm` el saldo vendrá completo del backend.

Pendiente:

- [ ] Conectar campañas (HU-06 a HU-09) a `/api/campaigns`.
- [ ] Conectar aportes con recompensa y comprobante (HU-10 a HU-12) a `/contributions/confirm`.
- [ ] Mostrar las campañas del balance (`campaigns` de `/users/balance`) cuando las campañas sean reales.
- [ ] Página de gestión de usuarios para administrador (HU-21).

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

## Próximos Pasos / Roadmap

- [ ] Integración completa con el backend (campañas y aportes)
- [ ] CRUD de usuarios para administrador (HU-21)
- [ ] Retiro de fondos (creadores)
- [ ] Tests unitarios y end-to-end
- [ ] CI/CD con GitHub Actions
- [ ] Despliegue del frontend

---

## Licencia

MIT — Uso académico CodeFactory UdeA.
