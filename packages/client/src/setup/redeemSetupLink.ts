import { z } from 'zod';
import { sendToServer } from '@ValenceClient/admin/sendToServer';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { SetupRedemption } from '@ValenceContracts/schemas/SetupLink';

const RedeemedSchema = z.object({ isSignedIn: z.boolean() });

/**
 * Finishes setting an account up with what its owner chose, which spends the link and signs them in
 * unless the account has a second factor.
 *
 * @param token - The token from the link.
 * @param chosen - The username, any address, and a password unless a passkey is to follow.
 * @returns Whether they are signed in, or why it was refused.
 */
const redeemSetupLink = (
  token: string,
  chosen: SetupRedemption,
): Promise<Answer<{ isSignedIn: boolean }>> =>
  sendToServer(
    `/api/setup-links/${encodeURIComponent(token)}`,
    { method: 'POST', body: chosen },
    RedeemedSchema,
  );

export { redeemSetupLink };
