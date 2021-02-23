import { Context } from 'koa';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { errorResponse, response } from '../utils';
import { ContentType, EntityType, Event } from '../models';
import { File } from '@koa/multer';
import { db, s3 } from '../aws';
import { auth0 } from '../auth0';
import {
  DeleteItemInput,
  PutItemInput,
  QueryInput,
  UpdateItemInput,
} from 'aws-sdk/clients/dynamodb';

const TableName = 'Event';
enum SecondaryIndex {
  EVENT_META_INDEX = 'event-meta-index',
  EVENT_USER_INDEX = 'event-user-index',
}

export class EventController {
  async get(ctx: Context) {
    try {
      const params = {
        TableName,
        IndexName: SecondaryIndex.EVENT_META_INDEX,
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': ContentType.META,
        },
      };

      const { Items: items } = await db.query(params as QueryInput);

      return response(ctx, StatusCodes.OK, items);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }
  async getById(ctx: Context, id: string) {
    try {
      const params = {
        TableName,
        KeyConditionExpression: 'pk = :id',
        ExpressionAttributeValues: {
          ':id': id,
        },
      };

      const {
        Items: [items],
      } = await db.query(params as QueryInput);

      return response(ctx, StatusCodes.OK, items);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async getByUserId(ctx: Context, id: string) {
    try {
      const params = {
        TableName,
        IndexName: SecondaryIndex.EVENT_USER_INDEX,
        KeyConditionExpression: 'gsi2pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `user-${id}`,
        },
      };

      const { Items: items } = await db.query(params as QueryInput);

      return response(ctx, StatusCodes.OK, items);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async create(ctx: Context, userId: string, body: Event) {
    try {
      const { user_id, nickname, picture } = await auth0.getUser(userId);
      const id = `${EntityType.EVENT}-${uuidv4()}`;
      const params = {
        TableName,
        Item: {
          pk: id,
          sk: ContentType.META,
          gsi1pk: ContentType.META,
          gsi1sk: body.startDate,
          id,
          type: EntityType.EVENT,
          host: { id: user_id, nickname, picture },
          ...body,
        },
      };

      await db.put(params as PutItemInput);

      return response(ctx, StatusCodes.OK, body);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async update(ctx: Context, id: string, body: Event) {
    try {
      const params = {
        TableName,
        Item: {
          pk: id,
          sk: ContentType.META,
          ...body,
        },
      };

      await db.put(params as PutItemInput);

      return response(ctx, StatusCodes.OK, body);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async upload(ctx: Context, id: string, file: File) {
    try {
      const url = await s3.upload(id, EntityType.EVENT, file);

      const params = {
        TableName,
        Key: {
          pk: id,
          sk: ContentType.META,
        },
        UpdateExpression: 'set imageUrl = :url',
        ExpressionAttributeValues: {
          ':url': url,
        },
      };

      await db.update(params as UpdateItemInput);

      return response(ctx, StatusCodes.OK, url);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async delete(ctx: Context, id: string) {
    try {
      const params = {
        TableName,
        Key: {
          pk: id,
        },
      };

      await db.remove(params as DeleteItemInput);

      return response(ctx, StatusCodes.OK);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async addGuest(ctx: Context, userId: string, { id, title, description, imageUrl }: Event) {
    try {
      const params = {
        TableName,
        Item: {
          pk: id,
          sk: `guest-${userId}`,
          gsi2pk: `user-${userId}`,
          type: EntityType.USER,
          id,
          title,
          description,
          imageUrl,
        },
      };

      await db.put(params as PutItemInput);

      return response(ctx, StatusCodes.OK);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async removeGuest(ctx: Context, id: string, userId: string) {
    try {
      const params = {
        TableName,
        Key: {
          pk: id,
          sk: `guest-${userId}`,
        },
      };

      await db.remove(params as DeleteItemInput);

      return response(ctx, StatusCodes.OK);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }
}
