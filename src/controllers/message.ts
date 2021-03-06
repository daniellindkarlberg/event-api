import { Server } from 'http';
import SocketIO, { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../aws';
import { auth0 } from '../auth0';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';
import { EntityType, SocketMessageEvent } from '../models';

enum SocketEvent {
  CONNECTION = 'connection',
  MESSAGE = 'message',
  JOIN = 'join',
}

export class MessageController {
  private io = new SocketIO.Server();

  constructor(server: Server) {
    this.io.attach(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
  }

  init() {
    this.io.sockets.on(SocketEvent.CONNECTION, (socket) => {
      this.join(socket);
      this.emit(socket);
    });
  }

  join(socket: Socket) {
    socket.on(SocketEvent.JOIN, (eventId: string) => socket.join(eventId));
  }

  emit(socket: Socket) {
    socket.on(
      SocketEvent.MESSAGE,
      async ({
        eventId,
        userId,
        text = '',
        photo,
        imgUrl,
        thumbnailUrl,
        reply,
        replyTo,
        originalMessage,
      }: SocketMessageEvent) => {
        try {
          const { username, picture } = await auth0.getUser(userId);
          const message = {
            id: `${EntityType.MESSAGE}-${uuidv4()}`,
            eventId,
            type: EntityType.MESSAGE,
            sender: { user_id: userId, username, picture },
            text,
            photo,
            imgUrl,
            thumbnailUrl,
            reply,
            replyTo,
            originalMessage,
            createdAt: Math.floor(new Date().getTime() / 1000),
          };

          const params = {
            TableName: 'Event',
            Item: {
              pk: eventId,
              sk: message.id,
              gsi3pk: `user-${userId}`,
              gsi3sk: eventId,
              ...message,
            },
          };

          await db.put(params as PutItemInput);

          this.io.sockets.in(eventId).emit(SocketEvent.MESSAGE, message);
        } catch (error) {
          throw error;
        }
      },
    );
  }
}
