# 🎟️ API para administracion de eventos. 

Una API RESTful robusta, modular y escalable construida con Node.js, Express y MongoDB para la gestión de eventos, registro de usuarios y reserva/emisión de tickets.

## 📌 Resumen del Proyecto

Este proyecto consiste en el backend de una plataforma integral de gestión de eventos. Permite a los usuarios explorar eventos disponibles, inscribirse, emitir reservaciones y administrar su cuenta. Implementa un control de acceso basado en roles (RBAC: `admin`, `organizer`, `user`) y un manejo centralizado de datos y errores.

### Funcionalidades Principales

* **Autenticación y Autorización:**
  * Registro e inicio de sesión con **Passport.js** e **JWT**.
  * Validación estricta del cuerpo de solicitudes con **Zod**.
  * Control de acceso basado en roles (`admin`, `organizer`, `user`).

* **Gestión de Eventos:**
  * Creación, edición, consulta y cancelación de eventos.
  * Control de propiedad: Los organizadores gestionan únicamente sus propios eventos, mientras los administradores poseen control global.
  * Ciclo de vida del evento mediante estados: `draft`, `published`, `cancelled`, `finished`.

* **Gestión de Tickets y Reservas:**
  * Inscripción y reserva de entradas para eventos.
  * Generación de código único de reservación (`reservationCode`).
  * Cancelación de reservaciones por parte del usuario o un administrador.
  * Garantía de integridad mediante **índices parciales en MongoDB** para evitar duplicidad de tickets activos por usuario.

* **Manejo Global de Errores:**
  * Middleware centralizado para captura de excepciones y respuestas HTTP estandarizadas.

## 🛠️ Tecnologías Utilizadas

* **Entorno de Ejecución:** Node.js (ES Modules)
* **Framework Web:** Express.js
* **Base de Datos & ODM:** MongoDB & Mongoose
* **Autenticación & Seguridad:** Passport.js (JWT & Local), Bcrypt
* **Validaciones:** Zod
* **Arquitectura:** DAO, Repository Pattern, DTOs, Controller-Service Pattern

## 🏗️ Arquitectura del Sistema

La aplicación sigue una **Arquitectura en Capas (Layered Architecture)** basada en el principio de separación de responsabilidades, complementada con el **Patrón Repository**, **DAO (Data Access Object)** y **DTOs (Data Transfer Objects)**.

