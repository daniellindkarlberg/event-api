import Router from 'koa-router';
import multer from '@koa/multer';
import { UploadController } from '../controllers';
import { Context, DefaultState } from 'koa';

const router = new Router<DefaultState, Context>();
const upload = multer();
const ctrl = new UploadController();

router.post('/', upload.single('image'), async (ctx) => await ctrl.upload(ctx, ctx.file));
export default router;
