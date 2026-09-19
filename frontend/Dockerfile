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
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]




