FROM node:24-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@11.10.0

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Development server with local source files mounted by Compose.
FROM dependencies AS development
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
CMD ["pnpm", "exec", "next", "dev", "--webpack", "--hostname", "0.0.0.0"]

# Run Drizzle migrations in Compose before starting the production server.
FROM dependencies AS migrator
COPY . .
CMD ["pnpm", "db:migrate"]

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
