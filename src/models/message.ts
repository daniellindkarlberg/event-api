import { User, EntityType } from '.';

export interface Message {
  id: string;
  type: EntityType.MESSAGE;
  sender: Partial<User>;
  text: string;
  createdAt: number;
}
