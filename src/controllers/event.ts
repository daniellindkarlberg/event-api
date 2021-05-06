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
import { db, s3, ses } from '../aws';
import { auth0 } from '../auth0';
import { errorResponse, response } from '../utils';
import { ContentType, EntityType, Event, Privacy } from '../models';
import { generateInvitationEmail } from '../aws/ses';
import { generateQueryParams, generateUpdateParams, SecondaryIndex, Table } from '../aws/dynamo-db';

const TableName = Table.EVENT;
enum Action {
  ADD = 'add',
  REMOVE = 'remove',
}
export class EventController {
  async get(ctx: Context, userId: string) {
    try {
      const { Items: events } = await db.query(
        generateQueryParams(
          'gsi1pk = :pk',
          {
            ':pk': ContentType.META,
          },
          SecondaryIndex.EVENT_META_INDEX,
        ) as QueryInput,
      );
      const { Items: userEvents } = await db.query(
        generateQueryParams(
          'gsi2pk = :pk',
          {
            ':pk': `user-${userId}`,
          },
          SecondaryIndex.USER_EVENT_INDEX,
        ) as QueryInput,
      );

      return response(
        ctx,
        StatusCodes.OK,
        events.filter(
          (event) =>
            event.privacy === Privacy.PUBLIC ||
            userEvents.map((userEvent) => userEvent.id).includes(event.id),
        ),
      );
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }
  async getById(ctx: Context, id: string) {
    try {
      const { Items: items } = await db.query(
        generateQueryParams('pk = :id', {
          ':id': id,
        }) as QueryInput,
      );

      if (items.length === 0) {
        ctx.throw(404, 'Not found');
      }

      const meta = items.find((item) => item.type === EntityType.EVENT) || ({} as Event);

      const messages = items
        .filter((item) => item.type === EntityType.MESSAGE)
        .sort((x, y) => x.createdAt - y.createdAt);

      const guests = items.filter((item) => item.type === EntityType.USER);

      return response(ctx, StatusCodes.OK, { event: { ...meta, guests }, messages });
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async create(ctx: Context, userId: string, body: { event: Event; invites: string[] }) {
    try {
      const { user_id, username, picture } = await auth0.getUser(userId);
      const id = `${EntityType.EVENT}-${uuidv4()}`;
      const host = { id: user_id, username, picture };

      const params = {
        TableName,
        Item: {
          pk: id,
          sk: ContentType.META,
          gsi1pk: ContentType.META,
          gsi1sk: id,
          id,
          type: EntityType.EVENT,
          host,
          attending: 0,
          ...body.event,
        },
      };

      if (body.invites.length > 0) {
        await ses.sendEmail(body.invites, generateInvitationEmail(username, { id, ...body.event }));
      }

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
      startDate,
      endDate,
      privacy,
      location,
      description,
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
        UpdateExpression: `set #name = :name, startDate = :startDate,
        endDate = :endDate, privacy = :privacy, #location = :location, description = :description,
         photo.positionTop = :positionTop,
        theme = :theme`,
        ExpressionAttributeValues: {
          ':name': name,
          ':startDate': startDate,
          ':endDate': endDate || 0,
          ':privacy': privacy,
          ':location': location,
          ':description': description,
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

      await db.update(
        generateUpdateParams(
          id,
          ContentType.META,
          'photo.imgUrl = :imgUrl, photo.thumbnailUrl = :thumbnailUrl',
          {
            ':imgUrl': imgUrl,
            ':thumbnailUrl': thumbnailUrl,
          },
        ) as UpdateItemInput,
      );

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
    const { username, picture, email } = await auth0.getUser(userId);

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
          email,
          username,
          picture,
        },
      };

      await db.put(params as PutItemInput);
      await this.addOrRemoveGuest(eventId, Action.ADD);

      const guests = await this.getGuests(eventId);

      return response(ctx, StatusCodes.OK, guests);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async removeGuest(ctx: Context, userId: string, eventId: string) {
    try {
      const params = {
        TableName,
        Key: {
          pk: eventId,
          sk: `guest-${userId}`,
        },
      };

      await db.remove(params as DeleteItemInput);
      await this.addOrRemoveGuest(eventId, Action.REMOVE);

      const guests = await this.getGuests(eventId);

      return response(ctx, StatusCodes.OK, guests);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async getGuests(eventId: string) {
    const { Items: guests } = await db.query(
      generateQueryParams('pk = :pk and begins_with(sk, :sk)', {
        ':pk': eventId,
        ':sk': 'guest',
      }) as QueryInput,
    );

    return guests;
  }

  async removeMessage(ctx: Context, id: string) {
    try {
      const params = {
        TableName,
        Key: {
          sk: `message-${id}`,
        },
      };

      await db.remove(params as DeleteItemInput);

      return response(ctx, StatusCodes.OK);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async addOrRemoveGuest(eventId: string, action: Action) {
    const {
      Items: [event],
    } = await db.query(
      generateQueryParams('pk = :pk and sk = :sk', {
        ':pk': eventId,
        ':sk': ContentType.META,
      }) as QueryInput,
    );

    await db.update(
      generateUpdateParams(event.id, ContentType.META, 'attending = :attending', {
        ':attending': action === Action.ADD ? event.attending + 1 : event.attending - 1,
      }) as UpdateItemInput,
    );
  }
}
