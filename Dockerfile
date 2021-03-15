FROM node:10.13.0-alpine

ENV ENV_NAME prod
ENV NODE_ENV prod
ENV NODE_CONFIG_ENV prod

WORKDIR /usr/src/app
COPY package.json .
RUN npm install
ADD . /usr/src/app
RUN npm run build
CMD [ "npm", "start" ]