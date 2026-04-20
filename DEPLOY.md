# 🚀 Guía de Despliegue IntegraJobs (Ubuntu)

> Esta guía está pensada para que **cualquier persona**, incluso sin experiencia
> previa con Node o Docker, pueda levantar el proyecto en una máquina Ubuntu
> limpia copiando y pegando cada bloque de comandos. Si sigues los pasos en
> orden, funcionará. Si algo falla, ve a la sección **⚠️ Problemas comunes**
> al final.

---

## 📋 Paso 0 — Prerrequisitos (Ubuntu 22.04 / 24.04)

Copia y pega este bloque completo. Instala `git`, `curl`, Node.js 20 LTS y Docker:

```bash
# 1. Actualizar índice de paquetes
sudo apt update && sudo apt upgrade -y

# 2. Herramientas básicas
sudo apt install -y git curl ca-certificates gnupg lsb-release

# 3. Node.js 20 LTS (vía NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Docker Engine + Docker Compose plugin
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Permitir a tu usuario usar docker sin sudo (¡importante!)
sudo usermod -aG docker $USER
newgrp docker
```

Verifica las versiones:

```bash
node -v      # → debería mostrar v20.x.x
docker -v    # → Docker version 27.x.x (o superior)
docker compose version  # → v2.x.x
```

---

## 📥 Paso 1 — Clonar el proyecto

```bash
git clone https://github.com/<tu-org>/integrajobs.git
cd integrajobs
```

---

## 🔐 Paso 2 — Configurar variables de entorno

El proyecto trae un `.env.example`. Cópialo como `.env`:

```bash
cp .env.example .env
```

Abre el archivo y revísalo (para desarrollo local los valores por defecto ya
funcionan, no necesitas cambiarlos):

```bash
nano .env     # o el editor que prefieras
```

**Punto crítico:** la línea `DATABASE_URL` **debe** apuntar al puerto `5434`.
Ese es el puerto que Docker expone al host. Si lo cambias a `5432` no funcionará.

```env
DATABASE_URL="postgresql://portal:portal_secret@localhost:5434/portal_db"
```

---

## 📦 Paso 3 — Instalar dependencias

Dos instalaciones: una en la raíz (para Prisma + seed) y otra en el backend.

```bash
# Dependencias raíz (Prisma CLI + script de seed)
npm install

# Dependencias del backend
cd backend
npm install
cd ..
```

---

## 🐳 Paso 4 — Levantar PostgreSQL en Docker

Solo levanta la base de datos (no el backend todavía):

```bash
docker compose up db -d
```

Verifica que esté sana:

```bash
docker compose ps
```

Deberías ver el servicio `portal_db` con estado `healthy`. Si todavía dice
`starting`, espera 10 segundos y vuelve a consultar.

Comprueba conectividad al puerto 5434:

```bash
docker compose exec db pg_isready -U portal -d portal_db
# → /var/run/postgresql:5432 - accepting connections
```

---

## ✨ Paso 5 — Magia de Prisma: esquema + seed

Estos comandos se ejecutan **desde el host**, no dentro del contenedor:

```bash
# 5.1 — Generar el cliente de Prisma
npx prisma generate

# 5.2 — Empujar el esquema a la base de datos
npx prisma db push

# 5.3 — Ejecutar el seed (crea los 4 usuarios)
npx prisma db seed
```

Al final deberías ver:

```
✓  SUPERADMIN   → carlos@integrajobs.sv
✓  EMPRESA      → walter@applaudo.sv
✓  CANDIDATO    → wilber@gmail.com
✓  CANDIDATO    → brian@gmail.com
✅ Seed completado — 4 usuarios creados en IntegraJobs El Salvador.
```

---

## 🔬 Paso 6 — Prueba de fuego

Verifica que los usuarios están realmente en la base de datos. Tres opciones:

### Opción A — Prisma Studio (interfaz visual, recomendada)

```bash
npx prisma studio
```

Abre tu navegador en `http://localhost:5555`, entra a la tabla `users` y
deberías ver los 4 usuarios.

### Opción B — `psql` dentro del contenedor

```bash
docker compose exec db psql -U portal -d portal_db -c \
  "SELECT email, role FROM users ORDER BY role;"
```

Salida esperada:

```
        email          |    role
-----------------------+------------
 wilber@gmail.com      | CANDIDATO
 brian@gmail.com       | CANDIDATO
 walter@applaudo.sv    | EMPRESA
 carlos@integrajobs.sv | SUPERADMIN
```

### Opción C — Consultas específicas

```bash
# Contar usuarios
docker compose exec db psql -U portal -d portal_db -c \
  "SELECT COUNT(*) AS total FROM users;"

# Verificar el SUPERADMIN
docker compose exec db psql -U portal -d portal_db -c \
  "SELECT email, nombre FROM users WHERE role = 'SUPERADMIN';"

# Verificar la empresa
docker compose exec db psql -U portal -d portal_db -c \
  "SELECT email, empresa_nombre FROM users WHERE role = 'EMPRESA';"
```

---

## 🟢 Paso 7 — Arrancar el backend

```bash
cd backend
npm run dev
```

Deberías ver algo como `API escuchando en :3000`. Pruébalo:

```bash
curl http://localhost:3000/health
```

---

## ⚠️ Problemas comunes

### «permission denied while trying to connect to the Docker daemon»
No añadiste tu usuario al grupo `docker`, o no cerraste sesión después.
Ejecuta `newgrp docker` o cierra la terminal y ábrela de nuevo.

### «port is already allocated» (5434 o 3000)
Algo más está usando ese puerto en tu máquina. Averigua qué:
```bash
sudo lsof -i :5434
sudo lsof -i :3000
```
Detén ese proceso o cambia el puerto en `docker-compose.yml` y en `.env`.

### «Can't reach database server at localhost:5434»
El contenedor `db` no está corriendo o aún no está listo. Verifica con
`docker compose ps`. Si dice `starting`, espera. Si no aparece, levántalo:
`docker compose up db -d`.

### «prisma: command not found»
No hiciste `npm install` en la raíz del proyecto. Hazlo antes de llamar a `npx prisma`.

### El seed crea datos duplicados o raros
Limpia usuarios residuales antes de volver a correr el seed:
```bash
docker compose exec db psql -U portal -d portal_db -c \
  "TRUNCATE users CASCADE;"
npx prisma db seed
```

### Quiero empezar de cero
```bash
docker compose down -v   # borra el volumen de datos
docker compose up db -d
npx prisma db push
npx prisma db seed
```

---

## ✅ Listo

Si llegaste hasta aquí sin errores, tu entorno está completamente funcional:

- 🗄️  PostgreSQL corriendo en Docker (`localhost:5434`)
- 🔗 Esquema aplicado vía Prisma
- 👥 4 usuarios de prueba cargados
- 🚀 Backend Express 5 listo en `localhost:3000`

Credenciales de prueba (todos los usuarios): **`Password123!`**
