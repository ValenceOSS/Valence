import { useMe } from '@ValenceClient/requests/useMe';
import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { useQueries, useQuery } from '@tanstack/react-query';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { catalogueIdOfRequest } from '@ValenceClient/requests/catalogueIdOfRequest';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { askersOf } from '@ValenceContracts/functions/askersOf';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { meterOfRequest } from './meterOfRequest';
import type { OnItsWayShelfProps } from './OnItsWayShelf.types';
import { say } from '@ValenceI18n/say';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { sayingAll } from '@ValenceI18n/sayingAll';
import { sayingCount } from '@ValenceI18n/sayingCount';

const ARRIVED = new Set(['filed', 'available', 'refused']);

const FACES = 3;

/**
 * What everybody has asked for that has not arrived yet, at the top of Discover: each over its
 * backdrop, with everybody who wants it in the corner and a bar under it saying where it stands and
 * how far it has come. A title only followed is shown too, with nobody in the corner, since nobody
 * asked for it. Everybody's means as many as the server shows you, which is only your own where you
 * may not see the rest. Nothing is drawn until something is on its way; the title opens every
 * request.
 *
 * @param onAsk - Called with the title to open, as its address names it.
 * @param onOpenAll - Called to show every request.
 */
const OnItsWayShelf = ({ onAsk, onOpenAll }: OnItsWayShelfProps) => {
  const requests = useQuery(requestsQueries.mediaRequests());
  const coming = (requests.data ?? []).filter((request) => !ARRIVED.has(request.state));
  const faces = useQuery(profileQueries.everyone());
  const me = useMe();
  const described = useQueries({
    queries: coming.map((request) =>
      requestsQueries.askable(request.kind, catalogueIdOfRequest(request) || null),
    ),
  });
  const progress = useQuery(
    requestsQueries.requestProgress(coming.some((request) => request.state === 'downloading')),
  );

  if (coming.length === 0) {
    return null;
  }

  return (
    <Rail title={say('common.requested')} sizesCards cards="wide" onOpenTitle={onOpenAll}>
      {coming.map((request, at) => {
        const backdropUrl = described[at]?.data?.backdropUrl ?? request.posterUrl;
        const logoUrl = described[at]?.data?.logoUrl ?? null;
        const askers = askersOf(request);
        const names = askers.map((asker) => nameOfAskerFor(asker, me));
        const [first, ...rest] = names;

        return (
          <RevealItem key={request.id} index={at} className="shrink-0 snap-start">
            <MediaCard
              title={request.title}
              subtitle={request.year?.toString() ?? ''}
              shape="wide"
              {...(backdropUrl === null ? {} : { imageUrl: backdropUrl })}
              {...(logoUrl === null ? {} : { logoUrl })}
              meter={meterOfRequest(request, progressOfRequest(request, progress.data ?? []))}
              {...(askers.length === 0
                ? {}
                : {
                    overlay: (
                      <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-overlay py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-on-scrim backdrop-blur-md">
                        <span className="flex shrink-0 -space-x-1.5">
                          {askers.slice(0, FACES).map((asker) => {
                            const face = faces.data?.find(
                              (profile) => profile.id === asker.faceProfileId,
                            );

                            return face === undefined ? (
                              <span
                                key={`${asker.id}/${asker.askingProfile?.profileId ?? ''}`}
                                className="flex size-5 items-center justify-center rounded-full bg-subtle text-[0.625rem] font-semibold text-text ring-1 ring-overlay"
                              >
                                {(
                                  (asker.askingProfile?.name ?? asker.name).trim()[0] ?? '?'
                                ).toUpperCase()}
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
                    ),
                  })}
              onSelect={() => {
                onAsk(askingOf({ kind: request.kind, id: catalogueIdOfRequest(request) }));
              }}
            />
          </RevealItem>
        );
      })}
    </Rail>
  );
};

OnItsWayShelf.displayName = 'OnItsWayShelf';

export { OnItsWayShelf };
