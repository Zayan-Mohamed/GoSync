FROM node:20-alpine

# Create app directory
WORKDIR /app

# Set environment variables and build args
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Install specific npm version for consistency
RUN npm install -g npm@10.8.2

# Copy package files
COPY package*.json ./

# Configure npm for better network resilience (fixing invalid option)
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 100000 && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-timeout 300000

# Install dependencies with multiple fallback methods and increased network timeout
RUN echo "Installing dependencies..." && \
    npm install --production --legacy-peer-deps || \
    npm install --production --no-fund --legacy-peer-deps || \
    npm install --production --no-fund --legacy-peer-deps --no-package-lock || \
    # Final fallback with force flag
    npm install --production --legacy-peer-deps --force --no-package-lock

# Copy the rest of the application
COPY . .

# Create directories for uploads and logs if they don't exist
RUN mkdir -p uploads/profile-images
RUN mkdir -p logs

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]