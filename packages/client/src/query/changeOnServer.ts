import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const ErrorBodySchema = z.object({ error: z.string() });

/**
 * Asks Valence to change something, and throws with the server's own words where it would not —
 * the words say what to change, which is what a person needs to read.
 *
 * @param path - Where to ask.
 * @param init - How: the method, and a body where there is one.
 * @param fallback - What to say where the server gave no words of its own.
 * @returns What it sent back, or nothing where it sent nothing.
 * @throws With the server's words, or the fallback.
 */
const changeOnServer = async (
  path: string,
  init: { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'; json?: JsonValue },
  fallback: string,
): Promise<JsonValue> => {
  const response = await fetch(path, {
    method: init.method,
    credentials: 'same-origin',
    ...(init.json === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(init.json) }),
  });

  if (!response.ok) {
    const parsed = ErrorBodySchema.safeParse(await response.json().catch(() => null));

    throw new Error(parsed.success ? parsed.data.error : fallback);
  }

  return response.status === 204
    ? null
    : JsonValueSchema.parse(await response.json().catch(() => null));
};

export { changeOnServer };
