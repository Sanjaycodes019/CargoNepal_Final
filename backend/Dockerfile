# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the app code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Environment variables (optional defaults)
# Best practice: pass secrets via host/container environment, not in Dockerfile
ENV PORT=3000

# Start the server
CMD ["node", "server.js"]
