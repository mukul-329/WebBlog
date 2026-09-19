FROM dhi.io/node:26-dev AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dhi.io/node:26 AS runner
WORKDIR /app
COPY . .
COPY --from=build /app/node_modules ./node_modules
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1
EXPOSE 5000
CMD ["node","index.js"]