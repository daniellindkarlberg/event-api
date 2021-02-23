import { User, Message, EntityType } from '.';

export interface Event {
  id: string;
  type: EntityType.EVENT;
  host: Partial<User>;
  title: string;
  description: string;
  imageUrl: string;
  long: number;
  lat: number;
  startDate: number;
  endDate: number;
  guests: Partial<User>[];
  posts: Message[];
}
