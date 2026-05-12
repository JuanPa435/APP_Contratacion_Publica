#!/bin/bash
# Script para cargar datos SECOP desde el backend

API_URL="${1:-http://localhost:8000}"
TOKEN="${2:-}"

if [ -z "$TOKEN" ]; then
    echo "❌ Error: Se requiere el token JWT"
    echo "Uso: ./cargar_datos.sh <API_URL> <TOKEN>"
    echo ""
    echo "Pasos para obtener el token:"
    echo "1. Ir a http://localhost:3000/auth/login"
    echo "2. Registrarse con código ADMIN-BOOT-2026"
    echo "3. Copiar el token del localStorage o del response de /auth/login"
    exit 1
fi

echo "🚀 Cargando datos de SECOP..."
echo "URL: $API_URL"
echo ""

curl --fail-with-body -X POST "$API_URL/admin/importar-secop" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "✅ Datos cargados exitosamente"
echo ""
echo "Próximos pasos:"
echo "1. Ir a http://localhost:3000/dashboard"
echo "2. Ver los contratos en /contratos"
echo "3. Ejecutar análisis en /analisis"
