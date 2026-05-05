# Frontend - APP Contratación Pública

Frontend profesional en Next.js para la plataforma de detección de irregularidades en contratación pública.

## Características

✅ **Autenticación segura** - Login y registro con JWT
✅ **Dashboard intuitivo** - Resumen de contratos y alertas en tiempo real
✅ **Gestión de contratos** - Visualización y búsqueda con filtros
✅ **Alertas interactivas** - Visualización de anomalías detectadas
✅ **Análisis en tiempo real** - Ejecución del modelo Isolation Forest
✅ **Panel administrativo** - Gestión de usuarios y códigos de invitación
✅ **Diseño responsive** - Optimizado para desktop, tablet y móvil
✅ **Interfaz moderna** - Tailwind CSS + componentes reutilizables

## Tecnologías

- **Framework**: Next.js 14 (React 18)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **API**: Axios
- **Iconos**: React Icons
- **Gráficos**: Recharts

## Estructura de carpetas

```
frontend/
├── app/
│   ├── auth/              # Páginas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Dashboard principal
│   ├── contratos/         # Gestión de contratos
│   ├── alertas/           # Visualización de alertas
│   ├── analisis/          # Panel de análisis
│   ├── admin/             # Panel administrativo
│   ├── layout.tsx         # Layout raíz
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── Navbar.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── api.ts             # Cliente HTTP con axios
│   └── auth.ts            # Store de autenticación (Zustand)
├── public/                # Archivos estáticos
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Instalación rápida

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar variables de entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

(Cambiar URL según donde esté desplegado el backend)

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Acceder a http://localhost:3000

## Páginas principales

### `/login`
Autenticación de usuarios existentes
- Requiere email y contraseña
- Genera JWT que se guarda en localStorage
- Redirige a dashboard tras login exitoso

### `/auth/register`
Registro de nuevos usuarios
- Requiere código de invitación válido
- El admin debe generar este código previamente
- Se puede pasar código por URL: `/auth/register?code=CODIGO123`

### `/dashboard`
Dashboard principal con estadísticas
- Resumen de contratos, anomalías y alertas
- Acciones rápidas a otras secciones
- Información del usuario y su rol

### `/contratos`
Gestión de contratos SECOP
- Tabla con búsqueda y filtros
- Filtrar solo anomalías detectadas
- Ver score de anomalía por contrato
- Click para ver detalles

### `/alertas`
Alertas generadas por el análisis
- Filtrar por nivel (alta, media, baja)
- Mostrar mensaje y score de la anomalía
- Ordenadas por fecha más reciente
- Colores diferenciados por severidad

### `/analisis`
Ejecución del modelo de análisis
- Control de tasa de contaminación (0.01 - 0.49)
- Botón para ejecutar Isolation Forest
- Resultados con porcentaje de anomalías detectadas
- Estadísticas del análisis realizado

### `/admin`
Panel administrativo (solo admins)
- **Tab Códigos**: Crear y gestionar códigos de invitación
  - Generar códigos nuevos para diferentes roles
  - Ver estado (activo/usado) de cada código
  - Copiar código al portapapeles
- **Tab Usuarios**: Listar todos los usuarios del sistema
  - Ver nombre, email y rol
  - Diferenciar admins del resto

## Flujo de autenticación

1. **Sin cuenta**: Usuario va a `/login` o `/auth/register`
2. **Registro**: Necesita código de invitación generado por admin en `/admin`
3. **Login**: Se obtiene JWT que se envía en headers Authorization
4. **Protected routes**: Sidebar + Navbar solo si token válido
5. **Logout**: Limpia token y localStorage, redirige a `/login`

## Componentes principales

### `Navbar`
- Muestra nombre y rol del usuario actual
- Botón de logout
- Indicador visual del rol

### `Sidebar`
- Navegación entre secciones
- Menú adaptativo según rol del usuario
- Indicador de página activa
- Items solo visibles para rol admin

## Integración con API

El cliente HTTP está preconfigurado en `lib/api.ts`:
- Intercepta requests para agregar JWT en headers
- Intercepta respuestas para redirigir a login si 401
- Base URL configurable via env variable

Ejemplo de uso:

```typescript
import api from '@/lib/api'

const { data } = await api.get('/contratos')
await api.post('/analisis/ejecutar', { contamination: 0.12 })
```

## Store de autenticación

Usando Zustand en `lib/auth.ts`:

```typescript
import { useAuth } from '@/lib/auth'

const { user, token, login, logout, getMe } = useAuth()
```

Proporciona:
- `user`: Objeto usuario actual
- `token`: JWT actual
- `isLoading`: Estado de carga
- `error`: Último error
- Métodos: `login()`, `register()`, `logout()`, `getMe()`

## Build para producción

```bash
npm run build
npm start
```

## Troubleshooting

### Error "No autenticado" en todas las páginas
- Verificar que `NEXT_PUBLIC_API_URL` es correcto
- Confirmar que el backend está running
- Limpiar localStorage: `localStorage.clear()`

### Código de invitación invalido en registro
- El código debe estar activo en `/admin/codigos`
- Los códigos después del primer uso quedan inactivos
- Admin debe generar uno nuevo

### La tabla de contratos no carga
- Confirmar que el usuario no es nuevo (su JWT es válido)
- Verificar CORS en el backend (`app.add_middleware(CORSMiddleware...)`)

## Mejoras futuras

- [ ] Gráficos avanzados con Recharts
- [ ] Exportar datos a CSV/Excel
- [ ] Filtros avanzados por propiedades del contrato
- [ ] Historial de análisis guardados
- [ ] Notificaciones push en tiempo real
- [ ] Dark mode
- [ ] Internacionalización (i18n)

## Soporte

Para soporte o reportar bugs, abrir un issue en el repositorio.
