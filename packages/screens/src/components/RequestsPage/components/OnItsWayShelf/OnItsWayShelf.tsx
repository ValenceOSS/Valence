import { useQueries, useQuery } from '@tanstack/react-query';
import { MediaCard } from '@ValenceUI/MediaCard';
import { Rail } from '@ValenceUI/Rail';
import { RevealItem } from '@ValenceUI/RevealItem';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { catalogueIdOfRequest } from '@ValenceClient/requests/catalogueIdOfRequest';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { isAskedBy } from '@ValenceContracts/functions/isAskedBy';
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
 * What you have asked for that has not arrived yet, at the top of Discover: each over its backdrop,
 * with everybody who wants it in the corner and a bar under it saying where it stands and how far it has
 * come. Nothing is drawn until you have asked for
 * something; the title opens everything you have asked for.
 *
 * @param onAsk - Called with the title to open, as its address names it.
 * @param onOpenAll - Called to show all of your requests.
 */
const OnItsWayShelf = ({ onAsk, onOpenAll }: OnItsWayShelfProps) => {
  const me = useQuery(sessionQueries.who());
  const requests = useQuery(requestsQueries.mediaRequests());
  const coming = (requests.data ?? []).filter(
    (request) => isAskedBy(request, me.data?.id) && !ARRIVED.has(request.state),
  );
  const faces = useQuery(profileQueries.everyone());
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
        const askers = [request.requestedBy, ...request.alsoAskedBy];
        const names = askers.map((asker) => asker.name);
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
              overlay={
                <span className="flex min-w-0 items-center gap-1.5 rounded-full bg-overlay py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-on-scrim backdrop-blur-md">
                  <span className="flex shrink-0 -space-x-1.5">
                    {askers.slice(0, FACES).map((asker) => {
                      const face = faces.data?.find(
                        (profile) => profile.id === asker.faceProfileId,
                      );

                      return face === undefined ? (
                        <span
                          key={asker.id}
                          className="flex size-5 items-center justify-center rounded-full bg-subtle text-[0.625rem] font-semibold text-text ring-1 ring-overlay"
                        >
                          {(asker.name.trim()[0] ?? '?').toUpperCase()}
                        </span>
                      ) : (
                        <ProfileFace
                          key={asker.id}
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
              }
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
