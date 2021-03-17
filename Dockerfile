
FROM node:14

RUN mkdir /app

WORKDIR /app

COPY package.json /app

COPY yarn.lock /app

RUN yarn

COPY . /app

RUN yarn install

RUN yarn build

EXPOSE 8080

CMD [ "node", "dist/app.js" ]
