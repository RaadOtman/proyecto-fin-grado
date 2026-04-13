# PADEX — Frontend

Interfaz web del proyecto PADEX, una aplicación para reservar pistas de pádel.
Desarrollada con React, Vite y TypeScript, conectada al backend mediante fetch y cookies.

---

## ¿Qué hace este frontend?

- Permite registrarse e iniciar sesión con email y contraseña
- Muestra la disponibilidad de pistas en tiempo real para cualquier fecha
- Permite reservar un tramo horario libre con un solo clic
- Muestra al usuario todas sus reservas activas y pasadas, con opción de cancelar
- Incluye un panel de administración para gestionar usuarios, reservas y pistas
- Permite seleccionar el club al que pertenece el usuario, con mapa embebido
- Personaliza la página de inicio mostrando el club del usuario si tiene uno asignado

---

## Tecnologías usadas

| Tecnología | Para qué sirve |
|---|---|
| React 19 | Librería principal de la interfaz |
| Vite | Herramienta de desarrollo y compilación |
| TypeScript | Tipado estático para evitar errores |
| React Router v7 | Navegación entre páginas |
| Framer Motion | Animaciones de entrada y transiciones |
| React Icons (Feather) | Iconos usados en toda la app |
| Fetch API | Comunicación con el backend |
| CSS personalizado | Estilos propios con variables CSS (tema oscuro) |

No se ha usado ninguna librería de componentes como Material UI o Tailwind. Los estilos están hechos a mano con variables CSS para mantener un diseño consistente.

---

## Requisitos previos

- Node.js 18 o superior
- El backend de PADEX corriendo en local (puerto 4000)

> El frontend no funciona sin el backend activo. Asegúrate de arrancarlo primero.

---

## Instalación

```bash
cd padel-frontend
npm install
```

---

## Configuración

El frontend se conecta al backend usando la variable de entorno `VITE_API_URL`.
Si no la defines, usa `http://localhost:4000` por defecto, que es la configuración habitual en local.

Si necesitas cambiar la URL del backend, crea un archivo `.env` en la raíz del frontend:

```
VITE_API_URL=http://localhost:4000
```

En la mayoría de los casos **no hace falta crear este archivo**: con el backend corriendo en el puerto 4000 funciona directamente.

---

## Arrancar el frontend

```bash
npm run dev
```

La aplicación estará disponible en:

```
http://localhost:5173
```

---

## Cómo funciona con el backend

El frontend consume la API REST del backend mediante `fetch`. Todas las llamadas están centralizadas en dos archivos:

- `src/lib/apiClient.ts` — rutas públicas y de usuario
- `src/lib/adminApiClient.ts` — rutas del panel de administración

**La autenticación funciona con cookies HTTP-only.** Al hacer login, el backend establece una cookie llamada `padel_token` que el navegador envía automáticamente en cada petición. El frontend no puede leer esa cookie directamente (es HTTP-only), pero la gestión de sesión se mantiene en el contexto `AuthContext`.

Para que las cookies funcionen bien en local, el backend y el frontend deben correr en `localhost` (no en IPs distintas).

---

## Flujo básico de uso

1. Abrir `http://localhost:5173`
2. Registrarse con un email y contraseña, o usar los usuarios de prueba
3. Iniciar sesión
4. (Opcional) Ir a **Mi club** y seleccionar el club al que perteneces
5. Ir a **Reservar pista**, elegir una fecha y hacer clic en un tramo libre
6. Consultar tus reservas en **Mis reservas** y cancelar si es necesario
7. Si eres admin, acceder al **Panel de administración** desde el menú

---

## Usuarios de prueba

Los mismos que en el backend:

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@demo.com | 123456 |
| Usuario normal | user@demo.com | 123456 |

---

## Estructura del proyecto

```
src/
├── components/              # Componentes reutilizables
│   ├── admin/               # Componentes exclusivos del panel de admin
│   ├── Header.tsx           # Barra de navegación superior
│   ├── Sidebar.tsx          # Panel lateral de la sección de usuario
│   ├── Loader.tsx           # Indicador de carga
│   ├── SkeletonCard.tsx     # Tarjetas animadas mientras carga
│   └── ProtectedRoute.tsx   # Ruta que requiere sesión iniciada
├── config/
│   └── api.ts               # URL base del backend
├── context/
│   └── AuthContext.tsx      # Estado global: sesión, rol, club del usuario
├── lib/
│   ├── apiClient.ts         # Llamadas al backend (usuario)
│   └── adminApiClient.ts    # Llamadas al backend (administración)
├── pages/                   # Una página por sección
│   ├── Home.tsx             # Página principal con hero dinámico del club
│   ├── Login.tsx            # Inicio de sesión
│   ├── Register.tsx         # Registro de cuenta
│   ├── Reserve.tsx          # Reservar pista
│   ├── MyReservations.tsx   # Mis reservas
│   ├── MiClub.tsx           # Selección y detalle del club
│   └── admin/               # Páginas del panel de administración
│       ├── AdminDashboard.tsx
│       ├── AdminUsuarios.tsx
│       ├── AdminReservas.tsx
│       └── AdminPistas.tsx
├── App.tsx                  # Definición de todas las rutas
├── main.tsx                 # Punto de entrada de la aplicación
├── styles.css               # Todos los estilos de la app
└── index.css                # Reset y estilos base
```

---

## Notas para pruebas en local

- **El backend debe estar corriendo** antes de abrir el frontend. Si no, todas las llamadas a la API fallarán.
- El frontend espera el backend en `http://localhost:4000`. Si lo arrancas en otro puerto, crea un `.env` con `VITE_API_URL=http://localhost:XXXX`.
- Si el login falla sin mensaje de error claro, revisa que el backend esté activo y que CORS esté configurado para `http://localhost:5173`.
- Las cookies de sesión requieren que frontend y backend estén en `localhost`. No mezcles `localhost` con `127.0.0.1`.
- El panel de administración solo es accesible con el usuario `admin@demo.com` o cualquier cuenta con rol `admin` en la base de datos.
- Si cambias de cuenta y la sesión no se limpia bien, prueba a borrar las cookies del navegador manualmente.

---

## Posibles mejoras futuras

- Validaciones de formulario más completas en el lado del cliente
- Página de perfil para cambiar nombre o contraseña
- Calendario visual para ver todas las reservas del club de un vistazo
- Estadísticas más detalladas en el panel de admin (horas más reservadas, etc.)
- Modo claro disponible además del tema oscuro actual
- Tests de componentes con Vitest o React Testing Library
- Despliegue automático en Vercel con variables de entorno configuradas
