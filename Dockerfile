# 1. React uygulamasını build et
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Build edilmiş dosyaları Nginx ile serve et
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Opsiyonel: custom nginx.conf kopyalayabilirsin
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
