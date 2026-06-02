FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json npm-shrinkwrap.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm ci

COPY . .
RUN npm ci && npm run build

# Runtime image
FROM node:24-alpine

RUN apk add --no-cache \
    xdg-utils \
    xdotool \
    xclip \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/electron-builder.yml ./electron-builder.yml

# Expose for debugging
EXPOSE 5173

# Default: run the Electron app
# For headless/RPC mode, override CMD
CMD ["node", "dist/main/index.js"]
