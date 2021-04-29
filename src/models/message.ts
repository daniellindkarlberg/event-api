import { User, EntityType } from '.';
export interface Message {
  id: string;
  type: EntityType.MESSAGE;
  sender: Partial<User>;
  text: string;
  image: boolean;
  imgUrl?: string;
  thumbnailUrl?: string;
  reply: boolean;
  replyTo?: string;
  createdAt: number;
}
export interface SocketMessageEvent {
  eventId: string;
  userId: string;
  text: string;
  reply?: boolean;
  replyTo?: string;
  originalMessage?: string;
  photo: boolean;
  imgUrl?: string;
  thumbnailUrl?: string;
}
