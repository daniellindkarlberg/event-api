import Router from 'koa-router';
import { UserController } from '../controllers';
import { DefaultState, Context } from 'koa';
import multer from '@koa/multer';

const router = new Router<DefaultState, Context>();
const upload = multer();
const ctrl = new UserController();

router
  .get('/', async (ctx) => await ctrl.get(ctx, ctx.state.user.sub))
  .put('/', async (ctx) => await ctrl.update(ctx, ctx.state.user.sub, ctx.request.body))
  .post(
    '/upload',
    upload.single('image'),
    async (ctx) => await ctrl.upload(ctx, ctx.params.id, ctx.file),
  );

export default router;
