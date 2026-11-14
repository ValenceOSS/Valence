import { JellyfinPublicInfoSchema } from '@ValenceClient/jellyfin/JellyfinSchemas';
import type { JellyfinLink } from '@ValenceClient/jellyfin/JellyfinLink';

// oxlint-disable-next-line valence/no-hard-coded-strings -- the product name a Jellyfin server says it is, not words for a person
const PRODUCT = 'Jellyfin Server';

/**
 * Whether a Jellyfin server answers at an address, asked the way Jellyfin's own apps ask when a
 * server is added.
 *
 * @param address - Where to ask, without a trailing slash.
 * @param send - How to ask.
 * @returns The link to it, not yet signed in, or nothing where no Jellyfin answers there.
 */
const findJellyfinAt = async (
  address: string,
  send: (url: string) => Promise<Response>,
): Promise<JellyfinLink | null> => {
  const answer = await send(`${address}/System/Info/Public`).catch(() => null);

  if (answer === null || !answer.ok) {
    return null;
  }

  const read = JellyfinPublicInfoSchema.safeParse(await answer.json().catch(() => null));

  if (!read.success || read.data.ProductName !== PRODUCT) {
    return null;
  }

  return {
    address,
    serverId: read.data.Id,
    serverName: read.data.ServerName ?? address,
    token: null,
    userId: null,
    userName: null,
    isAdministrator: false,
  };
};

export { findJellyfinAt };
