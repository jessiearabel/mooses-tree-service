#!/bin/bash

# Moose SciVis Learning Hub - Deployment Script
echo "🚀 Iniciando despliegue de Moose SciVis Learning Hub..."

# 1. Verificar archivos de entorno
echo "📝 Verificando configuración..."
if [ ! -f backend/.env ]; then
    echo "❌ FALTA: backend/.env - Copia backend/.env.example y configúralo"
    exit 1
fi

if [ ! -f frontend/.env ]; then
    echo "❌ FALTA: frontend/.env - Copia frontend/.env.example y configúralo"
    exit 1
fi

# 2. Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
pip install -r requirements.txt
cd ..

# 3. Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
yarn install
cd ..

# 4. Construir frontend para producción
echo "🏗️  Construyendo frontend..."
cd frontend
yarn build
cd ..

# 5. Verificar MongoDB
echo "🗄️  Verificando conexión a MongoDB..."
python3 -c "
import os
import sys
sys.path.append('backend')
try:
    from database import get_database
    import asyncio
    async def test():
        db = await get_database()
        print('✅ MongoDB conectado correctamente')
    asyncio.run(test())
except Exception as e:
    print(f'❌ Error MongoDB: {e}')
    exit(1)
"

# 6. Verificar PayPal
echo "💳 Verificando credenciales PayPal..."
if grep -q "your_paypal" backend/.env; then
    echo "⚠️  AVISO: Actualiza las credenciales de PayPal en backend/.env"
fi

echo "✅ Despliegue preparado correctamente!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura tu servidor web (nginx/apache)"
echo "2. Configura SSL para HTTPS"
echo "3. Inicia los servicios con supervisor o pm2"
echo "4. Configura MongoDB como servicio"
echo ""
echo "🎉 ¡Moose SciVis Learning Hub listo para producción!"