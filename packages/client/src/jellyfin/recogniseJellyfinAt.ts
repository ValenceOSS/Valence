import { findJellyfinAt } from '@ValenceClient/jellyfin/findJellyfinAt';
import { jellyfinLinks } from '@ValenceClient/jellyfin/jellyfinLinks';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

/**
 * Whether a Jellyfin server answers at an address where no Valence did, remembering it as one where
 * it does, so the app talks to it as a Jellyfin server from then on. A link already made there,
 * with whoever is signed in to it, is kept.
 *
 * @param address - The address that was tried, without a trailing slash.
 * @param send - How to ask it.
 * @returns Whether a Jellyfin server answered.
 */
const recogniseJellyfinAt = async (
  address: string,
  send: (url: string) => Promise<Response> = (url) => fetch(url),
): Promise<boolean> => {
  const links = jellyfinLinks(platformInUse().store);
  const found = await findJellyfinAt(address, send);

  if (found === null) {
    links.forget(address);

    return false;
  }

  const known = links.of(address);

  links.keep(known?.serverId === found.serverId ? known : found);

  return true;
};

export { recogniseJellyfinAt };
