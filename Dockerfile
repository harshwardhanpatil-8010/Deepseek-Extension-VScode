# Filename: Dockerfile
# This Dockerfile is optimized for a production Node.js application.
# It uses a multi-stage build to create a small, secure, and efficient image.

# ---- Base Stage ----
# Use a specific version of Node.js on a lean OS (Alpine) for the base.
FROM node:20-alpine AS base

# Set the working directory.
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
# This stage is dedicated to installing NPM dependencies.
# Caching this layer speeds up subsequent builds if dependencies haven't changed.
FROM base AS dependencies

# Copy package.json and package-lock.json (or yarn.lock, etc.)
COPY package*.json ./

# Install production dependencies using 'npm ci' for deterministic builds.
RUN npm ci --omit=dev

# ---- Build Stage ----
# This stage builds the application (e.g., transpiling TypeScript).
# If your app doesn't have a build step, you can skip this and merge it into the 'dependencies' stage.
FROM base AS build

# Copy source code and install ALL dependencies (including devDependencies).
COPY . .
RUN npm install

# Run the build script defined in package.json.
RUN npm run build

# ---- Production Stage ----
# This is the final, lean image that will be deployed.
FROM base AS production

# Set NODE_ENV to production.
ENV NODE_ENV=production

# Create a non-root user for security.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy installed production dependencies from the 'dependencies' stage.
COPY --chown=appuser:appgroup --from=dependencies /usr/src/app/node_modules ./node_modules

# Copy built application code from the 'build' stage.
# Adjust the source path (e.g., './dist') if your build script outputs to a specific folder.
COPY --chown=appuser:appgroup --from=build /usr/src/app/dist ./dist
COPY --chown=appuser:appgroup package.json ./

# Switch to the non-root user.
USER appuser

# Expose the application port.
EXPOSE 3000

# Healthcheck to ensure the container is running properly.
# Replace '/health' with your actual health check endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD [ "wget", "-qO-", "http://localhost:3000/health" ] || exit 1

# Start the application.
# Using 'node' directly is better than 'npm start' for signal handling (e.g., CTRL+C).
CMD [ "node", "dist/server.js" ]
