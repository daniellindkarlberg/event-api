import { ManagementClient } from 'auth0';
import { User } from '../models';

const auth0 = new ManagementClient({
  domain: 'event-dlk.eu.auth0.com',
  clientId: 'xcPGTP2k2mKajiljjTYvk7DUEGp8UeMW',
  clientSecret: '9CzKs1qgfcluczwRhnPSJJ46CUspYKINE5S7Gvvu8WbCDc9Sr8MqRPFkw3sRBsF1',
  scope: 'read:users update:users',
});

export const getUser = async (id: string) => await auth0.getUser({ id });
export const updateUser = async (id: string, meta: Partial<User>) =>
  await auth0.updateUserMetadata({ id }, meta);
