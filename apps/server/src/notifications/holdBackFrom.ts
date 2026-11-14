import type { DigestPart } from '@ValenceServer/notifications/splitDigest';

/**
 * Takes some accounts out of every part of a digest, so they are sent none of it and can be sent a
 * digest of their own instead.
 *
 * @param parts - The digest, as split by who asked for what.
 * @param accountIds - The accounts to leave out.
 * @returns The parts, reaching nobody among those accounts.
 */
const holdBackFrom = (
  parts: readonly DigestPart[],
  accountIds: readonly string[],
): DigestPart[] => {
  if (accountIds.length === 0) {
    return [...parts];
  }

  const held = new Set(accountIds);

  return parts.flatMap((part): DigestPart[] => {
    if (part.only !== undefined) {
      const only = part.only.filter((id) => !held.has(id));

      return only.length === 0 ? [] : [{ ...part, only }];
    }

    return [{ ...part, except: [...new Set([...(part.except ?? []), ...accountIds])] }];
  });
};

export { holdBackFrom };
