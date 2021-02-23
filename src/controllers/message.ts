import { Server } from 'http';
import SocketIO, { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { EntityType } from '../models';
import { db } from '../aws';
import { auth0 } from '../auth0';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';

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
    socket.on(SocketEvent.JOIN, (eventId: string) => {
      socket.join(eventId);
    });
  }

  emit(socket: Socket) {
    socket.on(SocketEvent.MESSAGE, async (eventId: string, userId: string, text: string) => {
      try {
        const { nickname, picture } = await auth0.getUser(userId);

        const message = {
          id: `${EntityType.MESSAGE}-${uuidv4()}`,
          type: EntityType.MESSAGE,
          sender: { user_id: userId, nickname, picture },
          text,
          createdAt: Date.now(),
        };

        const params = {
          TableName: 'Event',
          Item: {
            pk: eventId,
            sk: message.id,
            ...message,
          },
        };

        await db.put(params as PutItemInput);

        this.io.sockets.in(eventId).emit(SocketEvent.MESSAGE, message);
      } catch (error) {
        throw error;
      }
    });
  }
}
