FROM node:22-alpine

# Install Litestream (continuous SQLite backup/restore to S3-compatible storage).
ARG LITESTREAM_VERSION=0.3.13
RUN apk add --no-cache wget ca-certificates \
 && wget -q "https://github.com/benbjohnson/litestream/releases/download/v${LITESTREAM_VERSION}/litestream-v${LITESTREAM_VERSION}-linux-amd64.tar.gz" \
 && tar -C /usr/local/bin -xzf "litestream-v${LITESTREAM_VERSION}-linux-amd64.tar.gz" \
 && rm "litestream-v${LITESTREAM_VERSION}-linux-amd64.tar.gz"

WORKDIR /app
COPY index.js .
COPY litestream.yml /etc/litestream.yml
COPY start.sh .
RUN chmod +x start.sh

# Keep the DB on a path the start script and app agree on.
ENV DB_PATH=/data/paymint.db

EXPOSE 3000
CMD ["./start.sh"]
