import Router from 'koa-router';
import { EmailController } from '../controllers';
import { DefaultState, Context } from 'koa';

const router = new Router<DefaultState, Context>();
const ctrl = new EmailController();

router.post('/', async (ctx) => await ctrl.send(ctx, ctx.request.body));

export default router;
