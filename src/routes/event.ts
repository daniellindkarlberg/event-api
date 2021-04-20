import Router from 'koa-router';
import multer from '@koa/multer';
import { EventController } from '../controllers';
import { Context, DefaultState } from 'koa';

const router = new Router<DefaultState, Context>();
const upload = multer();
const ctrl = new EventController();

router
  .get('/', async (ctx) => await ctrl.get(ctx, ctx.state.user.sub))
  .get('/:id', async (ctx) => await ctrl.getById(ctx, ctx.params.id))
  .post('/', async (ctx) => await ctrl.create(ctx, ctx.state.user.sub, ctx.request.body))
  .post(
    '/upload/:id',
    upload.single('image'),
    async (ctx) => await ctrl.upload(ctx, ctx.params.id, ctx.file),
  )
  .post('/guest/:id', async (ctx) => await ctrl.addGuest(ctx, ctx.state.user.sub, ctx.params.id))
  .put('/:id', async (ctx) => await ctrl.update(ctx, ctx.params.id, ctx.request.body))
  .delete(
    '/guest/:id',
    async (ctx) => await ctrl.removeGuest(ctx, ctx.state.user.sub, ctx.params.id),
  )
  .delete('/:id', async (ctx) => await ctrl.delete(ctx, ctx.params.id));

export default router;
