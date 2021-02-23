import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { koaJwtSecret } from 'jwks-rsa';
import jwt from 'koa-jwt';
import http from 'http';
import { MessageController } from '../src/controllers';
import { router } from './routes';
import * as dotenv from 'dotenv';

dotenv.config();

const { PORT, AUTH0_AUDIENCE, AUTH0_DOMAIN } = process.env;
const app = new Koa();

const server = http.createServer(app.callback());
const messageController = new MessageController(server);
messageController.init();

app
  .use(cors({ origin: '*', credentials: true }))
  .use(
    jwt({
      secret: koaJwtSecret({
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 36000000,
        jwksUri: `${AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      audience: AUTH0_AUDIENCE,
      issuer: `${AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    }),
  )
  .use(bodyParser())
  .use(router.routes());

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
