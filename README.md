# 🚀 IntegraJobs - Portal de Empleo

Bienvenido al repositorio de IntegraJobs. Para facilitar el entorno de desarrollo y evitar configuraciones manuales de bases de datos o variables de entorno, este proyecto está completamente dockerizado.

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu sistema antes de comenzar:
1. **Docker y Docker Compose** (Docker Desktop en Windows/Mac, o Docker Engine en Linux).
2. **Git**.

## 🛠️ Cómo levantar el proyecto por primera vez

Sigue estos pasos para clonar e iniciar el entorno local de desarrollo:

1. **Clona el repositorio y entra directamente a la rama de trabajo:**
   ```bash
   git clone [https://github.com/Harpin067/IntegraJobs.git](https://github.com/Harpin067/IntegraJobs.git)
   cd IntegraJobs
   git checkout desarrollo

    Levanta los contenedores:
    Ejecuta el siguiente comando en la raíz del proyecto:
    Bash

    docker-compose up -d --build

    Nota: La primera vez este proceso puede tardar unos minutos mientras se descargan las imágenes de Node.js y PostgreSQL. Una vez que los contenedores estén arriba, Prisma sincronizará automáticamente la base de datos gracias a la configuración interna, por lo que no necesitas correr migraciones manuales.

    Verifica que el sistema esté funcionando:

        Backend/API: http://localhost:3000

💡 Comandos Útiles de Docker

Si necesitas interactuar con el entorno, aquí tienes los comandos más utilizados (ejecútalos siempre en la raíz del proyecto):

    Ver los logs en tiempo real (útil para ver errores del Backend):
    Bash

docker-compose logs -f api

Ver el estado de los contenedores:
Bash

docker-compose ps

Apagar el proyecto (sin perder la base de datos):
Bash

docker-compose stop

Reiniciar el proyecto completo desde cero (Si necesitas borrar volúmenes y empezar limpio):
Bash

    docker-compose down -v && docker-compose up -d --build

Nota para el equipo de desarrollo: El archivo .env ya se encuentra incluido en este repositorio y el docker-compose.yml está preconfigurado para el entorno de desarrollo (NODE_ENV=development). No es necesario que configures credenciales ni variables de conexión manualmente para empezar a programar.
