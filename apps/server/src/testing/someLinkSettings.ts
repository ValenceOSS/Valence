import { LINK_SETTINGS_DEFAULTS } from '@ValenceServer/linking/LinkSettings';
import type { LinkSettings } from '@ValenceServer/linking/LinkSettings';

/**
 * Settings held in memory, as the server's own would be.
 *
 * @returns Where a link service keeps its key, name, colour and address.
 */
const someLinkSettings = () => {
  let held: LinkSettings = LINK_SETTINGS_DEFAULTS;

  return {
    read: () => Promise.resolve(held),
    write: (next: LinkSettings) => {
      held = next;

      return Promise.resolve();
    },
  };
};

export { someLinkSettings };