### Flujo de Datos y Capas

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT / REQUEST                     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                 RUTAS & MIDDLEWARES                     │
│  (Zod Validation, Passport JWT, RBAC, Owner Check)      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                     CONTROLLERS                         │
│  (Manejo de HTTP Request/Response, extracción de DTOs)  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                       SERVICES                          │
│          (Lógica de Negocio y Reglas de Dominio)        │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                     REPOSITORIES                        │
│   (Abstracción de Persistencia y Transformación DTO)   │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                         DAOs                            │
│         (Acceso Directo a Base de Datos / Mongoose)     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│               MIDDLEWARE GLOBAL DE ERRORES              │
│       (Captura centralizada de excepciones/errors)      │
└─────────────────────────────────────────────────────────┘
```

1. **Routes & Middlewares:** Definen los endpoints, aplican validación con Zod, verifican tokens JWT, controlan permisos por rol y capturan errores de autenticación.
2. **Controllers:** Gestionan las entradas/salidas de peticiones HTTP y formatean las respuestas.
3. **Services:** Contienen la lógica pura de negocio de las entidades (`User`, `Event`, `Ticket`).
4. **Repositories:** Abstraen el acceso a datos. Utilizan **DTOs** para transformar datos hacia y desde la base de datos.
5. **DAOs (Data Access Objects):** Realizan las operaciones CRUD directamente sobre la base de datos usando Mongoose.
6. **Global Error Middleware:** Intercepta cualquier excepción o error arrojado en las capas superiores para entregar respuestas homogéneas y amigables al cliente.

## 📁 Estructura del Proyecto

```text
src/
├── config/              # Configuración de BD, variables de entorno, etc.
├── controllers/         # Controladores HTTP (event, ticket, session)
├── dao/                 # Data Access Objects (Mongoose models/queries)
├── dtos/                # Data Transfer Objects (formateo y sanitización)
├── middlewares/         # Middlewares (auth, roles, zod, global error handler)
├── repositories/        # Capa de repositorios (abstracción de DAO)
├── routes/              # Definición de rutas Express
├── schemas/             # Esquemas de validación con Zod
├── services/            # Servicios con lógica de negocio
└── app.js               # Punto de entrada de la aplicación
```

## 📊 Modelos de Datos

### 1. Usuario (`User`)
```json
{
  "first_name": "String (Requerido)",
  "last_name":  "String (Requerido)",
  "email":      "String (Requerido, Único)",
  "password":   "String (Requerido, Hasheado)",
  "role":       "Enum ['admin', 'organizer', 'user'] (Default: 'user')"
}
```

### 2. Evento (`Event`)
```json
{
  "title":       "String (Requerido)",
  "description": "String (Requerido)",
  "category":    "String (Requerido)",
  "location":    "String (Requerido)",
  "date":        "String (Requerido)",
  "time":        "String (Requerido)",
  "capacity":    "Number (Requerido, Min: 1)",
  "price":       "Number (Requerido, Min: 0)",
  "status":      "Enum ['draft', 'published', 'cancelled', 'finished'] (Default: 'draft')",
  "organizer":   "ObjectId -> Ref: User (Requerido)"
}
```

### 3. Ticket (`Ticket`)
```json
{
  "event":           "ObjectId -> Ref: events (Requerido)",
  "user":            "ObjectId -> Ref: User (Requerido)",
  "status":          "Enum ['confirmed', 'pending', 'cancelled'] (Default: 'confirmed')",
  "quantity":        "Number (Requerido, Min: 1)",
  "reservationCode": "String (Requerido, Único)",
  "cancelledAt":     "Date (Default: null)"
}
```
> **Nota:** Posee un índice único compuesto `{ event: 1, user: 1 }` parcial para prevenir tickets duplicados en estados `confirmed` o `pending`.

## 🚀 Endpoints de la API

### 🔑 Sesiones & Usuarios (`/api/sessions`)

| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Pública (Zod) | Registro de nuevo usuario |
| `POST` | `/login` | Pública (Zod) | Autenticación y generación de JWT |
| `GET` | `/current` | JWT | Retorna los datos del usuario autenticado |
| `GET` | `/users` | JWT (`admin`) | Lista todos los usuarios (solo Admin) |
| `POST` | `/logout` | Pública | Cierra la sesión del usuario |



## Funcionalidad desde Postman de endpoints para sesiones & usuarios

POST http://localhost:8080/api/sessions/register


```json {
 "first_name": "Epicuro",
  "last_name": "De Samos",
  "email": "epicuro@email.com",
  "password": "123456"
}
```

Respuesta 201 Create
El role se asigna por defecto como "user".

```json{
    {
    "status": "success",
    "message": "Usuario registrado correctamente",
    "payload": {
        "firstName": "Epicuro",
        "lastName": "De Samos",
        "fullName": "Epicuro De Samos",
        "email": "epicuro@email.com",
        "role": "user"
    }
}
}
```

POST http://localhost:8080/api/sessions/login
Body
```json {
    {
  "email": "epicuro@email.com",
  "password": "123456"
}
}
``` 

Respuesta 200 OK 
```json {
   "status": "success",
    "message": "Inicio de sesión exitoso",
    "payload": {
        "id": "6acfe4fdd3ff788c5c9b4535",
        "email": "epicuro@email.com",
        "role": "user"
    }

}
``` 

GET http://localhost:8080/api/sessions/current 
Esta ruta funciona si previamente se ha realizado un inicio de sesion y responde:
200 ok

```json{
  "status": "success",
    "payload": {
        "id": "6acfe4fdd3ff788c5c9b4535",
        "email": "epicuro@email.com",
        "role": "user"
    }
}
``` 

Si previamente no se inicio sesion saldra la siguiente respuesta:
401 Unauthorized
```json{
   "status": "error",
    "message": "No autorizado"
}
``` 

GET http://localhost:8080/api/sessions/users
Esta ruta esta protegida y solo el usuario "ADMIN" puede acceder a ver los usuarios existentes. Me muestra el listado de usuarios registrados. Si un usuario "USER" o "ORGANIZER" intenta esta ruta le sale la respuesta:
403 Forbidden
```json{
    "status": "error",
    "message": "Acceso denegado: permisos insuficientes"
}
```

Cuando un usuario "ADMIN" ha iniciado sesion da una respuesta 200 ok con el listado de usuarios con los datos basicos como id, email, rol:

```json{
 "status": "success",
    "payload": [
        {
            "id": "6a8e84d5b24d7f2880fcd9ed",
            "email": "martha@email.com",
            "role": "user"
        },
        {
            "id": "6a8e93369627342dc82f135b",
            "email": "jhon@email.com",
            "role": "user"
        },
        {
            "id": "6a8e9a8d349d544569476326",
            "email": "andres@email.com",
            "role": "organizer"
        },
        {
            "id": "6a8e9c63f1148e9077e321ad",
            "email": "monik@email.com",
            "role": "admin"
        },
        {
            "id": "6a8ea5b77e26989552bb107d",
            "email": "nancy@email.com",
            "role": "user"
        }
    ]
}
```


POST http://localhost:8080/api/sessions/logout
Esta ruta elimina la cookie y cierra la sesion:
Respuesta 200 OK
```json{
  "status": "success",
    "message": "Sesión cerrada correctamente"
}
```




### 📅 Eventos (`/api/events`)

| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Pública | Consulta pública de eventos |
| `GET` | `/:eventId` | Pública | Consulta detalles de un evento |
| `POST` | `/` | JWT (`organizer`, `admin`) | Crea un nuevo evento |
| `PUT` | `/:eventId` | JWT + Owner/Admin | Modifica evento (dueño u admin) |
| `DELETE` | `/:eventId` | JWT + Owner/Admin | Cancela/Elimina evento (dueño u admin) |


## Funcionalidad desde Postman de endpoints para eventos

GET http://localhost:8080/api/events/
Ruta publica para consultar todos los eventos al momento creados. 
Muestra en respuesta 200 OK y el listado de los eventos con paginacion:

```json{
  "status": "success",
    "data": [
        {
            "id": "6aaa1d76b7faed6313e74eaf",
            "title": "Tech Conference 2026 - Edición Expandida",
            "description": "...",
            "location": "Salón A",
            "date": "2026-10-15",
            "time": "15:00",
            "status": "cancelled",
            "createdAt": "2026-09-16T04:39:18.341Z",
            "updatedAt": "2026-09-22T03:50:05.040Z",
            "organizer": null
        },
        {
            "id": "6aaa2a2578a8df74fb630b64",
            "title": "Evt 1",
            "description": "...",
            "location": "Salón A",
            "date": "2026-10-15",
            "time": "15:00",
            "status": "active",
            "createdAt": "2026-09-16T05:33:25.900Z",
            "updatedAt": "2026-09-22T03:52:56.885Z",
            "organizer": null
        },
        {
            "id": "6ab1f2c9b0a7ea9992aa7593",
            "title": "Tech Conference 2026",
            "description": "Conferencia sobre nuevas tecnologías en el desarrollo web",
            "location": "Auditorio Principal - Centro de Convenciones",
            "date": "2026-10-15",
            "time": "14:00",
            "status": "cancelled",
            "createdAt": "2026-09-22T03:15:21.259Z",
            "updatedAt": "2026-09-22T04:09:19.898Z",
            "organizer": null
        },
        {
            "id": "6ab20270c676d3066e20d9da",
            "title": "Tech Conference 2027",
            "description": "Conferencia sobre nuevas tecnologías IA",
            "location": "Auditorio Principal - Centro de Convenciones",
            "date": "2026-10-17",
            "time": "14:00",
            "status": "active",
            "createdAt": "2026-09-22T04:22:08.592Z",
            "updatedAt": "2026-09-22T04:23:18.559Z",
            "organizer": null
        },
        {
            "id": "6abb2669baee42950e8ab134",
            "title": "Conferencia Tech 2026 - Edición Actualizada",
            "description": "Evento sobre las nuevas tendencias de desarrollo de software",
            "category": "Tecnología",
            "location": "Auditorio Principal - Centro de Eventos",
            "date": "2026-11-15",
            "time": "09:00",
            "capacity": 150,
            "price": 25.5,
            "status": "published",
            "createdAt": "2026-09-29T02:46:01.040Z",
            "updatedAt": "2026-09-29T02:53:11.237Z",
            "organizer": {
                "id": "6a8e9a8d349d544569476326",
                "fullName": ""
            }
        },
        {
            "id": "6abb28d4baee42950e8ab135",
            "title": "Conferencia Tech 2026 - Edición Actualizada organizer andres",
            "description": "Evento sobre las nuevas tendencias de desarrollo de software 2",
            "category": "Tecnología",
            "location": "Auditorio Principal - Centro de Eventos",
            "date": "2026-11-16",
            "time": "09:00",
            "capacity": 200,
            "price": 25.5,
            "status": "cancelled",
            "createdAt": "2026-09-29T02:56:20.249Z",
            "updatedAt": "2026-09-29T03:23:41.588Z",
            "organizer": {
                "id": "6a8e9a8d349d544569476326",
                "fullName": ""
            }
        },
        {
            "id": "6ac46a7905317b72eed5db39",
            "title": "Conferencia de Software 2026",
            "description": "Evento de prueba para tickets",
            "category": "Tecnología",
            "location": "Auditorio Principal",
            "date": "2026-11-20",
            "time": "18:00",
            "capacity": 2,
            "price": 0,
            "status": "published",
            "createdAt": "2026-10-06T03:26:49.671Z",
            "updatedAt": "2026-10-06T03:26:49.671Z",
            "organizer": {
                "id": "6a8e9a8d349d544569476326",
                "fullName": ""
            }
        },
        {
            "id": "6ac8641ef633e165bee133d2",
            "title": "arquitectura en backend",
            "description": "Evento de prueba para tickets",
            "category": "Tecnología",
            "location": "Auditorio Principal",
            "date": "2026-11-21",
            "time": "08:00",
            "capacity": 6,
            "price": 0,
            "status": "published",
            "createdAt": "2026-10-09T03:48:46.907Z",
            "updatedAt": "2026-10-09T03:48:46.907Z",
            "organizer": {
                "id": "6a8e9c63f1148e9077e321ad",
                "fullName": ""
            }
        }
    ],
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
}
```

GET http://localhost:8080/api/events/6aaa1d76b7faed6313e74eaf
Esta ruta requiere un id de algun evento para consultarlo especificamente en la url. Cualquier tipo de usuario puede acceder porque es una ruta publica:
Respuesta 200 OK
```json{
   "status": "success",
    "payload": {
        "id": "6aaa1d76b7faed6313e74eaf",
        "title": "Tech Conference 2026 - Edición Expandida",
        "description": "...",
        "location": "Salón A",
        "date": "2026-10-15",
        "time": "15:00",
        "status": "cancelled",
        "createdAt": "2026-09-16T04:39:18.341Z",
        "updatedAt": "2026-09-22T03:50:05.040Z",
        "organizer": null
    }
} 
```

POST http://localhost:8080/api/events/ 
Esta ruta es para crear un evento pero solo esta disponible para usuarios de tipo "admin" y "organizer". Si no se ha iniciado sesion sale respuesta 401 Unauthorized:
```json{
    "status": "error",
    "message": "No autorizado"
}
```

Si el que inicio sesion es un usuario de tipo "user", sale como respuesta 403 Forbidend:
```json{
      "status": "error",
    "message": "Acceso denegado: permisos insuficientes"
}
```

Si el usuario hizo login y es usuario tipo "organizer" o "admin" y envia los datos del esquema correctamente:


```json{
{
  "title": "arquitectura en backend",
  "description": "Evento de prueba octubre",
  "category": "Tecnología",
  "location": "Auditorio Principal",
  "date": "2026-10-21",
  "time": "08:00",
  "capacity": 10,
  "price": 0,
  "status": "published"
}

}
```
sale como respuesta 201 Created. 

```json {
 "status": "success",
    "payload": {
        "id": "6ad008f6e64cee742ed3a101",
        "title": "arquitectura en backend",
        "description": "Evento de prueba octubre",
        "category": "Tecnología",
        "location": "Auditorio Principal",
        "date": "2026-10-21",
        "time": "08:00",
        "capacity": 10,
        "price": 0,
        "status": "published",
        "createdAt": "2026-10-14T22:57:58.545Z",
        "updatedAt": "2026-10-14T22:57:58.545Z",
        "organizer": {
            "id": "6a8e9c63f1148e9077e321ad",
            "fullName": "monik gaviria",
            "email": "monik@email.com"
        }
    }
}
```

PUT http://localhost:8080/api/events/6ac8641ef633e165bee133d2
Esta ruta es para actualizar un evento existente y en la ruta se verifica si el creador del evento es el que esta modificando el evento o si es un usuario tipo "admin" porque de de lo contrario no se puede modificar el evento. 
Ejemplo de intento de modificacion de evento con un usuario tipo "user":
Respuesta 403 Forbidden
```json
{
    "status": "error",
    "message": "Acceso denegado: permisos insuficientes"
}
```
Cuando lo hace un usuario "organizer" que no creo el evento: 
Respuesta 403 Foridden

```json
{
    "status": "error",
    "message": "No tienes permiso para modificar este evento"
}
```

Cuando lo hace un usuario "admin":
El cuerpo de la pericion va con los datos que se quieren modificar, por ejemplo: 
```json{
  {
  "location": "Salón A",
  "date": "2026-10-20",
  "time": "15:00"
  }
}
```

La respuesta es 200 OK:

```json{
      "status": "success",
    "payload": {
        "id": "6ac8641ef633e165bee133d2",
        "title": "arquitectura en backend",
        "description": "Evento de prueba para tickets",
        "category": "Tecnología",
        "location": "Salón A",
        "date": "2026-10-20",
        "time": "15:00",
        "capacity": 6,
        "price": 0,
        "status": "published",
        "createdAt": "2026-10-09T03:48:46.907Z",
        "updatedAt": "2026-10-15T02:10:04.843Z",
        "organizer": {
            "id": "6a8e9c63f1148e9077e321ad",
            "fullName": "monik gaviria",
            "email": "monik@email.com"
        }
    }
}
```

DELETE http://localhost:8080/api/events/6ac8641ef633e165bee133d2
Esta ruta es para eliminar un evento y el usuario tipo "admin" puede eliminar cualquier evento o el usuario tipo "organizer" que creo el evento puede eliminarlo pero no cualquier usuario tipo "organizer" ni ningun usuario tipo "user".
Ejemplo de intento de eliminar evento con un usuario tipo "organizer" diferente al creador del evento:
Respuesta 403 Forbidden

```json
{
    "status": "error",
    "message": "No tienes permiso para modificar este evento"
}
```

Ejempplo de eliminacion de evento con usuario "admin":
Respuesta 200 ok. El status pasa de "published" a "canceled"

```json
{
    "status": "success",
    "message": "Evento cancelado exitosamente",
    "payload": {
        "id": "6ac8641ef633e165bee133d2",
        "title": "arquitectura en backend",
        "description": "Evento de prueba para tickets",
        "category": "Tecnología",
        "location": "Salón A",
        "date": "2026-10-20",
        "time": "15:00",
        "capacity": 6,
        "price": 0,
        "status": "cancelled",
        "createdAt": "2026-10-09T03:48:46.907Z",
        "updatedAt": "2026-10-15T02:22:43.522Z",
        "organizer": {
            "id": "6a8e9c63f1148e9077e321ad",
            "fullName": ""
        }
    }
}
```


### 🎟️ Tickets & Reservas (`/api/tickets`)

| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/events/:eid/tickets` | JWT | Genera reserva de ticket |
| `GET` | `/tickets/my-tickets` | JWT | Consulta tickets del usuario autenticado |
| `GET` | `/events/:eid/tickets` | JWT (`organizer`, `admin`) | Consulta tickets vendidos de un evento |
| `PATCH` | `/tickets/:tid/cancel` | JWT (Owner/Admin) | Cancela un ticket específico |

