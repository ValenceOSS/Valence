import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { ForgottenSchema } from '@ValenceContracts/schemas/Viewing';
import { say } from '@ValenceI18n/say';

/**
 * Forgets everything this profile watched of one film, or of every episode of one programme, on a
 * server that can forget a whole title at once.
 *
 * @param mediaId - The film, or any episode of the programme.
 * @returns How many viewings were forgotten.
 */
const forgetWatchedTitle = async (mediaId: string): Promise<number> =>
  ForgottenSchema.parse(
    await changeOnServer(
      `/api/history/titles/${encodeURIComponent(mediaId)}`,
      { method: 'DELETE' },
      say('client.history.fetchHistory.yourHistoryCouldNotBeCleared'),
    ),
  ).forgotten;

export { forgetWatchedTitle };
