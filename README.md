# APP Contratación Pública

## Detección Inteligente de Irregularidades en Procesos de Contratación Pública

Una plataforma integral para analizar datos del SECOP (Sistema Electrónico para la Contratación Pública) de Colombia, detectando anomalías y patrones sospechosos usando machine learning.

![Status](https://img.shields.io/badge/Status-Development-yellow)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Node](https://img.shields.io/badge/Node-18%2B-green)
![License](https://img.shields.io/badge/License-MIT-purple)

## Características Principales

### 🔍 Detección de Anomalías
- Modelo **Isolation Forest** para identificación de irregularidades
- Análisis automático de patrones en contratos
- Scoring de anomalías con niveles de severidad
- Alertas en tiempo real

### 👥 Gestión de Usuarios
- Autenticación segura con JWT
- Control de acceso por roles (admin, auditor, empleado, analista)
- Sistema de códigos de invitación para registro
- Panel administrativo completo

### 📊 Visualización Profesional
- Dashboard intuitivo con estadísticas en vivo
- Tabla interactiva de contratos con filtros
- Gestión visual de alertas por severidad
- Análisis en tiempo real con controles ajustables

### 🔐 Arquitectura Segura
- Backend FastAPI con validación de datos
- Base de datos MySQL con relaciones
- Tokens JWT con expiración configurable
- Interceptores HTTP automáticos
- CORS configurado

## Estructura del Proyecto

```
APP_Contratacion_Publica/
├── backend/                    # FastAPI backend
│   ├── main.py               # Punto de entrada
│   ├── models.py             # Modelos SQLAlchemy
│   ├── schemas.py            # Esquemas Pydantic
│   ├── auth.py               # Autenticación JWT
│   ├── database.py           # Configuración BD
│   ├── dependencies.py       # Dependencias FastAPI
│   ├── routes/               # Endpoints organizados
│   │   ├── auth_routes.py
│   │   ├── admin_routes.py
│   │   ├── contratos_routes.py
│   │   └── analisis_routes.py
│   ├── services/             # Lógica de negocio
│   │   └── analysis_service.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # Next.js frontend
│   ├── app/                    # App router pages
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── contratos/
│   │   ├── alertas/
│   │   ├── analisis/
│   │   └── admin/
│   ├── components/             # Componentes React
│   ├── lib/
│   │   ├── api.ts            # Cliente HTTP
│   │   └── auth.ts           # Zustand store
│   ├── package.json
│   └── .env.example
├── BACKEND.md                  # Documentación backend
├── FRONTEND.md                 # Documentación frontend
├── start.sh                    # Script de arranque
└── README.md
```

## Configuración Rápida

### Requisitos Previos
- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- npm o yarn

### Backend

```bash
# 1. Navegar a backend
cd backend

# 2. Crear entorno virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# o en Windows:
# venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar .env
cp .env.example .env
# Editar .env con credenciales reales

# 5. Ejecutar servidor
uvicorn main:app --reload
```

El backend estará disponible en `http://localhost:8000`

API Docs automáticos: `http://localhost:8000/docs`

### Frontend

```bash
# 1. Navegar a frontend
cd frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables
cp .env.example .env.local
# Por defecto apunta a localhost:8000

# 4. Ejecutar en desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## Flujo de Uso

### 1. Primer Acceso (Admin)

```bash
# El backend genera automáticamente:
ADMIN-BOOT-2026  # Código para crear primer admin
```

Ir a http://localhost:3000 → Registrarse con:
- Email: cualquiera
- Código: `ADMIN-BOOT-2026`
- Rol: automático = admin

### 2. Crear Usuarios (Admin)

1. Ir a `/admin` (solo admin)
2. Tab "Códigos de Invitación"
3. Seleccionar rol (auditor, empleado, analista)
4. "Generar Código"
5. Copiar código y compartir con usuarios

### 3. Usuarios Nuevos Registrarse

1. Ir a `/auth/register`
2. O usar link: `/auth/register?code=CODIGO123`
3. Completar datos
4. ¡Listo! Ya pueden usar la plataforma

### 4. Cargar Datos (Contratos)

```bash
# Importar contratos en lote
curl -X POST "http://localhost:8000/contratos/lote" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contratos": [
      {
        "codigo_proceso": "PROC-001",
        "entidad": "Ministerio de...",
        "titulo": "Contrato de...",
        "valor": 1000000,
        "duracion_dias": 30,
        "num_ofertas": 5,
        "num_proponentes": 3,
        "num_modificaciones": 0
      }
    ]
  }'
