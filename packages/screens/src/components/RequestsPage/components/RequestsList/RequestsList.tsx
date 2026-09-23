import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Compass as CompassIcon } from '@keyline-icons/react';
import { Badge } from '@ValenceUI/Badge';
import { DownloadProgressReadout } from '@ValenceScreens/components/DownloadProgressReadout/DownloadProgressReadout';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { NothingHere } from '@ValenceUI/NothingHere';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Spinner } from '@ValenceUI/Spinner';
import { FilterMenu } from '@ValenceUI/FilterMenu';
import { TextField } from '@ValenceUI/TextField';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import { describeRequestProgress } from '@ValenceClient/requests/describeRequestProgress';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { progressOfRequest } from '@ValenceClient/requests/progressOfRequest';
import { describeRequestFilters } from '@ValenceScreens/requests/describeRequestFilters';
import { filterRequests } from '@ValenceScreens/requests/filterRequests';
import { costOfRequest } from '@ValenceScreens/requests/costOfRequest';
import { describeDownloadCost } from '@ValenceScreens/requests/describeDownloadCost';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestsListProps } from './RequestsList.types';

/**
 * The requests on this server, newest first, with where each has got to — waiting on approval,
 * refused and why, not out yet, being searched for, arriving — who asked for it, which library it
 * is for, the quality it is judged at, and, while any is downloading, how far it has got, how fast
 * and how long is left, read again every couple of seconds. Once it has arrived, what it cost takes
 * the progress bar's place: how much was downloaded, and how long the wait was.
 *
 * Everybody's or only your own, depending on what the server sends: it answers with the whole house
 * to whoever may see it and with one person's to everybody else, so there is nothing to decide
 * here. Filtering by who asked therefore appears only for somebody who can see more than their own.
 *
 * A request can be cancelled until it is in the library, which deletes whatever it had started
 * downloading. Choosing one opens it: in the library once it is there, and its page until then.
 *
 * @param onAsk - Called with a title to open its page, as its address names it.
 * @param onOpen - Called to open what is in the library already.
 */
