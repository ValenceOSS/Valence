import { z } from 'zod';
import type { WordRule } from '@ValenceContracts/schemas/WordRule';
import { say } from '@ValenceI18n/say';

const RefusalSchema = z.object({ error: z.string() });

/**
 * Sets every rule a library's scans lay over the genres they read.
 *
 * @param libraryId - The library.
 * @param rules - Every rule it is to have.
 * @returns Nothing once saved, or what went wrong.
 */
const saveWordRules = async (
  libraryId: string,
  rules: readonly WordRule[],
): Promise<{ problem: string } | null> => {
  const response = await fetch(`/api/libraries/${libraryId}/word-rules`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rules }),
  }).catch(() => null);

  if (response === null) {
    return { problem: say('common.theServerCouldNotBeReached') };
  }

  if (response.ok) {
    return null;
  }

  const refused = RefusalSchema.safeParse(await response.json().catch(() => null));

  return {
    problem: refused.success
      ? refused.data.error
      : say('common.theServerAnsweredStatus', { status: response.status.toString() }),
  };
};

export { saveWordRules };
