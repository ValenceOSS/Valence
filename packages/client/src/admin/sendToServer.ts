import type { z } from 'zod';
import { say } from '@ValenceI18n/say';
import { readRefusal } from './readRefusal';
import type { Refusal } from './readRefusal';

type Answer<Value> = { kind: 'answered'; value: Value } | { kind: 'refused'; refusal: Refusal };

/**
 * Sends a request to the server's own API and reads the answer through a schema, telling a refusal
 * apart from an answer the way the admin pages show them.
 *
 * @param path - Where to send it.
 * @param init - The method and any JSON body.
 * @param schema - What a good answer looks like.
 * @returns The answer, or why it was refused.
 */
const sendToServer = async <Value>(
  path: string,
  init: { method: string; body?: object },
  schema: z.ZodType<Value>,
): Promise<Answer<Value>> => {
  const response = await fetch(path, {
    method: init.method,
    credentials: 'same-origin',
    ...(init.body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(init.body) }),
  }).catch(() => null);

  if (response === null) {
    return { kind: 'refused', refusal: { message: say('common.theServerCouldNotBeReached') } };
  }

  if (!response.ok) {
    return { kind: 'refused', refusal: await readRefusal(response) };
  }

  const read = schema.safeParse(await response.json().catch(() => null));

  return read.success
    ? { kind: 'answered', value: read.data }
    : {
        kind: 'refused',
        refusal: { message: say('client.admin.readRefusal.thatCouldNotBeDoneTry') },
      };
};

export type { Answer };

export { sendToServer };
