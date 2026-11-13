import type { Permission } from '@ValenceContracts/schemas/Permission';

/**
 * Whether a request comes with an API key held to some of its account's permissions, which the
 * realtime socket cannot narrow its feeds to and so turns away.
 *
 * @param isViaKey - Whether the request was signed in with a key.
 * @param restriction - Reads the permissions the key is held to, or null for none.
 * @returns Whether it is a narrowed key.
 */
const isANarrowedKey = async (
  isViaKey: boolean,
  restriction: () => Promise<ReadonlySet<Permission> | null>,
): Promise<boolean> => isViaKey && (await restriction()) !== null;

export { isANarrowedKey };
