# syntax=docker/dockerfile:1

FROM node:22-bookworm AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

EXPOSE 3000

# CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
CMD ["npm", "run", "start"]
