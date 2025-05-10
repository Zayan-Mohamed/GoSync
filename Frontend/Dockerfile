FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application for production
RUN npm run build

# Use a lightweight nginx image to serve the static files
FROM nginx:alpine

# Copy the build output from the previous stage
COPY --from=0 /app/dist /usr/share/nginx/html

# Copy a custom nginx configuration if needed
# COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]