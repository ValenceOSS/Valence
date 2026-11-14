import type { DigestPart } from '@ValenceServer/notifications/splitDigest';

/**
 * Narrows a digest to the parts one account would be sent, addressed to that account alone.
 *
 * @param parts - The digest, as split by who asked for what.
 * @param accountId - The account.
 * @returns The parts it is sent.
 */
const partsForOne = (parts: readonly DigestPart[], accountId: string): DigestPart[] =>
  parts
    .filter((part) =>
      part.only === undefined
        ? !(part.except ?? []).includes(accountId)
        : part.only.includes(accountId),
    )
    .map((part) => ({ items: part.items, only: [accountId] }));

export { partsForOne };
