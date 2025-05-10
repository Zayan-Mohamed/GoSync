FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Create a directory for uploads if it doesn't exist
RUN mkdir -p uploads/profile-images

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]