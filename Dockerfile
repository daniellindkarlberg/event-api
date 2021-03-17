
FROM node:14

ENV NODE_ENV=production

RUN mkdir /app

WORKDIR /app

COPY package.json /app

COPY yarn.lock /app

RUN yarn

COPY . /app

RUN yarn build

RUN yarn install --production

EXPOSE 8080

CMD [ "node", "dist/app.js" ]


