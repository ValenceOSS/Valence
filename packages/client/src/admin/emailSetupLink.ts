import {
  DEFAULT_SETUP_LINK_LIFETIME,
  IssuedSetupLinkSchema,
} from '@ValenceContracts/schemas/SetupLink';
import type { IssuedSetupLink, SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import { setupTokenOf } from '@ValenceContracts/functions/setupTokenOf';
import { sendToServer } from './sendToServer';
import type { Answer } from './sendToServer';

/**
 * Emails an account its setup link: the one on screen, when there is one, or else a new one made
 * to last as long as asked.
 *
 * @param userId - The account.
 * @param link - The link on screen, or how long a new one should work for.
 * @returns The link that was sent, or why it was not.
 */
const emailSetupLink = (
  userId: string,
  link: { held: IssuedSetupLink } | { lifetimeDays: SetupLinkLifetime },
): Promise<Answer<IssuedSetupLink>> => {
  const token = 'held' in link ? setupTokenOf(link.held.url) : null;

  return sendToServer(
    `/api/admin/accounts/${encodeURIComponent(userId)}/setup-link/email`,
    {
      method: 'POST',
      body:
        token !== null
          ? { token }
          : {
              lifetimeDays:
                'lifetimeDays' in link ? link.lifetimeDays : DEFAULT_SETUP_LINK_LIFETIME,
            },
    },
    IssuedSetupLinkSchema,
  );
};

export { emailSetupLink };