## Funcionalidad desde Postman de endpoints para TICKETS

POST http://localhost:8080/api/events/6ac46a7905317b72eed5db39/tickets
Esta ruta es para que un usuario se pueda inscribir a un evento existente, previamente el usuario debio hacer login e ingresar a esta ruta de inscripcion de evento con el id del evento en la url. Se valida que hayan cupos disponibles y en estee ejemplo ya estan agotados y sale:
Respuesta 400 Bad Request

``` json
{
    "status": "error",
    "message": "Cupos insuficientes. Cupos disponibles: 0, solicitados: 1"
}
```

En este caso usare otro ID de un evento que tiene cupos disponibles y previamente hice login con un usuario registrado:
POST http://localhost:8080/api/events/6abb2669baee42950e8ab134/tickets
Respuesta 201 Created
```json
{
    "status": "success",
    "message": "Inscripción realizada exitosamente",
    "payload": {
        "id": "6ad041e42d1be4eefe839f4b",
        "reservationCode": "TCK-6AFAE26C",
        "quantity": 1,
        "status": "confirmed",
        "createdAt": "2026-10-15T03:00:52.449Z",
        "cancelledAt": null,
        "event": {
            "id": "6abb2669baee42950e8ab134"
        },
        "user": {
            "id": "6aa8d34a4c41209b72378b9c",
            "fullName": "newton6 gaviria",
            "email": "newton6@email.com"
        }
    }
}
``` 
Con esta ruta se envia un email de confirmacion de inscripcion al evento.


