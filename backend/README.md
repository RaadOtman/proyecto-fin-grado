# PADEX — Backend

API REST del proyecto PADEX, una aplicación para reservar pistas de pádel.
Desarrollada con Node.js y Express, con base de datos MySQL.

---

## ¿Qué hace este backend?

- Gestiona el registro, login y logout de usuarios
- Controla las reservas de pistas: crear, consultar y cancelar
- Calcula la disponibilidad en tiempo real según el horario configurado del club
- Protege las rutas del panel de administración con autenticación y rol
- Permite que cada usuario elija su club y guarda esa preferencia

---

## Tecnologías usadas

| Tecnología | Para qué sirve |
|---|---|
| Node.js + Express | Servidor y definición de rutas |
| MySQL + mysql2 | Base de datos relacional y consultas |
| bcryptjs | Cifrar contraseñas antes de guardarlas |
| jsonwebtoken | Generar y verificar tokens de sesión (JWT) |
| cookie-parser | Leer la cookie HTTP-only donde guardamos el token |
| dotenv | Cargar las variables del archivo `.env` |
| express-rate-limit | Limitar intentos de login y registro |
| cors | Permitir solo las peticiones del frontend autorizado |
| nodemon | Reinicio automático del servidor en desarrollo |

---

## Requisitos previos

- Node.js 18 o superior
- MySQL 8.x instalado y en ejecución
- Un cliente de MySQL (como MySQL Workbench, TablePlus o la terminal)

---

## Instalación

```bash
cd padel-backend
npm install
```

---

## Configuración del entorno

El proyecto usa un archivo `.env` para guardar las variables sensibles (contraseñas, secretos, etc.).
Este archivo **no está en el repositorio** porque contiene datos reales. En su lugar tienes `.env.example`.

Crea tu propio `.env` copiando el ejemplo:

```bash
cp .env.example .env
```

Edita el archivo `.env` y pon tus valores:

```
PORT=4000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=padel_entrega

JWT_SECRET=pon_aqui_un_secreto_largo_y_aleatorio

CORS_ORIGIN=http://localhost:5173
```

Si quieres generar un `JWT_SECRET` aleatorio y seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Base de datos

El proyecto incluye el archivo **`database/padel_entrega.sql`**, que contiene la estructura completa de la base de datos y algunos datos de prueba. No hace falta crear las tablas a mano.

### Pasos para importarla

**1. Crea la base de datos en MySQL:**

```sql
CREATE DATABASE padel_entrega CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**2. Importa el archivo SQL:**

```bash
mysql -u tu_usuario -p padel_entrega < database/padel_entrega.sql
```

O desde MySQL Workbench: `Server → Data Import → Import from Self-Contained File` → selecciona `database/padel_entrega.sql`.

**3. Asegúrate de que en tu `.env` tienes:**

```
DB_NAME=padel_entrega
```

Con eso ya está todo listo. Las tablas, datos y configuración del club se crean automáticamente al importar el SQL.

### Tablas principales

| Tabla | Qué guarda |
|---|---|
| `users` | Usuarios registrados, con rol y estado activo/inactivo |
| `courts` | Pistas del club con su tipo y estado |
| `reservations` | Reservas con fecha, hora, pista y usuario |
| `clubs` | Clubs disponibles para que los usuarios elijan |
| `club_settings` | Horario, duración de slots y límites del club |

---

## Usuarios de prueba

El archivo SQL incluye dos cuentas listas para usar:

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@demo.com | 123456 |
| Usuario normal | user@demo.com | 123456 |

---

## Arrancar el servidor

### En desarrollo (con reinicio automático al guardar)

```bash
npm run dev
```

### En producción

```bash
npm start
```

El servidor arranca en el **puerto 4000** por defecto (configurable con `PORT` en `.env`).

Comprueba que funciona abriendo en el navegador:

```
http://localhost:4000/health
```

Si también quieres verificar la conexión con la base de datos:

```
http://localhost:4000/test-db
```

> Esta ruta solo está disponible cuando `NODE_ENV=development`.

---

## Estructura del proyecto

```
padel-backend/
├── database/
│   └── padel_entrega.sql          # Base de datos completa con datos de prueba
├── routes/
│   ├── auth.routes.js             # Login, registro y logout
│   ├── reservations.routes.js     # Crear, listar y cancelar reservas
│   ├── clubs.routes.js            # Listar clubs y ver uno por ID
│   ├── users.routes.js            # Actualizar el club del usuario
│   └── admin.routes.js            # Panel de administración (rutas protegidas)
├── middleware/
│   ├── auth.js                    # Comprueba que el usuario tiene sesión iniciada
│   └── adminAuth.js               # Comprueba que el usuario tiene rol 'admin'
├── migrations/
│   └── ...                        # Migraciones SQL incrementales (referencia)
├── db.js                          # Conexión a MySQL con pool de conexiones
├── index.js                       # Entrada principal: configura Express y monta rutas
├── package.json
├── .env.example                   # Ejemplo de variables de entorno (sin datos reales)
└── .gitignore
```

---

## Endpoints principales

### Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registra un usuario nuevo |
| POST | `/auth/login` | Inicia sesión y establece la cookie |
| POST | `/auth/logout` | Cierra sesión eliminando la cookie |

### Disponibilidad y reservas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/availability?date=YYYY-MM-DD` | Pistas con sus slots libres u ocupados |
| GET | `/courts` | Lista de pistas activas |
| POST | `/reservations` | Crea una reserva *(requiere sesión)* |
| GET | `/reservations/my` | Reservas del usuario autenticado |
| DELETE | `/reservations/:id` | Cancela una reserva propia |

