import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which account and which profile on it asked, as a webhook says so beside the household's name.
 *
 * @param asker - Who asked.
 * @returns Their account, and their profile where it is known.
 */
const askerFieldsOf = (asker: Requester) => ({
  accountId: asker.id,
  profileId: asker.askingProfile?.profileId ?? null,
  profileName: asker.askingProfile?.name ?? null,
});

export { askerFieldsOf };
