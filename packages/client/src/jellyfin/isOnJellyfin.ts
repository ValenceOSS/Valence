import { jellyfinLinks } from '@ValenceClient/jellyfin/jellyfinLinks';
import { platformIfAny } from '@ValenceClient/platform/installPlatform';

/**
 * Whether the server this app is pointed at is a Jellyfin one, for what has no Jellyfin
 * counterpart at all, such as the live connection Valence's server keeps open.
 *
 * @returns Whether it is.
 */
const isOnJellyfin = (): boolean => {
  const platform = platformIfAny();

  return platform !== null && jellyfinLinks(platform.store).of(platform.serverAddress()) !== null;
};

export { isOnJellyfin };
