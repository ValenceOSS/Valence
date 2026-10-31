import type { PluginEvent } from '@ValenceSDK/host/PluginDefinition';
import { isAboutViewing } from './isAboutViewing';

const ABOUT_NOBODY = new Set(['media.added', 'media.removed', 'library.scanned']);

/**
 * Whether a plugin is told of an event, by who it is about: one about a profile reaches a plugin
 * only where that profile used it, one about an account only where somebody on that account did,
 * and one about nobody, such as a library scan, reaches it regardless. That a profile was removed
 * reaches every plugin that hears it, since the profile's record of using it went with it.
 *
 * A plugin allowed to hear everybody's viewing is told of anybody watching, listening, opening or
 * leaving Valence, whether or not they used it, and only such a plugin hears of a guest's, or of
 * anybody else's Valence doesn't know by account. Something about a person Valence can't name,
 * such as a request nobody is recorded as making, reaches nobody.
 *
 * @param event - What happened.
 * @param usedBy - The profiles that opened the plugin or connected an account to it.
 * @param accountsUsing - The accounts those profiles belong to.
 * @param hearsEverybody - Whether the plugin may hear everybody's viewing.
 * @returns Whether the plugin is told.
 */
const isForThem = (
  event: PluginEvent,
  usedBy: ReadonlySet<string>,
  accountsUsing: ReadonlySet<string>,
  hearsEverybody = false,
): boolean => {
  if (event.topic === 'profile.removed') {
    return true;
  }

  if (hearsEverybody && isAboutViewing(event.topic)) {
    return true;
  }

  if (event.profileId !== null) {
    return usedBy.has(event.profileId);
  }

  const accountId = event.accountId ?? null;

  return accountId === null ? ABOUT_NOBODY.has(event.topic) : accountsUsing.has(accountId);
};

export { isForThem };
