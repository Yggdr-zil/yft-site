# ---- Build Stage (frontend) ----
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Build Stage (server) ----
FROM node:20-alpine AS server-build

WORKDIR /server
COPY server/package.json ./
RUN npm install --omit=dev

# ---- Serve Stage ----
FROM nginx:stable-alpine

# Install Node.js for the contact server
RUN apk add --no-cache nodejs

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

COPY server/index.js /opt/contact-server/index.js
COPY --from=server-build /server/node_modules /opt/contact-server/node_modules
COPY server/package.json /opt/contact-server/package.json

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["/docker-entrypoint.sh"]