const RequestsList = ({ onAsk, onOpen }: RequestsListProps) => {
  const cache = useQueryClient();
  const me = useQuery(sessionQueries.who());
  const requests = useQuery(requestsQueries.mediaRequests());
  const libraries = useQuery(libraryQueries.all());
  const [filters, setFilters] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState('');
  const everything = useMemo(() => requests.data ?? [], [requests.data]);
  const named = useMemo(
    () => new Map((libraries.data ?? []).map((library) => [library.id, library.name])),
    [libraries.data],
  );
  const groups = useMemo(() => describeRequestFilters(everything, named), [everything, named]);
  const shown = useMemo(
    () => filterRequests(everything, filters, search),
    [everything, filters, search],
  );
  const progress = useQuery(
    requestsQueries.requestProgress(shown.some((request) => request.state === 'downloading')),
  );
  const [cancelling, setCancelling] = useState<MediaRequest | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  if (requests.isError) {
    return (
      <CouldNotRead
        what="The requests"
        isTryingAgain={requests.isFetching}
        onTryAgain={() => {
          void requests.refetch();
        }}
      />
    );
  }

  if (requests.data === undefined || me.data === undefined) {
    return <Spinner isCentered label="Reading the requests" />;
  }

  if (everything.length === 0) {
    return (
      <NothingHere
        of={CompassIcon}
        title="Nothing has been requested yet"
        detail="Find something on Discover, or search for it, and request it from its page."
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          label="Filter the requests"
          groups={groups}
          selected={filters}
          onChange={setFilters}
        />

        <TextField
          label="Search the requests"
          isLabelHidden
          size="sm"
          type="search"
          placeholder="A title, or who asked"
          value={search}
          onValueChange={setSearch}
          className="w-56 max-w-full"
        />
      </div>

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      {shown.length === 0 ? (
        <NothingHere
          of={CompassIcon}
          title="Nothing matches that"
          detail="Clear a filter, or search for something else."
        />
      ) : null}

      <ul aria-label="Requests" className="flex flex-col gap-3">
        {shown.map((request) => {
          const badge = describeRequestBadge(request);
          const said = describeRequestProgress(request);
          const going = progressOfRequest(request, progress.data ?? []);
          const spent = costOfRequest(request);
          const cost = describeDownloadCost(spent.bytes, spent.seconds);

          return (
            <Card key={request.id} as="li" className="flex flex-wrap items-start gap-4">
              {isMusicRequest(request.kind) ? (
                <MusicArtwork
                  src={request.posterUrl}
                  label={`The cover of ${request.title}`}
                  shape={request.kind === 'artist' ? 'round' : 'square'}
                  className="w-16"
                />
              ) : (
                <span className="aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-md bg-surface-raised ring-1 ring-line">
                  {request.posterUrl === null ? null : (
                    <img
                      src={request.posterUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </span>
              )}

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-text">
                    {request.title}
                    {request.year === null ? '' : ` (${request.year.toString()})`}
                  </span>
                  <Badge size="sm">{REQUEST_KIND_NAMES[request.kind]}</Badge>
                  <Badge size="sm" tone={badge.tone}>
                    {badge.label}
                  </Badge>
                </span>

                <span className="text-xs text-text-muted">
                  {[
                    request.requestedBy.id === me.data?.id
                      ? 'Asked by you'
                      : `Asked by ${request.requestedBy.name}`,
                    named.get(request.libraryId) ?? null,
                    request.profileName,
                  ]
                    .filter((part) => part !== null)
                    .join(' · ')}
                </span>

                {said === null ? null : <span className="text-xs text-text-muted">{said}</span>}
                {request.refusedBecause === null ? null : (
                  <span className="break-words text-xs text-text-muted">
                    Refused: {request.refusedBecause}
                  </span>
                )}
                {badge.detail === null ? null : (
                  <span className="break-words text-xs text-text-muted">{badge.detail}</span>
                )}

                {going !== null || cost === null ? null : (
                  <span className="text-xs text-text-muted">{cost}</span>
                )}

                {going === null ? null : (
                  <ProgressBar
                    label={`How much of ${request.title} has arrived`}
                    value={Math.round(going.progress * 1000) / 10}
                    readout={
                      <DownloadProgressReadout progress={going} className="text-text-muted" />
                    }
                  />
                )}
              </div>

              <span className="flex shrink-0 flex-wrap gap-2">
                {request.requestedBy.id === me.data?.id &&
                request.state !== 'filed' &&
                request.state !== 'available' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancelling(request);
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (request.state === 'available' && request.mediaId !== null) {
                      onOpen(request.kind, request.mediaId);

                      return;
                    }

                    onAsk(
                      askingOf({
                        kind: request.kind,
                        id: request.musicBrainzId ?? request.tmdbId?.toString() ?? '',
                      }),
                    );
                  }}
                >
                  {request.state === 'available' && request.mediaId !== null ? 'Open' : 'Details'}
                </Button>
              </span>
            </Card>
          );
        })}
      </ul>

      <ConfirmDialog
        title={`Cancel ${cancelling?.title ?? 'this request'}?`}
        detail="It will not be fetched, and whatever it had started downloading is deleted. You can request it again whenever you like."
        confirmLabel="Cancel request"
        isDestructive
        isOpen={cancelling !== null}
        onClose={() => {
          setCancelling(null);
        }}
        onConfirm={() => {
          const gone = cancelling;

          setCancelling(null);
          setProblem(null);

          if (gone !== null) {
            void removeMediaRequest(gone.id, true).then((refusal) => {
              if (refusal !== null) {
                setProblem(refusal.message);
              }

              void cache.invalidateQueries({ queryKey: requestsQueries.key });
            });
          }
        }}
      />
    </>
  );
};

RequestsList.displayName = 'RequestsList';

export { RequestsList };
