import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Whether two askers are the same person: the same profile on the same account. An asker recorded
 * before profiles were told apart stands for its whole account, so it matches any of its profiles.
 *
 * @param one - An asker.
 * @param other - Another asker.
 * @returns Whether they are the same.
 */
const isSameAsker = (
  one: Pick<Requester, 'id' | 'askingProfile'>,
  other: Pick<Requester, 'id' | 'askingProfile'>,
): boolean => {
  if (one.id !== other.id) {
    return false;
  }

  const mine = one.askingProfile?.profileId ?? null;
  const theirs = other.askingProfile?.profileId ?? null;

  return mine === null || theirs === null || mine === theirs;
};

export { isSameAsker };
