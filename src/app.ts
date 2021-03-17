import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { koaJwtSecret } from 'jwks-rsa';
import jwt from 'koa-jwt';
import { router } from './routes';
import 'dotenv/config';

const { AUTH0_DOMAIN, AUTH0_AUDIENCE, PORT } = process.env;

const port = PORT || 8080;

const app = new Koa();

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

app.listen(port, () => console.log(`Server running on ${port}`));
