FROM node:24-slim

WORKDIR /app

COPY package*.json .

RUN npm i

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "start:dev" ]
