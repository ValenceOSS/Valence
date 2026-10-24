import type { PluginEvent } from '@ValenceSDK/host/PluginDefinition';

/**
 * Whether a plugin is told of an event, by who it is about: one about a profile reaches a plugin
 * only where that profile used it, one about an account only where somebody on that account did,
 * and one about nobody, such as a library scan, reaches it regardless. That a profile was removed
 * reaches every plugin that hears it, since the profile's record of using it went with it.
 *
 * @param event - What happened.
 * @param usedBy - The profiles that opened the plugin or connected an account to it.
 * @param accountsUsing - The accounts those profiles belong to.
 * @returns Whether the plugin is told.
 */
const isForThem = (
  event: PluginEvent,
  usedBy: ReadonlySet<string>,
  accountsUsing: ReadonlySet<string>,
): boolean => {
  if (event.topic === 'profile.removed') {
    return true;
  }

  if (event.profileId !== null) {
    return usedBy.has(event.profileId);
  }

  const accountId = event.accountId ?? null;

  return accountId === null || accountsUsing.has(accountId);
};

export { isForThem };
