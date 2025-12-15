FROM node:25

WORKDIR /app

COPY ./config ./config
COPY ./server ./server

WORKDIR /app/server
RUN npm i

CMD ["npm", "start"]
