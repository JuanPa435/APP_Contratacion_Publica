# GUÍA DE ARRANQUE RÁPIDO

## 🚀 Opción 1: Con script (Más fácil)

### En Linux/Mac:

```bash
chmod +x start.sh
./start.sh
```

### En Windows:

```bash
# Manualmente:
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload
```

Luego en otra terminal:
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Acceso a la aplicación

| Componente | URL | Descripción |
|-----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interfaz principal de usuario |
| **Backend** | http://localhost:8000 | API REST |
| **API Docs** | http://localhost:8000/docs | Swagger UI interactivo |
| **ReDoc** | http://localhost:8000/redoc | Documentación alternativa |

---

## 📝 Primer uso (Sec. por sec.)

### 1️⃣ Registrar primer Admin

1. Abrir http://localhost:3000
2. Ir a "Registrarse" o usar: http://localhost:3000/auth/register
3. Completar:
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Contraseña: cualquiera (segura)
   - **Código:** `ADMIN-BOOT-2026`
4. ✅ Serás administrador automáticamente

### 2️⃣ Crear usuarios adicionales

1. Ir a http://localhost:3000/admin (Solo aparece si eres admin)
2. Tab "Códigos de Invitación"
3. Seleccionar rol (auditor, empleado, analista)
4. Clic "Generar Código"
5. Copiar el código generado
6. Compartir el código con que se va a registrar
7. Ellos usan http://localhost:3000/auth/register?code=COPIADO

### 3️⃣ Cargar datos de prueba

```bash
# Opción A: Con el script (Recomendado)
./cargar_datos.sh http://localhost:8000 <TOKEN>

# Opción B: Manual con curl
curl -X POST "http://localhost:8000/contratos/lote" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d @ejemplo_datos.json
```

**Para obtener el TOKEN:**
1. Login en http://localhost:3000
2. Abrir DevTools (F12)
3. Console: `localStorage.getItem('token')`
4. Copiar sin las comillas

### 4️⃣ Ejecutar análisis

1. Ir a http://localhost:3000/analisis
2. Dejar tasa de contaminación en 0.12 (12%)
3. Clic "Ejecutar Análisis"
4. Ver resultados con anomalías detectadas
5. Ir a http://localhost:3000/alertas para ver detalles

---

## 📁 Estructura de Carpetas

```
APP_Contratacion_Publica/
│
├── backend/                   # FastAPI backend
│   ├── main.py             # Aplicación principal
│   ├── models.py           # Modelos de BD
│   ├── schemas.py          # Validación de datos
│   ├── auth.py             # Autenticación JWT
│   ├── database.py         # Configuración MySQL
│   ├── routes/             # Endpoints API
│   ├── services/           # Lógica de negocio
│   ├── .env.example        # Variables de entorno
│   └── requirements.txt    # Dependencias Python
│
├── frontend/                  # Next.js + React
│   ├── app/                # Páginas principales
│   │   ├── auth/           # Login/Register
│   │   ├── dashboard/      # Panel principal
│   │   ├── contratos/      # Gestión de contratos
│   │   ├── alertas/        # Visualización de alertas
│   │   ├── analisis/       # Panel de análisis
│   │   └── admin/          # Admin panel
│   ├── components/         # Componentes React
│   ├── lib/                # Utilidades
│   ├── package.json        # Dependencias Node
│   └── .env.example        # Variables de entorno
│
├── README.md               # Este archivo
├── BACKEND.md              # Documentación backend
├── FRONTEND.md             # Documentación frontend
├── start.sh                # Script de arranque
├── cargar_datos.sh         # Script para cargar datos
├── ejemplo_datos.json      # Datos de prueba
└── .gitignore              # Archivos ignorados en git
```

---

## 🔐 Roles y Permisos

| Rol | Crear Códigos | Ver Usuarios | Crear Contratos | Ejecutar Análisis | Ver Alertas |
|-----|:---:|:---:|:---:|:---:|:---:|
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **auditor** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **empleado** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **analista** | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## 🔧 Configuración Avanzada

### Backend (.env)

```env
# Base de datos - por defecto apunta a Railway (cambiar si es necesario)
DATABASE_URL=mysql://root:quRQCxjZQvbgobpelHHmcvQfIoczeBYa@switchyard.proxy.rlwy.net:19560/railway

# Seguridad - cambiar en producción
SECRET_KEY=tu-clave-secreta-muy-larga-minimo-32-caracteres

# JWT - duración del token
ACCESS_TOKEN_EXPIRE_MINUTES=120

# Admin inicial - código para registro del primer admin
INITIAL_ADMIN_CODE=ADMIN-BOOT-2026

# Debug
DEBUG=false
```

### Frontend (.env.local)

```env
# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 💾 Datos Incluidos

El archivo `ejemplo_datos.json` contiene 5 contratos de prueba:

1. **PROC-2024-001** - Equipos de cómputo (normal)
2. **PROC-2024-002** - Consultoría (normal, 2 modificaciones)
3. **PROC-2024-003** - Infraestructura vial (normal, 3 modificaciones)
4. **PROC-2024-ANOMALO-001** ⚠️ **ANOMALÍA** (Proceso acelerado, valor muy alto, 15 modificaciones)
5. **PROC-2024-004** - Laboratorio (normal)

El análisis debería detectar automáticamente la anomalía #4.

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'fastapi'"
```bash
pip install -r backend/requirements.txt
```

### "Port 8000 already in use"
```bash
# Cambiar puerto en backend/main.py o usar:
uvicorn main:app --port 8001
```

### "Cannot GET /contratos" (Frontend error)
- Confirmar que el backend está running
- Verificar `NEXT_PUBLIC_API_URL` en frontend/.env.local
- Revisar CORS en el backend

### """Token inválido" o "401 Unauthorized"
- El token del JWT expiró (120 minutos por defecto)
- Hacer logout en http://localhost:3000 y login nuevamente
- O restar las variables de JWT en .env

### "Código de registro inválido"
- El código debe estar **activo** en `/admin/codigos`
- Los códigos se marcan como "usados" después del primer uso
- El admin debe generar un código nuevo

---

## 📊 Machine Learning: Isolation Forest

**Parámetros:**
- n_estimators: 200 árboles
- contamination: 0.01 - 0.49 (1% - 49%)
- random_state: 42 (reproducible)

**Features analizados:**
1. Valor del contrato
2. Duración en días
3. Número de ofertas
4. Número de proponentes
5. Número de modificaciones
6. Longitud del título
7. Longitud de la descripción
8. Longitud del nombre del proveedor

**Interpretación de scores:**
- Score < -0.1 → **Anomalía alta** (muy anómalo)
- -0.1 ≤ Score < 0 → **Anomalía media** (ligeramente anómalo)
- Score ≥ 0 → **Normal** (comportamiento esperado)

---

## 🚢 Despliegue a Producción

### Con Docker:
```bash
docker-compose up --build
```

### Manual en servidor:
```bash
# Backend
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
gunicorn backend.main:app -w 4 -b 0.0.0.0:8000

# Frontend
cd frontend
npm install
npm run build
npm start
```

---

## 📞 Soporte

Para reportar bugs o pedir features, abrir un issue en GitHub.

---

**Última actualización:** Mayo 2026
**Versión:** 0.1.0 Beta
