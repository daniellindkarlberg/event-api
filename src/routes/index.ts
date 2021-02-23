import Router from 'koa-router';

import event from './event';
import user from './user';
import email from './email';

export const router = new Router({ prefix: '/api' });

router
  .use('/events', event.routes(), event.allowedMethods())
  .use('/email', email.routes(), event.allowedMethods())
  .use('/user', user.routes(), user.allowedMethods());
