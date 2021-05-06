import { EntityType } from '.';

export enum Privacy {
  PRIVATE = 'private',
  PUBLIC = 'public',
}
export interface Host {
  id: string;
  username: string;
  nickname: string;
  picture: string;
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
export interface Theme {
  name: string;
  primaryColor: string;
  darkMode: boolean;
}
export interface Category {
  name: string;
  value: string;
  icon: string;
}
export interface Event {
  id: string;
  host: Host;
  type: EntityType.EVENT;
  privacy: Privacy;
  category: Category;
  name: string;
  description: string;
  location: EventLocation;
  startDate: number;
  endDate?: number;
  theme: Theme;
  photo: Photo;
}
