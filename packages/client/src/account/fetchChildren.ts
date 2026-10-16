import { readFromServer } from '@ValenceClient/query/readFromServer';
import { readRefusal } from '@ValenceClient/admin/readRefusal';
import { ChildAccountListSchema } from '@ValenceContracts/schemas/ChildAccount';
import type { ChildAccount } from '@ValenceContracts/schemas/ChildAccount';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import { say } from '@ValenceI18n/say';

/**
 * The children's accounts this account looks after, each with whether it asks for a PIN.
 */
const fetchChildren = async (): Promise<ChildAccount[]> => {
  return (await readFromServer('/api/account/children', ChildAccountListSchema)).children;
};

/**
 * Sends a change to this account's children and reads why it was refused, where it was.
 *
 * @param path - Where to send it.
 * @param method - How.
 * @param body - What to send.
 * @returns Any refusal from the server.
 */
const sendToChildren = async (path: string, method: string, body: object): Promise<Refusal> => {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Adds a child's account that this account looks after, signed in to from the way in with no
 * password, or with a PIN where one is given.
 *
 * @param name - What the child is called.
 * @param pin - The PIN they sign in with, or null for none.
 * @returns Any refusal from the server.
 */
const addChild = (name: string, pin: string | null): Promise<Refusal> =>
  sendToChildren('/api/account/children', 'POST', { name, pin });

/**
 * Sets the PIN a child signs in with, or takes it away so they sign in with a tap.
 *
 * @param userId - The child's account.
 * @param pin - The new PIN, or null for none.
 * @returns Any refusal from the server.
 */
const setChildPin = (userId: string, pin: string | null): Promise<Refusal> =>
  sendToChildren(`/api/account/children/${userId}/pin`, 'PUT', { pin });

export { addChild, fetchChildren, setChildPin };
