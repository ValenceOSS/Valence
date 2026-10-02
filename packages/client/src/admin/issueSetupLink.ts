import { IssuedSetupLinkSchema } from '@ValenceContracts/schemas/SetupLink';
import type { IssuedSetupLink, SetupLinkLifetime } from '@ValenceContracts/schemas/SetupLink';
import { sendToServer } from './sendToServer';
import type { Answer } from './sendToServer';

/**
 * Makes a new setup link for an account, which stops any earlier one working. For an account
 * already in use it is a friendlier password reset.
 *
 * @param userId - The account.
 * @param lifetimeDays - How many days the link works for.
 * @returns The link, shown once, or why it was refused.
 */
const issueSetupLink = (
  userId: string,
  lifetimeDays: SetupLinkLifetime,
): Promise<Answer<IssuedSetupLink>> =>
  sendToServer(
    `/api/admin/accounts/${encodeURIComponent(userId)}/setup-link`,
    { method: 'POST', body: { lifetimeDays } },
    IssuedSetupLinkSchema,
  );

export { issueSetupLink };
