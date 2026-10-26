# Multi-stage build para Prisma Web (React 19 + Vite + Tailwind CSS)

# Etapa 1: Compilacion de estaticos con Node.js 20
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci || npm install

# Copiar codigo fuente y construir para produccion
COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero con Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Limpiar archivos por defecto y copiar build
RUN rm -rf ./*
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
