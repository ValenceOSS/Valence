import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { reconnectRealtimeClient } from '@ValenceClient/realtime/reconnectRealtimeClient';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { forgetChosenProfile } from './forgetChosenProfile';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { noteChosenThisLaunch } from './noteChosenThisLaunch';

type ProfileChoiceState =
  | { kind: 'reading' }
  | { kind: 'choosing'; profiles: readonly ViewerProfile[] }
  | { kind: 'chosen' };

/**
 * Whether this device still has to be asked who is watching. Every start of the app asks, once an
 * account has more than one profile or a PIN on its only one; an account with one open profile is
 * never asked, since there is nobody else it could be. A profile chosen before the app started is
 * let go first, so whoever is holding the device now has to pick, and give a PIN, themselves. A list
 * that cannot be read lets the app through to say what is wrong, rather than holding it on the splash.
 *
 * @param accountId - Who is signed in, or nobody, where there is nobody to ask about or the server
 *   does not choose profiles per device.
 * @returns Where things stand, and what to call once somebody chose.
 */
const useProfileChoice = (accountId: string | null) => {
  const cache = useQueryClient();
  const list = useQuery({ ...profileQueries.list(), enabled: accountId !== null });
  const letGo = useRef<string | null>(null);
  const data = list.data;
  const [only] = data?.profiles ?? [];
  const isOpen = data !== undefined && data.profiles.length === 1 && only?.hasPin === false;
  const isChosenThisLaunch = accountId !== null && hasChosenThisLaunch(accountId);

  useEffect(() => {
    if (
      accountId === null ||
      data === undefined ||
      isOpen ||
      isChosenThisLaunch ||
      data.chosenProfileId === null ||
      letGo.current === accountId
    ) {
      return;
    }

    letGo.current = accountId;

    void forgetChosenProfile().then(() =>
      cache.invalidateQueries({ queryKey: profileQueries.key }),
    );
  }, [accountId, data, isOpen, isChosenThisLaunch, cache]);

  const chose = useCallback(() => {
    if (accountId === null) {
      return;
    }

    noteChosenThisLaunch(accountId);
    reconnectRealtimeClient();
    void cache.invalidateQueries();
  }, [accountId, cache]);

  const state: ProfileChoiceState =
    accountId === null || (data === undefined && list.isError)
      ? { kind: 'chosen' }
      : data === undefined
        ? { kind: 'reading' }
        : isOpen || (isChosenThisLaunch && data.chosenProfileId !== null)
          ? { kind: 'chosen' }
          : { kind: 'choosing', profiles: data.profiles };

  return { state, chose };
};

export type { ProfileChoiceState };

export { useProfileChoice };
