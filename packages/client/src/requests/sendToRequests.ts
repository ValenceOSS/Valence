import { readRefusal } from '@ValenceClient/admin/readRefusal';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import { say } from '@ValenceI18n/say';

type Sent<Value> = { value: Value | null; refusal: Refusal };

/**
 * Sends something to the requesting routes, and reads the answer or why it was refused.
 *
 * @param path - Where to send it.
 * @param method - How.
 * @param body - What to send, where anything.
 * @param read - How to read a good answer.
 * @returns The answer, or the refusal.
 */
const sendToRequests = async <Value>(
  path: string,
  method: string,
  body: object | undefined,
  read: (response: Response) => Promise<Value>,
): Promise<Sent<Value>> => {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch(() => null);

  if (response === null) {
    return { value: null, refusal: { message: say('client.serverProblem.unreachable') } };
  }

  const refusal = await readRefusal(response);

  return refusal === null
    ? { value: await read(response), refusal: null }
    : { value: null, refusal };
};

export type { Sent };

export { sendToRequests };
