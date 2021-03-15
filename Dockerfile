
FROM node:12.4-alpine
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN yarn
COPY . /app
RUN yarn build
RUN yarn install --prod

CMD ["node", "dist/app.js"]
EXPOSE 8626