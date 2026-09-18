import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import type { Permission } from '@ValenceContracts/schemas/Permission';

type WhatIMayDo = {
  may: (permission: Permission) => boolean;
  mayAdminister: boolean;
  isLoading: boolean;
};

/**
 * What this account may do, for a screen deciding whether to offer something at all.
 *
 * Nothing is granted until the server has said so: while the answer is still on its way every
 * question is answered no, so a screen shows nothing privileged rather than offering it for a frame
 * and taking it away. The answer lives in the shared cache under the session key, which is the key
 * the socket invalidates when somebody's permissions change — so a promotion reaches a tab that is
 * already open without it being reloaded.
 *
 * What the server sent is read as it stands. An administrator arrives holding every permission
 * because the server resolved it that way, so nothing is implied from one permission to another
 * here — a second copy of that rule would re-grant whatever an override had taken away.
 *
 * @returns Whether each permission is held, whether they amount to administering the server, and
 *   whether the answer is still on its way — for a caller that would otherwise redirect somebody
 *   away from something they hold, on the strength of an answer that was only ever "no for now".
 */
const useWhatIMayDo = (): WhatIMayDo => {
  const held = useQuery(sessionQueries.permissions());

  const granted = useMemo(() => new Set(held.data?.permissions ?? []), [held.data]);

  return {
    may: (permission) => granted.has(permission),
    mayAdminister: held.data?.isAdministrator ?? false,
    isLoading: held.isPending,
  };
};

export type { WhatIMayDo };

export { useWhatIMayDo };
