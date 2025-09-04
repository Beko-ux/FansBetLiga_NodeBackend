# Utilise une image Node officielle
FROM node:18

# Crée et définit le dossier de travail
WORKDIR /app

# Copie package.json et package-lock.json
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie tout le code
COPY . .

# Expose le port défini dans ton .env
EXPOSE 3000

# Démarre ton app
CMD ["npm", "start"]