GET http://localhost:8080/api/tickets/my-tickets
Para esta ruta el usuario debe star logiado y estar inscrito en algun evento para que le salga informacion de los eventos a los que esta inscrito: 
Respuesta 200 ok
```json 
{
    "status": "success",
    "payload": [
        {
            "id": "6ac5c056936c331ab38f5231",
            "reservationCode": "TCK-03A3CB22",
            "quantity": 1,
            "status": "cancelled",
            "createdAt": "2026-10-07T03:45:26.954Z",
            "cancelledAt": "2026-10-07T03:47:09.258Z",
            "event": {
                "id": "6ac46a7905317b72eed5db39",
                "title": "Conferencia de Software 2026",
                "date": "2026-11-20",
                "time": "18:00",
                "location": "Auditorio Principal",
                "price": 0,
                "status": "published"
            },
            "user": {
                "id": "6aa8d5ae73d2e56b235a3b1f",
                "fullName": "newton7 gaviria",
                "email": "newton7@email.com"
            }
        },
        {
            "id": "6ad043eebc9088432bd33276",
            "reservationCode": "TCK-A487A463",
            "quantity": 1,
            "status": "confirmed",
            "createdAt": "2026-10-15T03:09:34.128Z",
            "cancelledAt": null,
            "event": {
                "id": "6abb2669baee42950e8ab134",
                "title": "Conferencia Tech 2026 - Edición Actualizada",
                "date": "2026-11-15",
                "time": "09:00",
                "location": "Auditorio Principal - Centro de Eventos",
                "price": 25.5,
                "status": "published"
            },
            "user": {
                "id": "6aa8d5ae73d2e56b235a3b1f",
                "fullName": "newton7 gaviria",
                "email": "newton7@email.com"
            }
        }
    ]
}
```
En este ejemplo el usuario estaba inscrito en 2 eventos. 


