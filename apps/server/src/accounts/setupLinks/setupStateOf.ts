import type { SetupState } from '@ValenceContracts/schemas/SetupLink';

/**
 * Where an account stands with one of its setup links, which was not revoked.
 *
 * @param link - When the link expires and when it was used, if it was.
 * @param at - The moment to judge it at.
 * @returns Whether it is waiting to be used, has expired, or was used.
 */
const setupStateOf = (link: { expiresAt: Date; usedAt: Date | null }, at: Date): SetupState => {
  if (link.usedAt !== null) {
    return 'used';
  }

  return link.expiresAt.getTime() > at.getTime() ? 'waiting' : 'expired';
};

export { setupStateOf };
