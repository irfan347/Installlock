FROM node:22-alpine
WORKDIR /app
COPY index.js .
EXPOSE 3000
CMD ["node","--experimental-sqlite","index.js"]
