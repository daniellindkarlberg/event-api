import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { koaJwtSecret } from 'jwks-rsa';
import jwt from 'koa-jwt';
import http from 'http';
import { MessageController } from './controllers';
import { router } from './routes';
import 'dotenv/config';

const PORT = 8626;
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
        jwksUri: 'https://event-dlk.eu.auth0.com/.well-known/jwks.json',
      }),
      audience: 'https://dlk-event.site',
      issuer: 'https://event-dlk.eu.auth0.com/',
      algorithms: ['RS256'],
    }),
  )
  .use(bodyParser())
  .use(router.routes());

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
