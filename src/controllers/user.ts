import { StatusCodes } from 'http-status-codes';
import { Context } from 'koa';
import { auth0 } from '../auth0';
import { errorResponse, response } from '../utils';
import { db, s3 } from '../aws';
import { ContentType, User, Message } from '../models';
import { File } from '@koa/multer';
import { QueryInput, UpdateItemInput } from 'aws-sdk/clients/dynamodb';
import fetch from 'node-fetch';
import { generateQueryParams, generateUpdateParams, SecondaryIndex } from '../aws/dynamo-db';

export class UserController {
  async get(ctx: Context, id: string) {
    try {
      const user = await auth0.getUser(id);

      if (user.logins_count === 1) {
        const url = await fetch(user.picture);
        const buffer = await url.buffer();
        this.upload(ctx, id, { buffer } as File);
      }

      return response(ctx, StatusCodes.OK, user);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async getEvents(ctx: Context, id: string) {
    try {
      const { Items: events } = await db.query(
        generateQueryParams(
          'gsi2pk = :pk',
          {
            ':pk': `user-${id}`,
          },
          SecondaryIndex.USER_EVENT_INDEX,
        ) as QueryInput,
      );

      return response(
        ctx,
        StatusCodes.OK,
        events.map((event) => event.id),
      );
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async update(ctx: Context, id: string, body: Partial<User>) {
    try {
      const user = await auth0.updateUser(id, body);

      await this.updateMessages(id, body.username);
      await this.updateEvents(id, body.username, user.picture);

      return response(ctx, StatusCodes.OK, user);
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async upload(ctx: Context, id: string, file: File) {
    try {
      const { picture } = await s3.uploadUserPicture(id, file);

      await auth0.updateUser(id, { picture });
      const user = await auth0.getUser(id);
      await this.updateEvents(id, user.username, picture);

      return response(ctx, StatusCodes.OK, { url: picture });
    } catch (error) {
      return errorResponse(ctx, error.statusCode);
    }
  }

  async updateEvents(userId: string, username: string, picture: string) {
    const { Items: events } = await db.query(
      generateQueryParams(
        'gsi1pk = :pk',
        {
          ':pk': ContentType.META,
        },
        SecondaryIndex.EVENT_META_INDEX,
      ) as QueryInput,
    );

    const hostedEvents = events.filter((event) => event.host.id === userId);

    hostedEvents.forEach((event) => {
      db.update(
        generateUpdateParams(event.id, ContentType.META, 'host.username = :username', {
          ':username': username,
        }) as UpdateItemInput,
      );
    });

    const { Items: userEvents } = await db.query(
      generateQueryParams(
        'gsi2pk = :pk',
        {
          ':pk': `user-${userId}`,
        },
        SecondaryIndex.USER_EVENT_INDEX,
      ) as QueryInput,
    );

    userEvents.forEach((event) => {
      db.update(
        generateUpdateParams(
          event.id,
          `guest-${userId}`,
          'username = :username, picture = :picture',
          { ':username': username, ':picture': picture },
        ) as UpdateItemInput,
      );
    });
  }

  async updateMessages(userId: string, username: string) {
    const { Items: messages } = await db.query(
      generateQueryParams(
        'gsi3pk = :pk',
        {
          ':pk': `user-${userId}`,
        },
        SecondaryIndex.USER_MESSAGE_INDEX,
      ) as QueryInput,
    );

    messages.forEach(({ eventId, id }: Message) => {
      const updateParams = generateUpdateParams(eventId, id, 'sender.username = :username', {
        ':username': username,
      }) as UpdateItemInput;
      db.update(updateParams);
    });
  }
}
