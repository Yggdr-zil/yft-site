# ---- Build Stage (frontend) ----
FROM node:20-alpine AS build

RUN apk add --no-cache python3

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && python3 inject_auth_gate.py && python3 build_portals.py

# ---- Build Stage (server) ----
FROM node:20-alpine AS server-build

WORKDIR /server
COPY server/package.json ./
RUN npm install --omit=dev

# ---- Serve Stage ----
FROM nginx:stable-alpine

# Install Node.js for the auth + contact server
RUN apk add --no-cache nodejs

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Marketing site + deck folders
COPY --from=build /app/dist /usr/share/nginx/html

# Override docs with latest PDFs (bypasses build cache)
COPY public/docs/ /usr/share/nginx/html/docs/

# Server files
COPY server/index.js  /opt/contact-server/index.js
COPY server/auth.js   /opt/contact-server/auth.js
COPY server/funds.template.json /opt/contact-server/funds.template.json
COPY --from=server-build /server/node_modules /opt/contact-server/node_modules
COPY server/package.json /opt/contact-server/package.json

# Portal template (used for dynamic portal rendering at runtime)
COPY investor-portal.html /opt/contact-server/investor-portal.html

# Create persistent data directory (override with -v /host/path:/data)
RUN mkdir -p /data

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=8080
ENV DATA_DIR=/data
# Set UPSTREAM_API at runtime to your Cloudflare Tunnel URL for the live API:
# docker run -e UPSTREAM_API=https://api.yggfin.tech ...
# Default points at a loopback port nobody listens on → clean 502 if not configured.
ENV UPSTREAM_API="http://127.0.0.1:65535"

EXPOSE ${PORT}

ENTRYPOINT ["/docker-entrypoint.sh"]
