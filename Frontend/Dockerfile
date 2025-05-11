# Stage 1: Build the app
FROM node:20-alpine as build

WORKDIR /app

# Set build arguments and environment variables
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=${VITE_API_URL}

# Install npm with specific version to avoid conflicts
RUN npm install -g npm@10.8.2

# Copy package files first
COPY package*.json ./

# Enhanced npm install with retries, timeout configuration, and legacy peer deps
RUN echo "Installing dependencies with enhanced configuration..." && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 100000 && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-timeout 300000 && \
    npm install --legacy-peer-deps || \
    npm install --legacy-peer-deps --no-fund || \
    # Final fallback with more aggressive options
    npm install --legacy-peer-deps --force --no-package-lock

# Copy the rest of the code
COPY . .

# Create production .env file with explicit Docker service name
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production && \
    echo "Created .env.production with VITE_API_URL=$VITE_API_URL"

# Add runtime environment script to adjust API URL at runtime
RUN echo 'window.RUNTIME_API_URL = "http://localhost:5000";' > /app/public/env-config.js

# Build the app (without passing --legacy-peer-deps to Vite)
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public/env-config.js /usr/share/nginx/html/env-config.js

# Add runtime configuration script
RUN echo 'const updateRuntimeConfig = () => { \
    if (window.location.hostname === "localhost") { \
        window.RUNTIME_API_URL = "http://localhost:5000"; \
    } else { \
        window.RUNTIME_API_URL = `//${window.location.hostname}:5000`; \
    } \
};' > /usr/share/nginx/html/update-config.js

# Add nginx config for SPA routing with environment variable support
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]