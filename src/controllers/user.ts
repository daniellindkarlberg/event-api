import { StatusCodes } from 'http-status-codes';
import { Context } from 'koa';
import { auth0 } from '../auth0';
import { errorResponse, response } from '../utils';
import { s3 } from '../aws';
import { EntityType, User } from '../models';
import { File } from '@koa/multer';

export class UserController {
  async get(ctx: Context, id: string) {
    try {
      const user = await auth0.getUser(id);

      return response(ctx, StatusCodes.OK, user);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async update(ctx: Context, id: string, body: Partial<User>) {
    try {
      const user = await auth0.updateUser(id, body);

      return response(ctx, StatusCodes.OK, user);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async upload(ctx: Context, id: string, file: File) {
    try {
      const url = await s3.upload(id, EntityType.USER, file);

      await auth0.updateUser(id, { picture: url });

      return response(ctx, StatusCodes.OK, url);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }
}
