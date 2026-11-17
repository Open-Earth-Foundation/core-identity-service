# Same base image family as CityCatalyst (Node 22, see .nvmrc).
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies from the lockfile.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build the app. next.config.mjs sets output: "standalone".
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime image: only the standalone server, no dev dependencies or sources.
FROM base AS release
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
