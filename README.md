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

> **Modo actual: datos simulados.** Hoy la aplicación funciona de forma autónoma: el estado (usuario, campañas, transacciones y notificaciones) se guarda en `localStorage` y se inicia con campañas y cuentas de demostración. La capa `src/api` (axios) ya existe para el backend, pero las páginas todavía no la usan. Ver la sección [Integración con el Backend](#integración-con-el-backend).

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
├── api/             # Cliente axios y módulos del backend (auth, users, mappers)
├── context/         # UserContext: estado global, reglas de negocio simuladas y persistencia local
├── lib/             # Utilidades (formato de moneda/fechas, cuentas demo)
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
- **Backend** (opcional por ahora): cuando se integre, por defecto en `http://localhost:8081`.

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

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Usuario | `test@example.com` | `Demo1234!` |
| Usuario | `user@catalyst.com` | `Demo1234!` |
| Administrador | `admin@catalyst.com` | `Admin1234!` |

También se pueden registrar cuentas nuevas desde `/auth`; se guardan en el navegador.

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

- `user`: usuario normal; puede crear campañas y aportar a las de otros.
- `admin`: administrador; puede editar y cambiar el estado de cualquier campaña y ve las métricas de toda la plataforma.

> El backend maneja los roles `sponsor` y `creator`; el mapeo entre ambos esquemas está pendiente de la integración.

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

---

## Integración con el Backend

La capa `src/api` ya está preparada:

- `client.ts`: instancia de axios con `baseURL` `http://localhost:8081/api`, que envía el token (`localStorage.token`) como `Authorization: Bearer <token>` y, ante un `401`, borra el token y redirige a `/auth`.
- `auth.ts`: `POST /auth/register` y `POST /auth/login`.
- `users.ts`: `GET /users/balance`, `PUT /users/profile` y `POST /users/recharge`.
- `mappers.ts`: convierte las respuestas del backend a los tipos del frontend.

Pendiente para conectar de punta a punta:

- [ ] Declarar `axios` en `package.json` (hoy `src/api` lo importa pero no figura en las dependencias).
- [ ] Usar `authApi` y `usersApi` desde `Auth`, `Profile`, `Wallet` y `Dashboard` en lugar de `localStorage`.
- [ ] Mover la URL base a una variable de entorno (por ejemplo `VITE_API_URL`) en vez de dejarla fija.
- [ ] Conectar campañas, aportes con recompensa y comprobante a los endpoints `/api/campaigns` del backend.
- [ ] Alinear roles con el backend y agregar la gestión de usuarios (HU-21), que aún no tiene página en el frontend.
- [ ] Ajustar el mapper al formato de respuesta de `/users/balance` que devuelve el backend (campos en `camelCase`).

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

- [ ] Integración completa con el backend (ver sección anterior)
- [ ] CRUD de usuarios para administrador (HU-21)
- [ ] Retiro de fondos (creadores)
- [ ] Tests unitarios y end-to-end
- [ ] CI/CD con GitHub Actions
- [ ] Despliegue del frontend

---

## Licencia

MIT — Uso académico CodeFactory UdeA.
