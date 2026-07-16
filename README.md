# Rider — Red Social de Motociclistas (Fase 1 - MVP)

Este es el repositorio base del proyecto **Rider**, una red social diseñada para motociclistas de Colombia. En esta primera fase se ha implementado el núcleo de autenticación, la gestión de perfiles con motos (garaje), y el feed social básico con soporte de imágenes y comentarios.

---

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15+ (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL con **PostGIS** habilitado
- **ORM**: Prisma v5 (con soporte para índices GiST espaciales)
- **Autenticación**: Auth.js v5 (Google OAuth, Email/Password, y Celular vía OTP)
- **Estilos**: Tailwind CSS v4 (Aesthetics oscuros y glassmorphism)

---

## 🚀 Requisitos e Instalación

### 1. Clonar el repositorio y dependencias
Instala los paquetes necesarios corriendo:
```bash
npm install
```

### 2. Base de datos con PostGIS (Neon o Docker Local)
El proyecto ya está configurado por defecto con una base de datos PostgreSQL remota en **Neon** con PostGIS pre-activado para esta sesión de desarrollo.

Si prefieres usar tu propia base de datos Postgres con Docker:
1. Crea un contenedor con PostGIS:
   ```bash
   docker run --name rider-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgis/postgis
   ```
2. Asegúrate de ejecutar `CREATE EXTENSION IF NOT EXISTS postgis;` en tu cliente de base de datos.
3. Actualiza tu archivo `.env` con la URL correspondiente.

### 3. Configurar Variables de Entorno
Crea o edita tu archivo `.env` en la raíz del proyecto:
```env
# URL de conexión a la Base de Datos
DATABASE_URL="postgresql://neondb_owner:npg_gVP3KkvRUBt6@ep-withered-truth-ajpj78bx-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Claves de Autenticación
AUTH_SECRET="f6305a415fa9d4df2fb2d35bb8bcde079d8544c4b6933c06e1efad740ee3cb9f"
AUTH_URL="http://localhost:3000"

# Opcionales para Google OAuth
AUTH_GOOGLE_ID="tu-google-client-id"
AUTH_GOOGLE_SECRET="tu-google-client-secret"

# Opcionales para almacenamiento S3 (MinIO/R2) - Si no se proveen, se usará el almacenamiento local del servidor
# S3_ACCESS_KEY_ID="tu-clave-s3"
# S3_SECRET_ACCESS_KEY="tu-secreto-s3"
# S3_BUCKET_NAME="tu-bucket"
# S3_ENDPOINT="tu-endpoint"
```

### 4. Sincronizar la Base de Datos
Para generar el cliente de Prisma y estructurar la base de datos:
```bash
npx prisma@5 db push
```

---

## 💻 Desarrollo Local

Para correr el servidor de desarrollo:
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 📱 Módulos Implementados en Fase 1

1. **Autenticación Biker**:
   - Registro/Login por Correo y Contraseña.
   - Login por **Celular vía OTP**. En desarrollo local, al ingresar un teléfono, el código se imprime directamente en la terminal (consola del servidor de Next.js) y se retorna opcionalmente en la respuesta de API para agilizar el testeo.
   - Login con Google.
2. **Mi Garaje (Motos)**:
   - CRUD interactivo para registrar tus motos en tu perfil. Especifica marca, modelo, cilindraje, año y foto.
3. **Feed Social**:
   - Creación de posts de texto con adjunto de hasta 4 imágenes (con subida real de archivos y fallback local).
   - Likes interactivos y sección de comentarios en tiempo real.
