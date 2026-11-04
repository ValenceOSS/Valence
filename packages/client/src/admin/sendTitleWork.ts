import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import { say } from '@ValenceI18n/say';
import { z } from 'zod';

const ReachedSchema = z.object({ corrected: z.number(), jobId: z.string().nullable() });

type TitleWorkAnswer =
  | { kind: 'reached'; count: number; jobId: string | null }
  | { kind: 'refused'; reason: string };

/**
 * Asks the server to do something to a whole title, such as refresh or unmatch it.
 *
 * @param path - Where the request goes.
 * @param body - What is asked, where there is more to say than the address.
 * @returns How many files or fields it reached and the job doing the work, or why it was refused.
 */
const sendTitleWork = async (path: string, body?: object): Promise<TitleWorkAnswer> => {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch(() => null);

  if (response === null) {
    return { kind: 'refused', reason: say('common.theServerCouldNotBeReached') };
  }

  const answer = await response.json().catch(() => null);
  const reached = ReachedSchema.safeParse(answer);

  if (response.ok && reached.success) {
    return { kind: 'reached', count: reached.data.corrected, jobId: reached.data.jobId };
  }

  const refused = RefusalSchema.safeParse(answer);

  return {
    kind: 'refused',
    reason: refused.success
      ? refused.data.error
      : say('common.theServerAnsweredStatus', { status: response.status.toString() }),
  };
};

export type { TitleWorkAnswer };

export { sendTitleWork };
