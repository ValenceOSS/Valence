import { Spinner } from '@ValenceUI/Spinner';
import { useQuery } from '@tanstack/react-query';
import { Film as FilmIcon } from '@keyline-icons/react/fill';
import { NothingHere } from '@ValenceUI/NothingHere';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { nameOfAskerFor } from '@ValenceClient/requests/nameOfAskerFor';
import { isAskedFor } from '@ValenceContracts/functions/isAskedFor';
import { DashboardRegion } from '@ValenceScreens/components/DashboardRegion/DashboardRegion';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import { say } from '@ValenceI18n/say';
import type { WhatsNewCardProps } from './WhatsNewCard.types';

const SHOWN = 6;

const WATCHED_KINDS = new Set(['movies', 'shows', 'anime']);

type Arrival = {
  id: string;
  title: string;
  detail: string;
  atMs: number;
};

/**
 * What has arrived on the server lately, newest first: titles added to the libraries, and requests
 * that came through and can be watched now, with who asked for them. Shows the request flow working
 * end to end, from somebody asking to the title being there. A title only followed is left out, since
 * nobody asked for it and following one the libraries already hold makes it available at once; what
 * is fetched for it later shows among the additions.
 *
 * @param libraries - The libraries, of which the film and series ones are read.
 * @param isReadingLibraries - Whether the libraries themselves are still being read for the first
 *   time.
 * @param onOpenPanel - Called with the page to open.
 */
const WhatsNewCard = ({
  libraries,
  isReadingLibraries = false,
  onOpenPanel,
}: WhatsNewCardProps) => {
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const watched = libraries.filter((library) => WATCHED_KINDS.has(library.kind));
  const added = useQuery(
    libraryQueries.across(
      watched.map((library) => library.id),
      { order: 'newest', limit: SHOWN },
    ),
  );
  const requesting = useQuery(requestsQueries.availability());
  const requests = useQuery({
    ...requestsQueries.mediaRequests(),
    enabled: requesting.data?.isEnabled ?? false,
  });

  const arrivals: Arrival[] = [
    ...(added.data ?? []).map((item) => ({
      id: item.id,
      title: item.seriesTitle ?? item.title,
      detail: watched.find((library) => library.id === item.libraryId)?.name ?? '',
      atMs: Date.parse(item.addedAt),
    })),
    ...(requests.data ?? [])
      .filter((request) => request.state === 'available' && isAskedFor(request))
      .map((request) => ({
        id: request.id,
        title: request.title,
        detail: say('screens.adminArea.whatsNewCard.askedForByName', {
          name: nameOfAskerFor(request.requestedBy, null),
        }),
        atMs: Date.parse(request.updatedAt),
      })),
  ]
    .filter(
      (arrival, index, every) =>
        every.findIndex((other) => other.title === arrival.title) === index,
    )
    .toSorted((a, b) => b.atMs - a.atMs)
    .slice(0, SHOWN);

  return (
    <DashboardRegion
      title={say('screens.adminArea.updatesPanel.whatsNew')}
      action={say('common.media')}
      onAction={() => {
        onOpenPanel('media');
      }}
    >
      {isReadingLibraries ||
      (watched.length > 0 && added.isPending) ||
      requesting.isPending ||
      (requesting.data?.isEnabled === true && requests.isPending) ? (
        <Spinner isCentered size="sm" label={say('common.loading')} />
      ) : arrivals.length === 0 ? (
        <NothingHere
          isCompact
          of={FilmIcon}
          title={say('screens.adminArea.whatsNewCard.nothingHasArrivedYet')}
        />
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {arrivals.map((arrival) => (
            <li key={arrival.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-text">{arrival.title}</span>
                <span className="truncate text-xs text-text-muted">{arrival.detail}</span>
              </span>

              <span className="shrink-0 text-xs tabular-nums text-text-muted">
                {describeSince(new Date(arrival.atMs).toISOString(), now)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardRegion>
  );
};

WhatsNewCard.displayName = 'WhatsNewCard';

export { WhatsNewCard };
