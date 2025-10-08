# Stage 1: Build the React application
FROM node:20-alpine as build

# Accept the VITE_API_BASE_URL build argument from docker-compose
ARG VITE_API_BASE_URL

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application for production
# Make the build argument available as an environment variable for the build command
RUN VITE_API_BASE_URL=${VITE_API_BASE_URL} npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Remove default nginx configs
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for the Nginx server
EXPOSE 80

# The default Nginx command will start the server
CMD ["nginx", "-g", "daemon off;"]
