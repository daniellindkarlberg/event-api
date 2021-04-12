import { User, Message, EntityType } from '.';
export interface Event {
  id: string;
  host: Host;
  type: EntityType.EVENT;
  name: string;
  description: string;
  location: EventLocation;
  startDate: number;
  endDate?: number;
  guests: Partial<User>[];
  messages: Message[];
  theme: Theme;
  photo: Photo;
  backgroundColor: string;
}
export interface EventLocation {
  longitude: number;
  latitude: number;
  address: string;
}
export interface Photo {
  imgUrl: string;
  thumbnailUrl: string;
  positionTop: number;
}

export interface Host {
  id: string;
  nickname: string;
  picture: string;
}

export interface Theme {
  name: string;
  primaryColor: string;
  darkMode: boolean;
}
