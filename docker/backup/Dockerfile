FROM alpine:3.21

# tini as PID 1: plain `crond -f` as PID 1 fails on setpgid() when forking
# jobs (no process group leader) - tini provides proper init semantics.
RUN apk add --no-cache postgresql17-client dcron tini

COPY crontab /etc/crontabs/root
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh && \
    mkdir -p /backups

VOLUME ["/backups"]

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["crond", "-f", "-l", "2"]
