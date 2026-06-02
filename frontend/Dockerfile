# Étape 1 : Compilation de l'application React
FROM node:18-alpine AS build
WORKDIR /app

# Copie des fichiers package du frontend (Le contexte Docker étant le dossier frontend/)
COPY package*.json ./
RUN npm install

# Copie de tout le code source du dossier frontend
COPY . .
RUN npm run build

# Étape 2 : Serveur Web de Production (Nginx)
FROM nginx:alpine

# Copie des fichiers statiques compilés de React vers Nginx
# Pour Create React App, c'est bien /app/build
COPY --from=build /app/build /usr/share/nginx/html

# Copie du fichier de configuration du Reverse Proxy Nginx (optionnel)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]