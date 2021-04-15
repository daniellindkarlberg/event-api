import { ManagementClient } from 'auth0';
import { User } from '../models';
import 'dotenv/config';

const { AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN } = process.env;
const auth0 = new ManagementClient({
  clientId: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  domain: AUTH0_DOMAIN,
  scope: 'read:users update:users',
});

export const getUser = async (id: string) => await auth0.getUser({ id });
export const updateUser = async (id: string, meta: Partial<User>) =>
  await auth0.updateUserMetadata({ id }, meta);
