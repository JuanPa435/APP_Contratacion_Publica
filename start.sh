#!/bin/bash
set -e

echo "🚀 Iniciando setup de APP Contratacion Publica..."

# Crear .env si no existe
if [ ! -f "backend/.env" ]; then
    echo "📝 Creando archivo .env desde plantilla..."
    cp backend/.env.example backend/.env
    echo "⚠️  Actualiza backend/.env con tus valores reales antes de arrancar"
fi

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "🔧 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
echo "📦 Instalando dependencias..."
pip install --upgrade pip setuptools wheel
pip install -r backend/requirements.txt

# Ejecutar migraciones (si existen)
# alembic upgrade head

echo "✅ Setup completado. Iniciando servidor..."
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
