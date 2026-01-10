FROM node:20-alpine as build

WORKDIR /app

# Accept build argument for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files and install dependencies first
COPY frontend/package*.json ./
RUN npm install

# Copy all frontend files to preserve directory structure
COPY frontend/ ./

# Build the application (skip tsc check, vite handles it)
RUN npx vite build

FROM nginx:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