GET http://localhost:8080/api/events/6ad008f6e64cee742ed3a101/tickets/ 
Esta ruta consulta que usuarios estan inscritos al evento del id especificado en la url, si no hay ninguno la respuesta sera 200 OK 
```JSON
{
    "status": "success",
    "payload": []
}
```

Si hay usuarios inscritos al evento sale respuesta 200 OK con el listado de los usuarios:
```json 
{
    "status": "success",
    "payload": [
        {
            "id": "6ad03ba05a7d794f9c722957",
            "reservationCode": "TCK-38436530",
            "quantity": 1,
            "status": "confirmed",
            "createdAt": "2026-10-15T02:34:08.653Z",
            "cancelledAt": null,
            "event": {
                "id": "6abb2669baee42950e8ab134"
            },
            "user": {
                "id": "6acfe4fdd3ff788c5c9b4535",
                "fullName": "Epicuro De Samos",
                "email": "epicuro@email.com"
            }
        },
        {
            "id": "6ad03c5211e9fd6ba99e80a8",
            "reservationCode": "TCK-26D0C3A6",
            "quantity": 1,
            "status": "confirmed",
            "createdAt": "2026-10-15T02:37:06.112Z",
            "cancelledAt": null,
            "event": {
                "id": "6abb2669baee42950e8ab134"
            },
            "user": {
                "id": "6ab1e162d9e22862abd8adfd",
                "fullName": "Jhone gaviria",
                "email": "jhone@email.com"
            }
        },
        {
            "id": "6ad04134cd56954412ab5e84",
            "reservationCode": "TCK-F6A6F32F",
            "quantity": 1,
            "status": "confirmed",
            "createdAt": "2026-10-15T02:57:56.627Z",
            "cancelledAt": null,
            "event": {
                "id": "6abb2669baee42950e8ab134"
            },
            "user": {
                "id": "6aa223c80135e72aa77af3e5",
                "fullName": "newton gaviria",
                "email": "newton@email.com"
            }
        },
        {
            "id": "6ad041e42d1be4eefe839f4b",
            "reservationCode": "TCK-6AFAE26C",
            "quantity": 1,
            "status": "confirmed",
            "createdAt": "2026-10-15T03:00:52.449Z",
            "cancelledAt": null,
            "event": {
                "id": "6abb2669baee42950e8ab134"
            },
            "user": {
                "id": "6aa8d34a4c41209b72378b9c",
                "fullName": "newton6 gaviria",
                "email": "newton6@email.com"
            }
        }
         ]
}
``` 

