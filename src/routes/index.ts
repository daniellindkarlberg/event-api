import Router from 'koa-router';

import ping from './ping';
import event from './event';
import user from './user';
import email from './email';
import upload from './upload';

export const router = new Router({ prefix: '/api' });

router
  .use('/ping', ping.routes(), ping.allowedMethods())
  .use('/events', event.routes(), event.allowedMethods())
  .use('/user', user.routes(), user.allowedMethods())
  .use('/email', email.routes(), email.allowedMethods())
  .use('/upload', upload.routes(), upload.allowedMethods());
