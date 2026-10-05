import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Checkbox } from '@ValenceUI/Checkbox';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askForEveryAlbum } from '@ValenceClient/requests/askForEveryAlbum';
import { describeStanding } from '@ValenceClient/requests/describeStanding';
import { ChooseQualityDialog } from '@ValenceScreens/components/AskableDialog/components/ChooseQualityDialog/ChooseQualityDialog';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import type { RequestMissingSongsDialogProps } from './RequestMissingSongsDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Requests the albums a playlist's missing songs are on, all at once: each album once, found by
 * the server as the dialog opens and ticked where it can be asked for, beside what stands in the
 * way of any that cannot — in the library already, requested already, or not found. The server
 * goes on looking if the dialog is closed, so nobody need wait on it, and nothing can be requested
 * until every album has been looked for. Untick any not wanted; requesting asks once which quality
 * to look for, where there is a choice, and asks for every album ticked at it, by the same rules as
 * asking for one.
 *
 * @param playlistId - The playlist.
 * @param name - The playlist's name.
 * @param isOpen - Whether it is showing.
 * @param onClose - Told it was dismissed, or the albums requested.
 */
const RequestMissingSongsDialog = ({
  playlistId,
  name,
  isOpen,
  onClose,
}: RequestMissingSongsDialogProps) => {
  const cache = useQueryClient();
  const matching = useQuery(requestsQueries.missingAlbums(playlistId, isOpen));
  const albums = matching.data?.albums ?? [];
  const isMatching = matching.data?.isMatching !== false;
  const offered = useQuery(requestsQueries.profilesOnOffer('album', isOpen));
  const choices = offered.data?.forcedId === null ? offered.data.choices : [];
  const [leftOut, setLeftOut] = useState<ReadonlySet<string>>(new Set());
  const [isChoosing, setIsChoosing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const ticked = [
    ...new Set(
      albums.flatMap((album) =>
        album.found !== null && album.found.standing.status === 'askable' && !leftOut.has(album.key)
          ? [album.found.id]
          : [],
      ),
    ),
  ];
  const looking = albums.filter((album) => !album.isMatched).length;

  const send = (profileId: string | null) => {
    setIsAsking(true);

    void askForEveryAlbum(ticked, profileId).then(({ asked, refused }) => {
      setIsAsking(false);
      setIsChoosing(false);
      void cache.invalidateQueries({ queryKey: requestsQueries.key });

      if (asked > 0) {
        notify.worked(sayCount('common.count.albumsRequested', asked));
      }

      if (refused > 0) {
        notify.failed(sayCount('common.count.albumsCouldNotBeRequested', refused));
      }

      onClose();
    });
  };

  return (
    <>
      <Dialog label={say('common.requestMissingSongs')} isOpen={isOpen} onClose={onClose}>
        <DialogTitle
          title={say('common.requestMissingSongs')}
          detail={say('common.requestsTheAlbumsTheMissingSongsAreOn')}
        />

        <DialogContent>
          {matching.isError ? (
            <CouldNotRead
              said={say('common.theMissingAlbumsCouldNotBeFound')}
              isTryingAgain={matching.isFetching}
              onTryAgain={() => {
                void matching.refetch();
              }}
            />
          ) : matching.data === undefined ? (
            <Spinner
              size="sm"
              label={say('screens.missingSongDialog.lookingForItsAlbum')}
              isCentered
            />
          ) : (
            <ul className="flex flex-col gap-1">
              {albums.map((album) => {
                const { found } = album;
                const title = found?.title ?? album.title;
                const standing = found === null ? null : describeStanding(found.standing);

                return (
                  <li key={album.key} className="flex items-center gap-3 rounded-md px-2 py-1.5">
                    <MusicArtwork
                      src={album.coverUrl ?? found?.posterUrl ?? null}
                      label={title}
                      className="size-11 shrink-0"
                    />

                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[0.9375rem] font-medium text-text">
                        {title}
                      </span>
                      <span className="truncate text-[0.8125rem] text-text-muted">
                        {[
                          found?.subtitle ?? album.artist,
                          sayCount('common.count.songs', album.songCount),
                        ].join(' · ')}
                      </span>
                    </span>

                    {!album.isMatched ? (
                      <Spinner
                        size="sm"
                        label={say('screens.missingSongDialog.lookingForItsAlbum')}
                      />
                    ) : found === null ? (
                      <span className="shrink-0 text-[0.8125rem] text-text-muted">
                        {say('common.notFound')}
                      </span>
                    ) : standing !== null ? (
                      <span className="shrink-0 text-[0.8125rem] text-text-muted">
                        {standing.label}
                      </span>
                    ) : (
                      <Checkbox
                        label={say('common.requestTitle', { title })}
                        isLabelHidden
                        checked={!leftOut.has(album.key)}
                        disabled={isAsking}
                        onCheckedChange={(checked) => {
                          setLeftOut((before) => {
                            const after = new Set(before);

                            if (checked) {
                              after.delete(album.key);
                            } else {
                              after.add(album.key);
                            }

                            return after;
                          });
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DialogContent>

        <DialogFooter
          note={looking === 0 ? null : sayCount('common.count.stillLookingForAlbums', looking)}
          dismiss={{ onChoose: onClose }}
          confirm={{
            label: sayCount('common.count.requestAlbums', ticked.length),
            isDisabled: isMatching || ticked.length === 0,
            isLoading: isAsking && !isChoosing,
            onChoose: () => {
              if (choices.length < 2) {
                send(null);

                return;
              }

              setIsChoosing(true);
            },
          }}
        />
      </Dialog>

      <ChooseQualityDialog
        title={name}
        choices={choices}
        isOpen={isOpen && isChoosing}
        isAsking={isAsking}
        onChoose={send}
        onClose={() => {
          setIsChoosing(false);
        }}
      />
    </>
  );
};

RequestMissingSongsDialog.displayName = 'RequestMissingSongsDialog';

export { RequestMissingSongsDialog };
