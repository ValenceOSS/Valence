import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Compass01Icon } from '@hugeicons/core-free-icons';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { NothingHere } from '@ValenceUI/NothingHere';
import { ProgressBar } from '@ValenceUI/ProgressBar';
import { Spinner } from '@ValenceUI/Spinner';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { removeMediaRequest } from '@ValenceClient/requests/fetchMediaRequests';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { describeRequestBadge } from '@ValenceScreens/components/AdminArea/components/MediaRequestsPanel/describeRequestBadge';
import { describeRequestProgress } from '@ValenceScreens/components/AdminArea/components/MediaRequestsPanel/describeRequestProgress';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { REQUEST_KIND_NAMES } from '@ValenceScreens/requests/REQUEST_KIND_NAMES';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { progressOfRequest } from '@ValenceScreens/requests/progressOfRequest';
import { describeDownloadProgress } from './describeDownloadProgress';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { MyRequestsProps } from './MyRequests.types';

/**
 * Every request of your own, newest first, with where each has got to — waiting on approval, not
 * out yet, being searched for, arriving — and, while any is downloading, how far it has got, how
 * fast and how long is left, read again every couple of seconds. A request can be cancelled until
 * it is in the library, which deletes whatever it had started downloading. Choosing one opens it: in the library once it is there, and its page
 * until then.
 *
 * @param onAsk - Called with a title to open its page, as its address names it.
 * @param onOpen - Called to open what is in the library already.
 */
const MyRequests = ({ onAsk, onOpen }: MyRequestsProps) => {
  const cache = useQueryClient();
  const me = useQuery(sessionQueries.who());
  const requests = useQuery(requestsQueries.mediaRequests());
  const mine = (requests.data ?? []).filter((request) => request.requestedBy.id === me.data?.id);
  const progress = useQuery(
    requestsQueries.requestProgress(mine.some((request) => request.state === 'downloading')),
  );
  const [cancelling, setCancelling] = useState<MediaRequest | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  if (requests.isError) {
    return (
      <CouldNotRead
        what="Your requests"
        isTryingAgain={requests.isFetching}
        onTryAgain={() => {
          void requests.refetch();
        }}
      />
    );
  }

  if (requests.data === undefined || me.data === undefined) {
    return <Spinner label="Reading your requests" />;
  }

  if (mine.length === 0) {
    return (
      <NothingHere
        of={Compass01Icon}
        title="You have not asked for anything yet"
        detail="Find something on Discover, or search for it, and ask for it from its page."
      />
    );
  }

  return (
    <>
      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      <ul aria-label="Your requests" className="flex flex-col gap-3">
        {mine.map((request) => {
          const badge = describeRequestBadge(request);
          const said = describeRequestProgress(request);
          const going = progressOfRequest(request, progress.data ?? []);

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

                {said === null ? null : <span className="text-xs text-text-muted">{said}</span>}
                {badge.detail === null ? null : (
                  <span className="break-words text-xs text-text-muted">{badge.detail}</span>
                )}

                {going === null ? null : (
                  <ProgressBar
                    label={`How much of ${request.title} has arrived`}
                    value={Math.round(going.progress * 1000) / 10}
                    readout={
                      <span className="text-xs tabular-nums text-text-muted">
                        {Math.floor(going.progress * 100).toString()}%
                        {describeDownloadProgress(going) === ''
                          ? ''
                          : ` · ${describeDownloadProgress(going)}`}
                      </span>
                    }
                  />
                )}
              </div>

              <span className="flex shrink-0 flex-wrap gap-2">
                {request.state !== 'filed' && request.state !== 'available' ? (
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
        detail="It will not be fetched, and whatever it had started downloading is deleted. You can ask for it again whenever you like."
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

MyRequests.displayName = 'MyRequests';

export { MyRequests };
