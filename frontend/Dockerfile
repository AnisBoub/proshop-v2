# Étape 1 : Build de l'application React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur de production Nginx
FROM nginx:alpine
# Copie des fichiers compilés de React
COPY --from=build /app/build /usr/share/nginx/html

# CORRECTION : On copie le fichier nginx.conf dans le dossier de configuration d'Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]