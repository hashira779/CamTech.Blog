# Multi-Stage Production Dockerfile for Daily Discovery Next.js Web App
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
ARG INTERNAL_API_URL="http://api:8000/api/v1"
# next.config.ts rewrites() are compiled into the routes manifest at BUILD time, so the wedding
# proxy target must be a build arg; as a runtime-only env var the proxy pointed at 127.0.0.1:8002
# inside this container and every /api/v1/wedding call answered 500.
ARG INTERNAL_WEDDING_API_URL="http://wedding-service:8000/api/v1"
ARG NEXT_PUBLIC_SITE_URL="https://blog.camtech.cam"
# No AdSense account number is baked into the image. The publisher ID is public once a page loads,
# but hard-coding it here meant a build could not be repurposed for another account and the repo
# carried a number nobody could tell was live. Empty default = ads stay off; docker-compose supplies
# the real value, and docs/monetization.md explains the rebuild each change needs.
ARG NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=""
ARG NEXT_PUBLIC_ADSENSE_ENABLED="true"
ARG NEXT_PUBLIC_ADSENSE_SLOTS=""
ARG NEXT_PUBLIC_ADSENSE_CHANNEL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV INTERNAL_WEDDING_API_URL=$INTERNAL_WEDDING_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=$NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
ENV NEXT_PUBLIC_ADSENSE_ENABLED=$NEXT_PUBLIC_ADSENSE_ENABLED
ENV NEXT_PUBLIC_ADSENSE_SLOTS=$NEXT_PUBLIC_ADSENSE_SLOTS
ENV NEXT_PUBLIC_ADSENSE_CHANNEL=$NEXT_PUBLIC_ADSENSE_CHANNEL
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
ARG INTERNAL_API_URL="http://api:8000/api/v1"
# next.config.ts rewrites() are compiled into the routes manifest at BUILD time, so the wedding
# proxy target must be a build arg; as a runtime-only env var the proxy pointed at 127.0.0.1:8002
# inside this container and every /api/v1/wedding call answered 500.
ARG INTERNAL_WEDDING_API_URL="http://wedding-service:8000/api/v1"
ARG NEXT_PUBLIC_SITE_URL="https://blog.camtech.cam"
# No AdSense account number is baked into the image. The publisher ID is public once a page loads,
# but hard-coding it here meant a build could not be repurposed for another account and the repo
# carried a number nobody could tell was live. Empty default = ads stay off; docker-compose supplies
# the real value, and docs/monetization.md explains the rebuild each change needs.
ARG NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=""
ARG NEXT_PUBLIC_ADSENSE_ENABLED="true"
ARG NEXT_PUBLIC_ADSENSE_SLOTS=""
ARG NEXT_PUBLIC_ADSENSE_CHANNEL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV INTERNAL_WEDDING_API_URL=$INTERNAL_WEDDING_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=$NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
ENV NEXT_PUBLIC_ADSENSE_ENABLED=$NEXT_PUBLIC_ADSENSE_ENABLED
ENV NEXT_PUBLIC_ADSENSE_SLOTS=$NEXT_PUBLIC_ADSENSE_SLOTS
ENV NEXT_PUBLIC_ADSENSE_CHANNEL=$NEXT_PUBLIC_ADSENSE_CHANNEL

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir -p /app/public/uploads/wedding && chown -R nextjs:nodejs /app/public
COPY --from=builder /app/package.json ./package.json

# Copy production build outputs
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
