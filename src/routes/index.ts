import Router from 'koa-router';

import event from './event';
import user from './user';
import email from './email';
import ping from './ping';

export const router = new Router({ prefix: '/api' });

router
  .use('/ping', ping.routes(), ping.allowedMethods())
  .use('/events', event.routes(), event.allowedMethods())
  .use('/user', user.routes(), user.allowedMethods())
  .use('/email', email.routes(), event.allowedMethods());
