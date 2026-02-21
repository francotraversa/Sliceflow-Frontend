# Etapa 1: Construcción
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y buildeamos
COPY . .
RUN npm run build

# Etapa 2: Servir con Nginx (Producción)
FROM nginx:alpine

# Copiamos los archivos estáticos desde la etapa de build
# OJO: Si usas Vite, la carpeta suele ser /dist. Si usas CRA, es /build.
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80 (puerto por defecto de Nginx)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]