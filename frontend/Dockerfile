# syntax=docker/dockerfile:1.6
FROM node:20 AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build --configuration=production

FROM nginx:alpine AS final
COPY --from=build /app/dist/poddynho-app/browser /usr/share/nginx/html
EXPOSE 80
