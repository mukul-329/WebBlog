FROM dhi.io/node:26-dev AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci 
COPY . .
RUN npm run build

FROM nginx:alpine-slim AS runner
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
USER appuser
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]




