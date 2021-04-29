import Router from 'koa-router';

import ping from './ping';
import event from './event';
import user from './user';
import upload from './upload';

export const router = new Router({ prefix: '/v1' });

router
  .use('/ping', ping.routes(), ping.allowedMethods())
  .use('/events', event.routes(), event.allowedMethods())
  .use('/user', user.routes(), user.allowedMethods())
  .use('/upload', upload.routes(), upload.allowedMethods());
