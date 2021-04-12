import { Context } from 'koa';
import { EntityType } from '../models';
import { s3 } from '../aws';
import { errorResponse, response } from '../utils';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import { File } from '@koa/multer';

export class UploadController {
  async upload(ctx: Context, file: File) {
    try {
      const id = uuidv4();
      const { imgUrl, thumbnailUrl } = await s3.upload(id, EntityType.MESSAGE, file);

      return response(ctx, StatusCodes.OK, { imgUrl, thumbnailUrl });
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }
}
