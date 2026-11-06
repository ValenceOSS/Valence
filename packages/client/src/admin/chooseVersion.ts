import { z } from 'zod';
import type { VersionChoiceRequest } from '@ValenceContracts/schemas/VersionChoice';
import { say } from '@ValenceI18n/say';

const RefusalSchema = z.object({ error: z.string() });

/**
 * Names one of a film's versions, or makes it the one that plays by default.
 *
 * @param mediaId - The version's file.
 * @param choice - Its name, empty for none or null to go back to what its file name says, and
 *   whether it is to play by default.
 * @returns Nothing once done, or what went wrong in words that can be shown.
 */
const chooseVersion = async (
  mediaId: string,
  choice: VersionChoiceRequest,
): Promise<{ problem: string } | null> => {
  const response = await fetch(`/api/media/${mediaId}/version`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(choice),
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

export { chooseVersion };
