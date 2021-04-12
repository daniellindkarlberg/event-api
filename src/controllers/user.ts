import { StatusCodes } from 'http-status-codes';
import { Context } from 'koa';
import { auth0 } from '../auth0';
import { errorResponse, response } from '../utils';
import { db, s3 } from '../aws';
import { EntityType, User } from '../models';
import { File } from '@koa/multer';
import { SecondaryIndex } from '.';
import { QueryInput } from 'aws-sdk/clients/dynamodb';

export class UserController {
  async get(ctx: Context, id: string) {
    try {
      const user = await auth0.getUser(id);

      return response(ctx, StatusCodes.OK, user);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async getEvents(ctx: Context, id: string) {
    try {
      const params = {
        TableName: 'Event',
        IndexName: SecondaryIndex.USER_EVENT_INDEX,
        KeyConditionExpression: 'gsi2pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `user-${id}`,
        },
      };

      const { Items: items } = await db.query(params as QueryInput);
      const events = items.map((event) => event.id);

      return response(ctx, StatusCodes.OK, events);
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

      return response(ctx, StatusCodes.OK, { url });
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }
}