```

### 5. Ejecutar Análisis

1. Ir a `/analisis`
2. Ajustar tasa de contaminación (10-15% típico)
3. "Ejecutar Análisis"
4. Ver resultados con anomalías detectadas

### 6. Monitorear Alertas

1. Ir a `/alertas`
2. Filtrar por severidad (alta, media, baja)
3. Ver detalles de cada anomalía
4. Score indica qué tan anómalo es el patrón

## Base de Datos

Conexión por defecto (Railway):

```
Database: railway
URL: mysql://root:quRQCxjZQvbgobpelHHmcvQfIoczeBYa@switchyard.proxy.rlwy.net:19560/railway
```

Tablas automáticas:
- `usuarios` - Usuarios del sistema
- `codigos_registro` - Códigos de invitación
- `contratos` - Contratos SECOP
- `alertas` - Alertas generadas
- `resultados_analisis` - Historial de análisis

## API Endpoints

### Autenticación
- `POST /auth/register` - Registrarse con código
- `POST /auth/login` - Login
- `GET /auth/me` - Perfil actual

### Admin
- `POST /admin/codigos` - Crear código
- `GET /admin/codigos` - Listar códigos
- `GET /admin/usuarios` - Listar usuarios

### Contratos
- `POST /contratos/` - Crear contrato
- `GET /contratos/` - Listar contratos
- `POST /contratos/lote` - Importar lote
- `GET /contratos/alertas` - Ver alertas

### Análisis
- `POST /analisis/ejecutar` - Ejecutar modelo
- `GET /analisis/ultimos-resultados` - Últimas alertas

Documentación interactiva: `http://localhost:8000/docs`

## Variables de Entorno

### Backend (.env)

```env
DATABASE_URL=mysql://...
SECRET_KEY=tu-clave-secreta-larga
ACCESS_TOKEN_EXPIRE_MINUTES=120
INITIAL_ADMIN_CODE=ADMIN-BOOT-2026
DEBUG=false
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Seguridad

✅ Validación de datos con Pydantic
✅ Autenticación JWT con expiración
✅ Roles y permisos configurables
✅ Códigos de registro únicos
✅ Hash bcrypt para contraseñas
✅ CORS configurado
✅ Inyección SQL prevenida (SQLAlchemy ORM)

## Modelo de Machine Learning

**Isolation Forest** configurable:
- Tasa de contaminación: 0.01 a 0.49 (1% a 49%)
- Árboles de aislamiento: 200
- Random state: 42 (reproducible)
- Features: valor, duración, ofertas, proponentes, modificaciones, longitudes de texto

Scores:
- < -0.1: Anomalía de alta severidad
- -0.1 a 0: Anomalía de media severidad
- > 0: Comportamiento normal

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `ImportError: No module named 'fastapi'` | Ejecutar `pip install -r requirements.txt` |
| Error conexión a BD | Verificar `DATABASE_URL` en .env |
| `401 Unauthorized` | Verificar token JWT en Authorization header |
| Código "inválido" en registro | Code debe estar activo, crear uno nuevo en /admin |
| Frontend no conecta con backend | Verificar CORS y `NEXT_PUBLIC_API_URL` |

## Performance

- Backend: ~100ms por request
- Análisis Isolation Forest: O(n log n) complexity
- DB queries optimizadas con índices
- Frontend con lazy loading y infinite scroll

## Roadmap

- [ ] Importación automática desde SECOP API
- [ ] Gráficos avanzados (Recharts, D3)
- [ ] Exportar reportes (PDF, Excel)
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Historial y auditoría completa
- [ ] Dark mode
- [ ] Internacionalización
- [ ] Mobile app (React Native)

## Desarrolladores

- Backend: FastAPI + SQLAlchemy + Isolation Forest
- Frontend: Next.js + React + Tailwind CSS

## Licencia

MIT - Libre para usar, modificar y distribuir

## Contacto

Para soporte o preguntas, abrir un issue en GitHub.

---

**Última actualización:** Mayo 2026
**Versión:** 0.1.0 Beta