### Clubs y usuario

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/clubs` | Lista todos los clubs |
| GET | `/clubs/:id` | Datos de un club concreto |
| PATCH | `/users/:id/club` | Asigna o cambia el club del usuario |

### Panel de administración *(requieren rol admin)*

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/stats` | Métricas para el dashboard |
| GET | `/admin/users` | Lista todos los usuarios |
| PATCH | `/admin/users/:id/role` | Cambia el rol de un usuario |
| PATCH | `/admin/users/:id/active` | Activa o desactiva una cuenta |
| DELETE | `/admin/users/:id` | Elimina un usuario |
| GET | `/admin/reservations` | Lista reservas con filtros opcionales |
| DELETE | `/admin/reservations/:id` | Cancela cualquier reserva |
| GET | `/admin/courts` | Lista todas las pistas |
| POST | `/admin/courts` | Crea una pista nueva |
| PUT | `/admin/courts/:id` | Edita una pista existente |
| PATCH | `/admin/courts/:id/status` | Cambia el estado de una pista |
| DELETE | `/admin/courts/:id` | Elimina una pista |

---

## Notas para pruebas en local

- El frontend corre en `http://localhost:5173` por defecto. Ese origen ya está permitido en CORS.
- Si usas otro puerto para el frontend, añádelo a `CORS_ORIGIN` en tu `.env`.
- Para probar los endpoints puedes usar Postman. Las rutas protegidas necesitan que hagas login primero para que se establezca la cookie.
- La cookie de sesión se llama `padel_token` y es HTTP-only: el frontend no puede leerla con JavaScript, se envía automáticamente en cada petición.
- En local las cookies funcionan con `sameSite: lax`. Si lo despliegas en producción necesitas HTTPS.

---

## Seguridad básica implementada

- Las contraseñas se cifran con bcrypt antes de guardarse (nunca en texto plano)
- El token de sesión se guarda en una cookie HTTP-only para que no sea accesible desde el navegador
- Hay rate limiting en login (máximo 10 intentos por IP cada 15 minutos) y en registro (5 por hora)
- Todas las variables sensibles están en `.env`, que no se sube al repositorio
- Un usuario solo puede modificar sus propios datos

---

## Posibles mejoras futuras

- Tests automáticos con Jest para las rutas principales
- Endpoint para que el admin pueda editar la configuración del club desde el panel
- Envío de email de confirmación al crear una reserva
- Refresh tokens para sesiones más largas sin comprometer la seguridad
- Paginación en los listados del panel de administración
