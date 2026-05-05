# APP Contratación Pública - Backend

API REST para detección de irregularidades en procesos de contratación pública en Colombia usando SECOP y Machine Learning.

## Requisitos

- Python 3.10+
- MySQL 8.0+
- pip

## Arranque Rápido

### 1. Clonar y configurar

```bash
git clone <repo>
cd APP_Contratacion_Publica
chmod +x start.sh
./start.sh
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env` y actualizar valores:

```bash
cp backend/.env.example backend/.env
```

Variables importantes:
- `DATABASE_URL`: Conexión a MySQL
- `SECRET_KEY`: Llave para firmar JWT (mínimo 32 caracteres)
- `INITIAL_ADMIN_CODE`: Código para crear primer admin

### 3. Crear primer administrador

Al iniciar, la API genera automáticamente un código de admin. Usar ese código para registrarse como admin:

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin",
    "email": "admin@example.com",
    "password": "secure-password",
    "codigo_registro": "ADMIN-BOOT-2026"
  }'
```

Esto retorna un token JWT. Guardarlo para futuros requests autenticados.

### 4. Generar códigos de invitación

Como admin, crear códigos para otros usuarios:

```bash
curl -X POST "http://localhost:8000/admin/codigos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rol": "auditor",
    "descripcion": "Auditor externo"
  }'
```

Devuelve un código que otros pueden usar para registrarse.

## Estructura de la API

### Authentication

- `POST /auth/register` - Registrarse con código de invitación
- `POST /auth/login` - Login y obtener JWT
- `GET /auth/me` - Perfil actual

### Admin

- `POST /admin/codigos` - Crear código de invitación (ADMIN)
- `GET /admin/codigos` - Listar códigos (ADMIN)
- `GET /admin/usuarios` - Listar usuarios (ADMIN)
- `GET /admin/resumen` - Resumen de la plataforma (ADMIN)

### Contratos

- `POST /contratos/` - Crear/actualizar contrato
- `GET /contratos/` - Listar contratos (con filtros)
- `GET /contratos/{id}` - Obtener contrato específico
- `POST /contratos/lote` - Importar múltiples contratos (CSV/JSON)
- `GET /contratos/alertas` - Ver alertas generadas
- `GET /contratos/resumen` - Resumen de contratos

### Análisis

- `POST /analisis/ejecutar` - Ejecutar modelo Isolation Forest
- `GET /analisis/ultimos-resultados` - Últimas alertas generadas
- `GET /analisis/salud` - Health check

## Roles disponibles

- **admin**: Control total, crear códigos
- **auditor**: Auditar contratos, generar análisis
- **empleado**: Registrar contratos
- **analista**: Acceso solo lectura a análisis

## Requisitos de datos de entrada

Para importar contratos, mínimo necesarias:

```json
{
  "codigo_proceso": "string único",
  "entidad": "string",
  "titulo": "string",
  "valor": float,
  "duracion_dias": int,
  "num_ofertas": int,
  "num_proponentes": int,
  "num_modificaciones": int
}
```

## Base de datos

Las tablas se crean automáticamente al arrancar. Conexión habitual:

```
Database: railway
Host: switchyard.proxy.rlwy.net
Port: 19560
User: root
```

## Troubleshooting

### Error de conexión a BD
- Verificar `DATABASE_URL` en `.env`
- Confirmar acceso a MySQL desde tu red

### Error "Codigo de registro invalido"
- Asegurar que el código existe y está activo en `admin/codigos`
- Los códigos se marcan inactivos después del primer uso

### Error 401 en endpoints protegidos
- Verificar que el token JWT está en el header `Authorization: Bearer <token>`
- Tokens expiran en 120 minutos (configurable en `.env`)

## Desarrollo

Para desarrollo con hot-reload:

```bash
source venv/bin/activate
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Para producción (sin reload):

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Contacto

Para soporte o reportar bugs, abrir un issue en el repositorio.
