FROM node:25

WORKDIR /app

COPY ./config ./config
COPY ./server ./server

WORKDIR /app/server
RUN npm i && npm run build

CMD ["node", "build/server/src/index.js"]
