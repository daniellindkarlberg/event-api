import { EntityType } from './entity';

export interface User {
  user_id: string;
  type: EntityType.USER;
  username: string;
  nickname: string;
  email: string;
  picture: string;
}
