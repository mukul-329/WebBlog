FROM dhi.io/node:26-dev AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dhi.io/node:26 AS runner
WORKDIR /app
COPY . .
COPY --from=build /app/node_modules ./node_modules
USER appuser
EXPOSE 5000
CMD ["node","index.js"]