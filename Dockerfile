FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server/index.js ./server/index.js
COPY server/package.json ./server/package.json
RUN cd server && npm install --production
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server/index.js"]
