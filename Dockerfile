FROM node:18

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Copier le dossier prisma avant npm install
COPY prisma ./prisma/

# Installer les dépendances
RUN npm install

# Copier le reste de l'application
COPY . .

# Générer le client Prisma
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]