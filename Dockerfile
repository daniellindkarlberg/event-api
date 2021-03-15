
FROM node:alpine as builder
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN yarn
COPY . /app
RUN yarn build
RUN yarn install --prod

CMD ["node", "dist/app.js"]
EXPOSE 8626