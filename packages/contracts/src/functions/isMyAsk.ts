import type { Requester } from '@ValenceContracts/schemas/MediaRequest';

type Me = { accountId: string; profileId: string | null };

/**
 * Whether an asker is the person looking: the same profile on the same account, or, for an ask made
 * before profiles were told apart, the same account.
 *
 * @param asker - Who asked.
 * @param me - Who is looking, where anybody is.
 * @returns Whether it was them.
 */
const isMyAsk = (asker: Pick<Requester, 'id' | 'askingProfile'>, me: Me | null): boolean => {
  if (me === null || asker.id !== me.accountId) {
    return false;
  }

  const asking = asker.askingProfile?.profileId ?? null;

  return asking === null || me.profileId === null || asking === me.profileId;
};

export type { Me };

export { isMyAsk };
