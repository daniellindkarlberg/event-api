import { ManagementClient } from 'auth0';
import { User } from '../models';

const auth0 = new ManagementClient({
  domain: 'event-dlk.eu.auth0.com',
  scope: 'read:users update:users',
});

export const getUser = async (id: string) => await auth0.getUser({ id });
export const updateUser = async (id: string, meta: Partial<User>) =>
  await auth0.updateUserMetadata({ id }, meta);
