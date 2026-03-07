FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# --- Build stage ---
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# --- Production stage ---
FROM base AS production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

CMD ["node", "dist/index.js"]
