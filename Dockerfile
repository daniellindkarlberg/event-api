FROM node:alpine as builder

RUN apk update

RUN mkdir /app

WORKDIR /app

COPY package.json /app

COPY . /app

RUN npm install

RUN npm run build

EXPOSE 8626

CMD [ "node", "dist/app.js" ]