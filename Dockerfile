# Build Stage for Backend
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
# We don't strictly need to run tsc here as we'll use tsx in the final image, 
# but it's good for verification if we wanted it.
# RUN npm run build:server

# Build Stage for Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Final Production Image
FROM node:20-alpine
WORKDIR /app

# Copy server dependencies and source
COPY --from=server-builder /app/server /app/server

# Copy built frontend to the expected location for the server
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose the application port
EXPOSE 5000

# Set the environment and start the application
WORKDIR /app/server
ENV NODE_ENV=production
CMD ["npx", "tsx", "server.ts"]
