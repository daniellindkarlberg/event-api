import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { koaJwtSecret } from 'jwks-rsa';
import jwt from 'koa-jwt';
import http from 'http';
import { MessageController } from './controllers';
import { router } from './routes';
import 'dotenv/config';

const { PORT, AUTH0_DOMAIN, AUTH0_AUDIENCE } = process.env;

const port = PORT;

const app = new Koa();

const server = http.createServer(app.callback());
const messageController = new MessageController(server);
messageController.init();

app
  .use(cors({ origin: '*', credentials: true }))
  .use((ctx, next) =>
    next().catch((err) => {
      if (err.status === 401) {
        ctx.status = 401;
        ctx.body = 'Unauthorized';
      } else {
        throw err;
      }
    }),
  )
  .use(
    jwt({
      secret: koaJwtSecret({
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 36000000,
        jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      audience: AUTH0_AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    }).unless({ path: [/^\/v1\/ping$/] }),
  )
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

server.listen(port, () => console.log(`Server running on ${port}`));
