import { readFromServer } from '@ValenceClient/query/readFromServer';
import { AccountListSchema } from '@ValenceContracts/schemas/Account';
import type { Account } from '@ValenceContracts/schemas/Account';

/**
 * Everybody with an account on this server, with whether this server can email them their setup
 * links — what the accounts page needs to draw its list and offer its actions.
 *
 * @returns The accounts, and whether setup links can be sent by email.
 */
const fetchAccountList = async (): Promise<{ accounts: Account[]; canEmailSetupLinks: boolean }> =>
  readFromServer('/api/admin/accounts', AccountListSchema);

export { fetchAccountList };
