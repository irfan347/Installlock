FROM node:22-alpine
WORKDIR /app
COPY . .
RUN apk add --no-cache unzip && (unzip -o project.zip -d extracted || true)
EXPOSE 3000
CMD sh -c 'APP=$(dirname $(dirname $(find . -path "*/src/server.js" | head -1))); cd "$APP"; node --experimental-sqlite src/seed.js; node --experimental-sqlite src/server.js'
