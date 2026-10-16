import { createHmac } from 'node:crypto';

/**
 * The token that says a library was unlocked for an account until a moment: signed with the server's
 * own secret and bound to the lock as it then stood, so changing the password locks it again.
 *
 * @param unlocked - The library, the account, the lock's hash and when the unlocking runs out.
 * @param secret - The server's own secret.
 * @returns The token, as `<library>.<until>.<signature>`.
 */
const unlockToken = (
  unlocked: { libraryId: string; accountId: string; hash: string; untilMs: number },
  secret: string,
): string => {
  const signature = createHmac('sha256', secret)
    .update(
      `${unlocked.libraryId}:${unlocked.accountId}:${unlocked.untilMs.toString()}:${unlocked.hash}`,
    )
    .digest('base64url');

  return `${unlocked.libraryId}.${unlocked.untilMs.toString()}.${signature}`;
};

export { unlockToken };
