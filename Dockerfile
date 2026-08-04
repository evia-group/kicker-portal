### build - production bundle ###
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

### dev - used by docker-compose.override.yml, full source via bind mount ###
FROM node:24-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]

### runtime - static files served by nginx, non-root on an unprivileged port ###
FROM nginx:alpine AS runtime
# Only needed to run generate-config.js at container start (reused as-is
# from local dev/CI, see generate-config.js) - no other Node.js dependency
# in this image.
RUN apk add --no-cache nodejs
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/kicker-portal/browser /usr/share/nginx/html
COPY generate-config.js package.json /app/
COPY docker/generate-runtime-config.sh /docker-entrypoint.d/40-generate-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-generate-runtime-config.sh && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /app && \
    # /run is sometimes tmpfs-remounted (root-owned) at container start, so
    # the non-root nginx user can't write the default /run/nginx.pid.
    sed -i 's#^pid .*#pid /tmp/nginx.pid;#' /etc/nginx/nginx.conf
USER nginx
EXPOSE 8080
