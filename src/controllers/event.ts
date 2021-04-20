import { Context } from 'koa';
import { File } from '@koa/multer';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import {
  DeleteItemInput,
  PutItemInput,
  QueryInput,
  UpdateItemInput,
} from 'aws-sdk/clients/dynamodb';
import { db, s3 } from '../aws';
import { auth0 } from '../auth0';
import { errorResponse, response } from '../utils';
import { ContentType, EntityType, Event, Privacy } from '../models';

const TableName = 'Event';
export enum SecondaryIndex {
  EVENT_META_INDEX = 'event-meta-index',
  USER_EVENT_INDEX = 'user-event-index',
  USER_MESSAGE_INDEX = 'user-message-index',
}
export class EventController {
  async get(ctx: Context, userId: string) {
    try {
      const eventParams = {
        TableName,
        IndexName: SecondaryIndex.EVENT_META_INDEX,
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: {
          ':pk': ContentType.META,
        },
      };

      const userEventParams = {
        TableName: 'Event',
        IndexName: SecondaryIndex.USER_EVENT_INDEX,
        KeyConditionExpression: 'gsi2pk = :pk',
        ExpressionAttributeValues: {
          ':pk': `user-${userId}`,
        },
      };

      const { Items: userEventItems } = await db.query(userEventParams as QueryInput);
      const userEvents = userEventItems.map((userEvent) => userEvent.id);

      const { Items: items } = await db.query(eventParams as QueryInput);
      const events = items.filter(
        (event) => event.privacy === Privacy.PUBLIC || userEvents.includes(event.id),
      );

      return response(ctx, StatusCodes.OK, events);
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

      const { Items: items } = await db.query(params as QueryInput);

      if (!items.length) {
        ctx.throw(404, 'Not found');
      }

      const event = items.find((item) => item.type === EntityType.EVENT) || ({} as Event);
      const messages = items
        .filter((item) => item.type === EntityType.MESSAGE)
        .sort((x, y) => x.createdAt - y.createdAt);
      const guests = items.filter((item) => item.type === EntityType.USER);

      return response(ctx, StatusCodes.OK, { event: { ...event, guests }, messages });
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async create(ctx: Context, userId: string, body: { event: Event; invites: string[] }) {
    try {
      const { user_id, nickname, picture } = await auth0.getUser(userId);
      const id = `${EntityType.EVENT}-${uuidv4()}`;
      const host = { id: user_id, nickname, picture };
      const params = {
        TableName,
        Item: {
          pk: id,
          sk: ContentType.META,
          gsi1pk: ContentType.META,
          gsi1sk: userId,
          id,
          type: EntityType.EVENT,
          host,
          ...body.event,
        },
      };

      await db.put(params as PutItemInput);

      this.addGuest(ctx, userId, id);

      return response(ctx, StatusCodes.OK, { id, host, ...body.event });
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async update(ctx: Context, id: string, body: { event: Event; invites: string[] }) {
    const {
      name,
      description,
      location,
      startDate,
      endDate,
      photo: { positionTop },
      theme,
    } = body.event;
    try {
      const params = {
        TableName,
        Key: {
          pk: id,
          sk: ContentType.META,
        },
        UpdateExpression: `SET #name = :name, description = :description,
        #location = :location, startDate = :startDate,
        endDate = :endDate, photo.positionTop = :positionTop,
        theme = :theme`,
        ExpressionAttributeValues: {
          ':name': name,
          ':description': description,
          ':location': location,
          ':startDate': startDate,
          ':endDate': endDate || 0,
          ':positionTop': positionTop,
          ':theme': theme,
        },
        ExpressionAttributeNames: {
          '#name': 'name',
          '#location': 'location',
        },
      };

      await db.update(params as UpdateItemInput);

      return response(ctx, StatusCodes.OK, body.event);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async upload(ctx: Context, id: string, file: File) {
    try {
      const { imgUrl, thumbnailUrl } = await s3.upload(id, EntityType.EVENT, file);
      const params = {
        TableName,
        Key: {
          pk: id,
          sk: ContentType.META,
        },
        UpdateExpression: 'set photo.imgUrl = :imgUrl, photo.thumbnailUrl = :thumbnailUrl',
        ExpressionAttributeValues: {
          ':imgUrl': imgUrl,
          ':thumbnailUrl': thumbnailUrl,
        },
      };

      await db.update(params as UpdateItemInput);

      return response(ctx, StatusCodes.OK, { imgUrl });
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

  async addGuest(ctx: Context, userId: string, eventId: string) {
    try {
      const params = {
        TableName,
        Item: {
          pk: eventId,
          sk: `guest-${userId}`,
          gsi2pk: `user-${userId}`,
          gsi2sk: eventId,
          id: eventId,
          type: EntityType.USER,
        },
      };

      await db.put(params as PutItemInput);

      return response(ctx, StatusCodes.OK);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async removeGuest(ctx: Context, userId: string, id: string) {
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
