# =====================================================
# Dockerfile Backend Ooryxx - Simplifié
# =====================================================

FROM node:20-alpine

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Créer dossier uploads
RUN mkdir -p uploads

# Port
EXPOSE 5000

# Démarrer
CMD ["npm", "start"]
