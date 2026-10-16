import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Query, QueryClient } from '@tanstack/react-query';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { reconnectRealtimeClient } from '@ValenceClient/realtime/reconnectRealtimeClient';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { ASKING_FOR } from './ASKING_FOR';
import { forgetChosenProfile } from './forgetChosenProfile';
import { hasChosenThisLaunch } from './hasChosenThisLaunch';
import { launchStore } from './launchStore';
import { noteChosenThisLaunch } from './noteChosenThisLaunch';

const KEPT_ACROSS_PROFILES = new Set(['session/who', 'session/setup', 'session/version']);

/**
 * Whether a query answers the same for every profile on the account, so it can be kept when the
 * profile watching changes: who is signed in, the server itself, and the list of profiles.
 *
 * @param query - The query.
 * @returns Whether it is kept.
 */
const isKeptAcrossProfiles = (query: Query): boolean => {
  const [first, second] = query.queryKey;
  const head = `${String(first)}/${String(second)}`;

  return KEPT_ACROSS_PROFILES.has(head) || head === 'profiles/list';
};

/**
 * Starts again everything read as the profile that was watching, so nothing of theirs shows to the
 * next, and tells the socket who is watching now.
 *
 * @param cache - The query cache.
 */
const startAsAnotherProfile = (cache: QueryClient): void => {
  reconnectRealtimeClient();
  void cache.resetQueries({ predicate: (query) => !isKeptAcrossProfiles(query) });
  void cache.invalidateQueries({ queryKey: profileQueries.key });
};

type ProfileChoiceState =
  | { kind: 'reading' }
  | { kind: 'choosing'; profiles: readonly ViewerProfile[]; askingFor: string | null }
  | { kind: 'chosen' };

/**
 * Whether this device still has to be asked who is watching. Every start of the app asks, once an
 * account has more than one profile or a PIN on its only one; an account with one open profile is
 * never asked, since there is nobody else it could be. A profile chosen before the app started is
 * let go first, so whoever is holding the device now has to pick, and give a PIN, themselves. A list
 * that cannot be read lets the app through to say what is wrong, rather than holding it on the splash.
 * A server from before devices chose profiles is never asked about. Every tab and window of one
 * sitting shares the choice, so a profile chosen in one is taken up by
 * the rest, and nothing read as the profile before shows to the next.
 *
 * @param accountId - Who is signed in, or nobody, where there is nobody to ask about or the server
 *   does not choose profiles per device.
 * @returns Where things stand, and what to call once somebody chose.
 */
const useProfileChoice = (accountId: string | null) => {
  const cache = useQueryClient();
  const list = useQuery({ ...profileQueries.list(), enabled: accountId !== null });
  const letGo = useRef<string | null>(null);
  const seen = useRef<string | null>(null);
  const data = list.data;
  const [only] = data?.profiles ?? [];
  const isOpen = data !== undefined && data.profiles.length === 1 && only?.hasPin === false;
  const isChosenThisLaunch = accountId !== null && hasChosenThisLaunch(accountId);

  useEffect(() => {
    if (accountId !== null && isOpen) {
      noteChosenThisLaunch(accountId);
    }
  }, [accountId, isOpen]);

  useEffect(() => {
    const now = data?.chosenProfileId ?? null;
    const was = seen.current;

    seen.current = now;

    if (accountId !== null && isChosenThisLaunch && was !== null && now !== null && was !== now) {
      startAsAnotherProfile(cache);
    }
  }, [accountId, data, isChosenThisLaunch, cache]);

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
    launchStore().forget(ASKING_FOR);
    startAsAnotherProfile(cache);
  }, [accountId, cache]);

  const state: ProfileChoiceState =
    accountId === null || (data === undefined && list.isError) || data?.predatesChoosing === true
      ? { kind: 'chosen' }
      : data === undefined
        ? { kind: 'reading' }
        : isOpen || (isChosenThisLaunch && data.chosenProfileId !== null)
          ? { kind: 'chosen' }
          : {
              kind: 'choosing',
              profiles: data.profiles,
              askingFor: launchStore().read(ASKING_FOR),
            };

  return { state, chose };
};

export type { ProfileChoiceState };

export { useProfileChoice };
