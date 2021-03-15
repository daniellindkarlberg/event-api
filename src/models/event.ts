import { User, Message, EntityType } from '.';
export interface Event {
  id: string;
  type: EntityType.EVENT;
  host: Partial<User>;
  name: string;
  description: string;
  imageUrl: string;
  imagePositionTop: number;
  location: EventLocation;
  startDate: number;
  endDate?: number;
  guests: Partial<User>[];
  messages: Message[];
}
export interface EventLocation {
  longitude: number;
  latitude: number;
  address: string;
}
