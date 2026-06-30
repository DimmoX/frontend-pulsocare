# ==========================================
# Etapa 1: Compilación (Build)
# ==========================================
FROM node:20-alpine AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de dependencias y descargar todo
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y compilar para producción
COPY . .
RUN npm run build --configuration=production

# ==========================================
# Etapa 2: Servidor (Nginx)
# ==========================================
FROM nginx:alpine

# Reemplazar la configuración por defecto de Nginx con la nuestra
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Limpiar la carpeta html por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar los archivos compilados de la Etapa 1 a Nginx
# OJO: Cambia "front-pulsocare" si tu carpeta dist/ se llama diferente.
# En Angular 17+, la ruta suele incluir "/browser" al final.
COPY --from=build /app/dist/front-pulsocare/browser /usr/share/nginx/html

# Exponer el puerto 80 para acceder a la web
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
