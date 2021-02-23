import { ManagementClient } from 'auth0';
import { User } from '../models';
import * as dotenv from 'dotenv';

dotenv.config();

const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;

const auth0 = new ManagementClient({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  scope: 'read:users update:users',
});

export const getUser = async (id: string) => await auth0.getUser({ id });
export const updateUser = async (id: string, meta: Partial<User>) =>
  await auth0.updateUserMetadata({ id }, meta);
