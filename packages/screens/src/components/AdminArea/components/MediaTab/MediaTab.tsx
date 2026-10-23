import { memo, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { freshnessOf } from '@ValenceClient/query/freshnessOf';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { useLookAgainWhenShown } from '@ValenceClient/query/useLookAgainWhenShown';
import { rebuildArtefacts } from '@ValenceClient/library/fetchLibrary';
import { deleteMedia } from '@ValenceClient/library/deleteMedia';
import { deleteSeries } from '@ValenceClient/library/deleteSeries';
import { fetchTrickplay } from '@ValenceClient/playback/fetchTrickplay';
import { notify } from '@ValenceUI/notify';
import { failureOfMissing, failureOfThrown } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { MediaPanel } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaPanel';
import { watchJob } from '@ValenceScreens/components/AdminArea/scanCoordinator';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { MediaTabProps } from './MediaTab.types';
import { say } from '@ValenceI18n/say';

const NO_MEDIA: MediaSummary[] = [];

const NO_ALBUMS: MusicAlbum[] = [];

const NO_BOOKS: Book[] = [];

const NO_PATHS: Readonly<Record<string, string>> = {};

/**
 * The admin area's Media tab: every title, album and book in the libraries, read for as long as the
 * tab is open, with what can be done to each. It is drawn again only when what it holds or is handed
 * changes, not on every reading of the server's load the rest of the admin area takes each second.
 *
 * @param libraries - The libraries there are.
 * @param mayDelete - Whether whoever is looking may delete and move media.
 * @param onOpenFolder - Told a folder to open in Files.
 * @param onCorrect - Told a title to correct the match of.
 * @param onChooseArtwork - Told what to choose artwork for.
 * @param onCorrectAlbum - Told an album to correct the match of.
 * @param onCorrectBook - Told a book to correct the match of.
 * @param onChooseMoment - Told a title to choose a preview moment for, once its previews exist.
 * @param onReencode - Told the titles to re-encode.
 * @param onShowCopies - Told a title whose kept copies to show, and its name.
 */
const MediaTabContents = ({
  libraries,
  mayDelete,
  onOpenFolder,
  onCorrect,
  onChooseArtwork,
  onCorrectAlbum,
  onCorrectBook,
  onChooseMoment,
  onReencode,
  onShowCopies,
}: MediaTabProps) => {
  const cache = useQueryClient();
  const libraryIds = useMemo(() => libraries.map((library) => library.id), [libraries]);
  const bookLibraryIds = useMemo(
    () => libraries.filter((library) => library.kind === 'books').map((library) => library.id),
    [libraries],
  );

  const askedLibraries = useQuery(libraryQueries.all());
  const askedAlbums = useQuery(adminQueries.albums());
  const askedBooks = useQuery({
    ...adminQueries.books(bookLibraryIds),
    enabled: bookLibraryIds.length > 0,
  });
  const everyFileKey = adminQueries.everyFile(libraryIds).queryKey;
  const askedEveryFile = useQuery({
    ...adminQueries.everyFile(libraryIds),
    enabled: libraryIds.length > 0,
  });
  const askedPaths = useQuery({
    ...adminQueries.mediaPaths(libraryIds),
    enabled: libraryIds.length > 0,
  });

  const isLooking = useLookAgainWhenShown(true, [
    libraryQueries.all().queryKey,
    everyFileKey,
    adminQueries.mediaPaths(libraryIds).queryKey,
    adminQueries.albums().queryKey,
    adminQueries.books(bookLibraryIds).queryKey,
  ]);

  const readTheLibraryAgain = (): void => {
    void cache.invalidateQueries({ queryKey: libraryQueries.key });
    void cache.invalidateQueries({ queryKey: adminQueries.key });
    void cache.invalidateQueries({ queryKey: requestsQueries.key });
  };

  return (
    <MediaPanel
      isUnreachable={askedEveryFile.isLoadingError || askedLibraries.isLoadingError}
      freshness={freshnessOf(
        [askedLibraries, askedEveryFile, askedPaths, askedAlbums, askedBooks],
        isLooking,
      )}
      stillReading={{
        libraries: askedLibraries.isPending,
        files: askedEveryFile.isPending,
        albums: askedAlbums.isPending,
        books: askedBooks.isPending,
      }}
      libraries={libraries}
      media={askedEveryFile.data ?? NO_MEDIA}
      albums={askedAlbums.data ?? NO_ALBUMS}
      books={askedBooks.data ?? NO_BOOKS}
      paths={askedPaths.data ?? NO_PATHS}
      {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
      onCorrect={onCorrect}
      {...(mayDelete
        ? {
            onMoved: (toLibraryId: string, jobId: string | null) => {
              readTheLibraryAgain();

              if (jobId !== null) {
                void watchJob(toLibraryId, 'library.readAgain', jobId).then(readTheLibraryAgain);
              }
            },
          }
        : {})}
      onChooseArtwork={onChooseArtwork}
      onCorrectAlbum={onCorrectAlbum}
      onCorrectBook={onCorrectBook}
      onChooseMoment={(item) => {
        void fetchTrickplay(item.id).then((found) => {
          if (found === null) {
            notify.say(
              say('screens.adminArea.scrubPreviewsForTitleHaveNot', { title: item.title }),
              {
                description: say('screens.adminArea.aPreviewMomentCanBeChosen'),
              },
            );

            return;
          }

          onChooseMoment(item);
        });
      }}
      onRebuildArtefacts={async (item) =>
        tellOutcome(
          say('screens.adminArea.rebuildingThePreviewsOfTitle', { title: item.title }),
          failureOfMissing(
            await rebuildArtefacts(item.id),
            say('screens.adminArea.thePreviewsOfTitleCouldNot', { title: item.title }),
          ),
        )
      }
      {...(mayDelete
        ? {
            onDelete: async (item: MediaSummary, isWholeSeries: boolean) => {
              const seriesId = isWholeSeries ? (item.seriesId ?? null) : null;
              const name = isWholeSeries ? (item.seriesTitle ?? item.title) : item.title;
              const isGone = tellOutcome(
                say('common.deletedName', { name }),
                await failureOfThrown(
                  async () => {
                    await (seriesId === null ? deleteMedia(item.id) : deleteSeries(seriesId));
                  },
                  say('common.nameCouldNotBeDeleted', { name }),
                ),
              );

              if (isGone) {
                const isKept = (entry: MediaSummary) =>
                  entry.id !== item.id && (seriesId === null || entry.seriesId !== seriesId);

                cache.setQueryData(everyFileKey, (current: MediaSummary[] = []) =>
                  current.filter(isKept),
                );
                readTheLibraryAgain();
              }

              return isGone;
            },
          }
        : {})}
      onReencode={onReencode}
      onShowCopies={onShowCopies}
    />
  );
};

const MediaTab = memo(MediaTabContents);

MediaTab.displayName = 'MediaTab';

export { MediaTab };