PATCH http://localhost:8080/api/tickets/6ad041e42d1be4eefe839f4b/cancel
Esta ruta es para cancelar un ticket especifico, el usuario tipo "organizer" que creo el evento o un "admin" luego de hacer login podria cancelar el ticket especificando el id del ticket en la url.
Respuesta 200 OK
```json
{
    "status": "success",
    "message": "Ticket cancelado exitosamente",
    "payload": {
        "id": "6ad041e42d1be4eefe839f4b",
        "reservationCode": "TCK-6AFAE26C",
        "quantity": 1,
        "status": "cancelled",
        "createdAt": "2026-10-15T03:00:52.449Z",
        "cancelledAt": "2026-10-15T03:26:44.449Z",
        "event": {
            "id": "6abb2669baee42950e8ab134"
        },
        "user": {
            "id": "6aa8d34a4c41209b72378b9c",
            "fullName": ""
        }
    }
}
```

## ⚙️ Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd <NOMBRE_DEL_PROYECTO>
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env`):**
```bash
PORT=8080
NODE_ENV= development
MONGODB_USERNAME="user"
MONGODB_PASSWORD="password"
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/<dbname>
JWT_SECRET=tu_clave_secreta_jwt
JWT_EXPIRES_IN="24h"
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=Usuario del correo a usar
MAIL_PASS= clave para app
MAIL_FROM="Eventos App <email a utilizar>"
```

4. **Ejecutar el proyecto:**
   ```bash
   # Modo desarrollo
   npm run dev

   # Modo producción
   npm start
   ```