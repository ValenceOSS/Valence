import { useMe } from '@ValenceClient/requests/useMe';
import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { askersOf } from '@ValenceContracts/functions/askersOf';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { OnItsWayCard } from './components/OnItsWayCard/OnItsWayCard';
import type { OnItsWayShelfProps } from './OnItsWayShelf.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import { sayingCount } from '@ValenceI18n/sayingCount';

const ARRIVED = new Set(['filed', 'available', 'refused']);

const FACES = 3;

/**
 * What everybody has asked for that has not arrived yet, at the top of Discover: each over its
 * backdrop, with everybody who wants it in the corner and a badge saying where it stands and
 * how far it has come. A title only followed is shown too, with nobody in the corner, since nobody
 * asked for it. Everybody's means as many as the server shows you, which is only your own where you
 * may not see the rest. The most recently changed come first, and each card is drawn — and
 * its backdrop read — only as it comes near the screen, so a server with thousands on their way
 * costs no more than the few in view; the title opens every request. Nothing is drawn until
 * something is on its way.
 *
 * @param onAsk - Called with the title to open, as its address names it.
 * @param onOpenAll - Called to show every request.
 */
const OnItsWayShelf = ({ onAsk, onOpenAll }: OnItsWayShelfProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const coming = (requests.data ?? [])
    .filter((request) => !ARRIVED.has(request.state))
    .toSorted((one, other) => other.updatedAt.localeCompare(one.updatedAt));
  const faces = useQuery(profileQueries.everyone());
  const me = useMe();
  const progress = useQuery(
    requestsQueries.requestProgress(coming.some((request) => request.state === 'downloading')),
  );

  const overlayOf = (request: MediaRequest): ReactNode => {
    const askers = askersOf(request);
    const names = askers.map((asker) => nameOfAskerFor(asker, me));
    const [first, ...rest] = names;

    return askers.length === 0 ? null : (
      <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-overlay py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-on-scrim backdrop-blur-md">
        <span className="flex shrink-0 -space-x-1.5">
          {askers.slice(0, FACES).map((asker) => {
            const face = faces.data?.find((profile) => profile.id === asker.faceProfileId);

            return face === undefined ? (
              <span
                key={`${asker.id}/${asker.askingProfile?.profileId ?? ''}`}
                className="flex size-5 items-center justify-center rounded-full bg-subtle text-[0.625rem] font-semibold text-text ring-1 ring-overlay"
              >
                {((asker.askingProfile?.name ?? asker.name).trim()[0] ?? '?').toUpperCase()}
              </span>
            ) : (
              <ProfileFace
                key={`${asker.id}/${asker.askingProfile?.profileId ?? ''}`}
                profile={face}
                className="size-5 text-[0.625rem] ring-1 ring-overlay"
              />
            );
          })}
        </span>
        <span className="truncate">
          {say('common.askedByName', {
            name: sayAgain(
              sayingAll(
                rest.length === 0
                  ? [first ?? '']
                  : [first ?? '', sayingCount('common.count.others', rest.length)],
              ),
            ),
          })}
        </span>
      </span>
    );
  };

  if (coming.length === 0) {
    return null;
  }

  return (
    <Rail title={say('common.requested')} sizesCards cards="wide" onOpenTitle={onOpenAll}>
      {coming.map((request, at) => (
        <RevealItem key={request.id} index={at} className="shrink-0 snap-start">
          <OnItsWayCard
            request={request}
            going={progressOfRequest(request, progress.data ?? [])}
            overlayOf={overlayOf}
            onAsk={onAsk}
          />
        </RevealItem>
      ))}
    </Rail>
  );
};

OnItsWayShelf.displayName = 'OnItsWayShelf';

export { OnItsWayShelf };
