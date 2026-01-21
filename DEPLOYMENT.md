# 🦌 Moose SciVis Learning Hub - Deployment Guide

## 📋 Requisitos del Servidor

### Mínimos:
- **RAM:** 2GB mínimo, 4GB recomendado
- **Almacenamiento:** 5GB mínimo, 10GB recomendado
- **CPU:** 1 core mínimo, 2 cores recomendado

### Software necesario:
- **Python 3.9+**
- **Node.js 16+** 
- **MongoDB 5.0+**
- **Nginx** (servidor web)
- **SSL/TLS** (para PayPal)

## 🚀 Despliegue en VPS

### 1. Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y python3 python3-pip nodejs npm nginx mongodb

# Instalar yarn
npm install -g yarn

# Instalar supervisor
sudo apt install supervisor
```

### 2. Configurar la aplicación

```bash
# Clonar o subir código
cd /var/www/
sudo git clone [tu-repositorio] moose-learning-hub
cd moose-learning-hub

# Copiar y configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar configuraciones
sudo nano backend/.env
sudo nano frontend/.env
```

### 3. Variables de entorno críticas

#### backend/.env:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="arborist_platform"
JWT_SECRET="tu-clave-jwt-super-segura-aqui"
ADMIN_PASSWORD="tu-password-admin-seguro"
PAYPAL_CLIENT_ID="tu_client_id_paypal"
PAYPAL_CLIENT_SECRET="tu_client_secret_paypal"
FRONTEND_URL="https://tudominio.com"
```

#### frontend/.env:
```env
REACT_APP_BACKEND_URL=https://tudominio.com
```

### 4. Ejecutar script de despliegue

```bash
sudo ./deploy.sh
```

### 5. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/moose-learning-hub
```

Agregar configuración:
```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Frontend (React)
    location / {
        root /var/www/moose-learning-hub/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/moose-learning-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Configurar SSL con Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

### 7. Configurar servicios con Supervisor

```bash
sudo nano /etc/supervisor/conf.d/moose-backend.conf
```

```ini
[program:moose-backend]
command=/usr/bin/python3 -m uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/moose-learning-hub/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/moose-backend.err.log
stdout_logfile=/var/log/supervisor/moose-backend.out.log
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start moose-backend
```

## 🔒 Seguridad

### Checklist de seguridad:
- [ ] Cambiar JWT_SECRET por uno único y seguro
- [ ] Cambiar ADMIN_PASSWORD por uno fuerte
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall (UFW)
- [ ] Configurar MongoDB con autenticación
- [ ] PayPal en modo producción (no sandbox)

## 📊 Monitoreo

### Verificar servicios:
```bash
# Backend
curl http://localhost:8001/api/health

# Frontend 
curl https://tudominio.com

# MongoDB
sudo systemctl status mongodb

# Nginx
sudo systemctl status nginx
```

### Logs importantes:
- Backend: `/var/log/supervisor/moose-backend.err.log`
- Nginx: `/var/log/nginx/access.log`
- MongoDB: `/var/log/mongodb/mongodb.log`

## 🆘 Troubleshooting

### Problema común: CORS
Si hay errores CORS, verificar que `FRONTEND_URL` en backend/.env coincida exactamente con tu dominio.

### Problema común: PayPal
Para producción, cambiar `PAYPAL_MODE="live"` y usar credenciales de producción.

### Problema común: MongoDB
Verificar que MongoDB esté corriendo: `sudo systemctl status mongodb`

## 📞 Soporte

- **Desarrollado por:** Scivis Innovations
- **Documentación:** Ver archivos de código para detalles técnicos

---

¡Moose SciVis Learning Hub listo para producción! 🎉