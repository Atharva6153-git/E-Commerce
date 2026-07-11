FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source code
COPY . .

# Expose port
EXPOSE 4001

# Start application
CMD ["node", "server.js"]
