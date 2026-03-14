FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy source
COPY . .

# Expose port (Coolify sets PORT env var automatically)
EXPOSE 3000

CMD ["node", "server.js"]
