#!/bin/sh
# Runs via nginx's /docker-entrypoint.d/ hook before nginx starts, so each
# container start picks up whatever env vars docker-compose injected -
# same build, different config per environment (see generate-config.js).
set -eu

node /app/generate-config.js /usr/share/nginx/html/config.json
