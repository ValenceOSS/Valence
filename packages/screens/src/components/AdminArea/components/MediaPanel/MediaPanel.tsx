import { Icon } from '@ValenceUI/Icon';
import {
  ChevronRight as ChevronRightIcon,
  FolderOpen as FolderOpenIcon,
  MoreHorizontal as MoreHorizontalIcon,
} from '@keyline-icons/react';
import {
  Bin as BinFilledIcon,
  Film as FilmFilledIcon,
  RefreshCw as RefreshCwFilledIcon,
  Search as SearchFilledIcon,
  Tape as TapeFilledIcon,
} from '@keyline-icons/react/fill';
import { useCallback, useMemo, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { TextField } from '@ValenceUI/TextField';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { FolderLink } from '@ValenceScreens/components/FolderLink/FolderLink';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { MediaPoster } from './components/MediaPoster/MediaPoster';
import { ShelfTable } from './components/ShelfTable/ShelfTable';
import { describePicture } from '@ValenceClient/library/describePicture';
import { folderOf } from './folderOf';
import { gatherTitles } from './gatherTitles';
import { pathInLibrary } from './pathInLibrary';
import { titleFolderOf } from './titleFolderOf';
import { bookFolderOf } from './bookFolderOf';
import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { MediaPanelProps } from './MediaPanel.types';
import type { MediaTitle } from './MediaTitle.types';
import type { ShelfItem } from './ShelfItem.types';

const NO_PATHS: Readonly<Record<string, string>> = {};

const TAB_ORDER: readonly string[] = ['movies', 'shows', 'music', 'books'];

const NO_ALBUMS: readonly MusicAlbum[] = [];

const NO_BOOKS: readonly Book[] = [];

const SHOWING = [
  { id: 'all', label: 'All' },
  { id: 'look', label: 'Unmatched' },
] as const;

/**
 * Whether a title is missing something an administrator would want to put right: a match in the
 * catalogue, or a poster.
 *
 * @param title - The title.
 * @returns Whether it needs a look.
 */
const needsALook = (title: MediaTitle): boolean => !title.isMatched || title.posterFrom === null;

const INDENTS: readonly string[] = ['', 'pl-9', 'pl-[4.5rem]'];

/**
 * Says where an episode falls in its season, as its row is numbered.
 *
 * @param episode - The episode.
 * @returns Such as "E1" or "E3–4", or a dash where the file does not say.
 */
const describeNumber = (episode: MediaSummary): string =>
  episode.episodeNumber === null || episode.episodeNumber === undefined
    ? '—'
    : `E${describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd)}`;

/**
 * Says what a row is at a glance, beneath its name: how long and how sharp a film or an episode
 * is, how many seasons and episodes of a series are on the disk, or how many episodes a season has.
 *
 * @param title - The title.
 * @returns The line to show.
 */
const describeTitle = (title: MediaTitle): string => {
  if (title.kind === 'film' && title.parts.length > 0) {
    return `${title.parts.length.toString()} editions`;
  }

  if (title.kind === 'episode' && title.parts.length > 0) {
    return `${formatDuration(title.lead.durationSeconds)} · ${title.parts.length.toString()} editions`;
  }

  if (title.kind === 'season') {
    return `${title.episodes.length.toString()} ${title.episodes.length === 1 ? 'episode' : 'episodes'}`;
  }

  if (title.kind === 'series') {
    const seasons = `${title.seasons.toString()} ${title.seasons === 1 ? 'season' : 'seasons'}`;
    const episodes = `${title.episodes.length.toString()} ${title.episodes.length === 1 ? 'episode' : 'episodes'}`;

    return `${seasons} · ${episodes}`;
  }

  return [
    formatDuration(title.lead.durationSeconds),
    describePicture(title.lead),
    title.lead.videoCodec.toUpperCase(),
  ]
    .filter((part) => part !== null && part !== '')
    .join(' · ');
};

/**
 * Everything the libraries hold, one library at a time, each title with its poster: every film on
 * its own, and every series once, opening to show every episode on the disk season by season.
 * What can be done to a file is done to that file — rebuilding its previews, choosing its preview
 * moment, re-encoding it, deleting it — while a series' own row corrects its match, re-encodes every
 * episode or deletes the lot. A music library lists its albums and a book library its books, each
 * with its cover and a way to correct its match. What has no catalogue match or no artwork can be
 * narrowed to, since that is what an administrator comes here to fix.
 *
 * @param isUnreachable - Whether the service is not answering.
 * @param libraries - The libraries, each of which gets a tab.
 * @param media - Every file the libraries hold.
 * @param albums - Every album in the music libraries.
 * @param books - Every book in the book libraries.
 * @param onCorrect - Called with the item whose match is to be corrected.
 * @param onCorrectAlbum - Called with the album whose match is to be corrected, where offered.
 * @param onCorrectBook - Called with the book whose match is to be corrected, where offered.
 * @param onChooseMoment - Called with the item whose preview moment is to be chosen.
 * @param onRebuildArtefacts - Called with the item whose previews and thumbnails are to be remade,
 *   answering whether the request was accepted.
 * @param onReencode - Called with the files to be re-encoded, where re-encoding is offered at all.
 * @param onDelete - Called with the file to delete, and whether its whole series goes with it, where
 *   deleting is offered at all, answering whether it went.
 * @param paths - Where each item's file is, by the item, where they have been read.
 * @param onOpenFolder - Called with a folder to open in Files, where the file manager is offered.
 */
const MediaPanel = ({
  isUnreachable = false,
  libraries,
  media,
  albums = NO_ALBUMS,
  books = NO_BOOKS,
  onCorrect,
  onCorrectAlbum,
  onCorrectBook,
  onChooseMoment,
  onRebuildArtefacts,
  onReencode,
  onDelete,
  paths = NO_PATHS,
  onOpenFolder,
}: MediaPanelProps) => {
  const tabs = useMemo(
    () =>
      [...libraries].sort(
        (left, right) =>
          TAB_ORDER.indexOf(left.kind) - TAB_ORDER.indexOf(right.kind) ||
          left.name.localeCompare(right.name),
      ),
    [libraries],
  );
  const [chosenLibrary, setChosenLibrary] = useState<string | null>(null);
  const libraryId = tabs.some((library) => library.id === chosenLibrary)
    ? (chosenLibrary ?? '')
    : (tabs[0]?.id ?? '');
  const travel = useTravelDirection(
    tabs.map((library) => library.id),
    libraryId,
  );

  const [search, setSearch] = useState('');
  const [showing, setShowing] = useState<string>('all');
  const [rebuilding, setRebuilding] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaSummary | null>(null);
  const [rebuilt, setRebuilt] = useState<ReadonlySet<string>>(new Set());
  const [condemned, setCondemned] = useState<{
    item: MediaSummary;
    name: string;
    isWholeSeries: boolean;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const titles = useMemo(() => gatherTitles(media), [media]);

  const inLibrary = useMemo(
    () => titles.filter((title) => title.libraryId === libraryId),
    [titles, libraryId],
  );

  const shown = useMemo(() => {
    const words = search.trim().toLowerCase();

    return inLibrary.filter(
      (title) =>
        (showing === 'all' || needsALook(title)) &&
        (words === '' || title.name.toLowerCase().includes(words)),
    );
  }, [inLibrary, search, showing]);

  const lookingCount = inLibrary.filter(needsALook).length;
  const holdsParts = inLibrary.some((title) => title.parts.length > 0);
  const chosen = tabs.find((library) => library.id === libraryId) ?? null;
  const libraryPath = chosen?.path ?? null;
  const isShelf = chosen?.kind === 'music' || chosen?.kind === 'books';

  const shelved = useMemo((): ShelfItem[] => {
    if (chosen?.kind === 'music') {
      return albums
        .filter((album) => album.libraryId === chosen.id)
        .map((album) => {
          const folder = titleFolderOf([paths[album.id]].filter((file) => file !== undefined));

          return {
            id: album.id,
            name: album.title,
            year: album.year,
            detail: [
              album.artist.name,
              `${album.trackCount.toString()} ${album.trackCount === 1 ? 'track' : 'tracks'}`,
              formatDuration(album.durationSeconds),
            ].join(' · '),
            cover: album.hasArtwork ? albumArtworkUrl(album.id) : null,
            isSquare: true,
            sizeBytes: album.sizeBytes > 0 ? album.sizeBytes : null,
            addedAt: album.addedAt,
            onCorrect:
              onCorrectAlbum === undefined
                ? null
                : () => {
                    onCorrectAlbum(album);
                  },
            place: folder === null ? null : { shown: pathInLibrary(folder, libraryPath), folder },
          };
        });
    }

    if (chosen?.kind === 'books') {
      return books
        .filter((book) => book.libraryId === chosen.id)
        .map((book) => ({
          id: book.id,
          name: book.title,
          year: book.year,
          detail: [
            ...(book.authors === null || book.authors.length === 0
              ? []
              : [book.authors.join(', ')]),
            `${book.chapterCount.toString()} ${book.chapterCount === 1 ? 'chapter' : 'chapters'}`,
          ].join(' · '),
          cover: book.hasCover ? bookCoverUrl(book.id) : null,
          isSquare: false,
          sizeBytes: book.sizeBytes === undefined || book.sizeBytes === 0 ? null : book.sizeBytes,
          addedAt: book.addedAt,
          onCorrect:
            onCorrectBook === undefined
              ? null
              : () => {
                  onCorrectBook(book);
                },
          place:
            paths[book.id] === undefined
              ? null
              : {
                  shown: pathInLibrary(paths[book.id] ?? '', libraryPath),
                  folder: bookFolderOf(paths[book.id] ?? ''),
                },
        }));
    }

    return [];
  }, [albums, books, chosen, libraryPath, onCorrectAlbum, onCorrectBook, paths]);

  const shelfShown = useMemo(() => {
    const words = search.trim().toLowerCase();

    return shelved.filter(
      (item) =>
        (showing === 'all' || item.cover === null) &&
        (words === '' || item.name.toLowerCase().includes(words)),
    );
  }, [shelved, search, showing]);

  const placeOf = useCallback(
    (title: MediaTitle): { shown: string; folder: string } | null => {
      if (title.kind === 'film') {
        const file = paths[title.lead.id];

        return file === undefined
          ? null
          : { shown: pathInLibrary(file, libraryPath), folder: folderOf(file) };
      }

      const folder = titleFolderOf(
        title.episodes.map((episode) => paths[episode.id]).filter((file) => file !== undefined),
      );

      return folder === null ? null : { shown: pathInLibrary(folder, libraryPath), folder };
    },
    [libraryPath, paths],
  );

  const rebuild = useCallback(
    async (item: MediaSummary) => {
      setRebuilding(item.id);

      const thrownAway = await onRebuildArtefacts(item);

      setRebuilding(null);

      if (thrownAway) {
        setRebuilt((known) => new Set(known).add(item.id));
      }
    },
    [onRebuildArtefacts],
  );

  const fileActions = useCallback(
    (item: MediaSummary, name: string): ActionMenuItem[][] => [
      [
        ...(paths[item.id] === undefined || onOpenFolder === undefined
          ? []
          : [
              {
                id: 'show-in-files',
                label: 'Show in Files',
                icon: <Icon of={FolderOpenIcon} size={15} />,
                onChoose: () => {
                  onOpenFolder(folderOf(paths[item.id] ?? ''));
                },
              },
            ]),
        {
          id: 'rebuild',
          label:
            rebuilding === item.id
              ? 'Rebuilding…'
              : rebuilt.has(item.id)
                ? 'Will rebuild'
                : 'Rebuild previews',
          icon: <Icon of={RefreshCwFilledIcon} size={15} />,
          isDisabled: rebuilding === item.id,
          onChoose: () => {
            setConfirming(item);
          },
        },
        {
          id: 'preview-moment',
          label: 'Choose the preview moment',
          icon: <Icon of={FilmFilledIcon} size={15} />,
          onChoose: () => {
            onChooseMoment(item);
          },
        },
        ...(onReencode === undefined
          ? []
          : [
              {
                id: 'reencode',
                label: 'Re-encode…',
                icon: <Icon of={TapeFilledIcon} size={15} />,
                onChoose: () => {
                  onReencode([item]);
                },
              },
            ]),
      ],
      ...(onDelete === undefined
        ? []
        : [
            [
              {
                id: 'delete',
                label: 'Delete file…',
                icon: <Icon of={BinFilledIcon} size={15} />,
                isDestructive: true,
                onChoose: () => {
                  setCondemned({ item, name, isWholeSeries: false });
                },
              },
            ],
          ]),
    ],
    [onChooseMoment, onDelete, onOpenFolder, onReencode, paths, rebuilding, rebuilt],
  );

  const seriesActions = useCallback(
    (title: MediaTitle): ActionMenuItem[][] => [
      [
        {
          id: 'wrong-match',
          label: 'Wrong match?',
          icon: <Icon of={SearchFilledIcon} size={15} />,
          onChoose: () => {
            onCorrect(title.lead);
          },
        },
        ...(onReencode === undefined
          ? []
          : [
              {
                id: 'reencode',
                label: 'Re-encode every episode…',
                icon: <Icon of={TapeFilledIcon} size={15} />,
                onChoose: () => {
                  onReencode(title.episodes);
                },
              },
            ]),
      ],
      ...(onDelete === undefined || title.lead.seriesId === null
        ? []
        : [
            [
              {
                id: 'delete',
                label: 'Delete series…',
                icon: <Icon of={BinFilledIcon} size={15} />,
                isDestructive: true,
                onChoose: () => {
                  setCondemned({ item: title.lead, name: title.name, isWholeSeries: true });
                },
              },
            ],
          ]),
    ],
    [onCorrect, onDelete, onReencode],
  );

  const actionsFor = useCallback(
    (title: MediaTitle): ActionMenuItem[][] => {
      switch (title.kind) {
        case 'series':
          return seriesActions(title);
        case 'episode':
          return fileActions(title.lead, title.name);
        case 'version':
          return fileActions(title.lead, `${title.lead.title}: ${title.name}`);
        case 'season':
          return onReencode === undefined
            ? []
            : [
                [
                  {
                    id: 'reencode',
                    label: 'Re-encode this season\u2026',
                    icon: <Icon of={TapeFilledIcon} size={15} />,
                    onChoose: () => {
                      onReencode(title.episodes);
                    },
                  },
                ],
              ];
        case 'film':
          return [
            [
              {
                id: 'wrong-match',
                label: 'Wrong match?',
                icon: <Icon of={SearchFilledIcon} size={15} />,
                onChoose: () => {
                  onCorrect(title.lead);
                },
              },
            ],
            ...fileActions(title.lead, title.name),
          ];
      }
    },
    [fileActions, onCorrect, onReencode, seriesActions],
  );

  const columns = useMemo<DataTableColumn<MediaTitle>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessorFn: (title) => title.order,
        cell: ({ row }) => {
          const title = row.original;
          const isOpen = row.getIsExpanded();
          const place = title.kind === 'film' || title.kind === 'series' ? placeOf(title) : null;

          return (
            <span className={cn('flex min-w-0 items-center gap-3', INDENTS[row.depth] ?? '')}>
              {!holdsParts ? null : row.getCanExpand() ? (
                <Button
                  variant="subtle"
                  size="none"
                  isIconOnly
                  label={`${isOpen ? 'Hide' : 'Show'} ${title.kind === 'series' ? `the episodes of ${title.name}` : title.kind === 'film' || title.kind === 'episode' ? `the editions of ${title.name}` : `the episodes in ${title.name}`}`}
                  aria-expanded={isOpen}
                  onClick={() => {
                    row.toggleExpanded();
                  }}
                  className="size-6 shrink-0"
                >
                  <Icon
                    of={ChevronRightIcon}
                    size={15}
                    className={cn(
                      'transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]',
                      'motion-reduce:transition-none',
                      isOpen ? 'rotate-90' : '',
                    )}
                  />
                </Button>
              ) : (
                <span className="size-6 shrink-0" />
              )}

              {title.kind === 'episode' ? (
                <span className="w-10 shrink-0 text-xs tabular-nums text-text-muted">
                  {describeNumber(title.lead)}
                </span>
              ) : title.kind === 'season' || title.kind === 'version' ? null : (
                <MediaPoster
                  src={title.posterFrom === null ? null : artworkUrl(title.posterFrom, 'poster')}
                />
              )}

              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'truncate text-text',
                      row.depth === 0 ? 'font-medium' : 'text-sm',
                    )}
                  >
                    {title.name}
                  </span>

                  {title.year === null ? null : (
                    <span className="text-sm tabular-nums text-text-muted">{title.year}</span>
                  )}

                  {title.isMatched ? null : (
                    <Badge size="sm" tone="warning">
                      Unmatched
                    </Badge>
                  )}
                </span>

                <span className="truncate text-xs text-text-muted">{describeTitle(title)}</span>

                {place === null || onOpenFolder === undefined ? null : (
                  <FolderLink shown={place.shown} folder={place.folder} onOpen={onOpenFolder} />
                )}
              </span>
            </span>
          );
        },
      },
      {
        id: 'size',
        header: 'Size',
        accessorFn: (title) => title.sizeBytes ?? 0,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {row.original.sizeBytes === null ? '—' : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'added',
        header: 'Added',
        accessorFn: (title) => title.addedAt,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums text-text-muted">
            {new Date(row.original.addedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </span>
        ),
      },
      {
        id: 'act',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const title = row.original;
          const groups = actionsFor(title);

          return groups.length === 0 ? null : (
            <span className="flex justify-end">
              <ActionMenu
                label={`Actions for ${title.name}`}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={groups.map((items) => ({ items }))}
              />
            </span>
          );
        },
      },
    ],
    [actionsFor, holdsParts, onOpenFolder, placeOf],
  );

  const held = isShelf ? shelved.length : inLibrary.length;
  const looking = isShelf ? shelved.filter((item) => item.cover === null).length : lookingCount;
  const noun = chosen?.kind === 'music' ? 'album' : chosen?.kind === 'books' ? 'book' : 'title';
  const summary = `${held.toString()} ${noun}${held === 1 ? '' : 's'}`;

  const toolbar = (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-text-muted">{summary}</span>

      <SegmentedRow
        label="Which titles"
        size="xs"
        items={SHOWING.map((item) =>
          item.id === 'look'
            ? {
                id: item.id,
                label: `${isShelf ? 'No cover' : 'Unmatched'} (${looking.toString()})`,
              }
            : item,
        )}
        value={showing}
        onSelect={setShowing}
      />
    </div>
  );

  const emptyMessage =
    held === 0
      ? 'Nothing has been scanned into this library yet.'
      : showing === 'look'
        ? isShelf
          ? 'Everything here has a cover.'
          : 'Everything here is matched and has a poster.'
        : 'Nothing here matches that.';

  return (
    <Tabs value={libraryId} onValueChange={setChosenLibrary}>
      <PanelCard
        title="Media"
        isFlush
        actions={
          <TextField
            label="Find a programme or film"
            isLabelHidden
            size="sm"
            type="search"
            placeholder="Find a title"
            value={search}
            onValueChange={setSearch}
            className="w-64 max-w-full"
          />
        }
        below={
          tabs.length < 2 ? undefined : (
            <TabRow
              label="Which library"
              tone="underlined"
              size="sm"
              value={libraryId}
              groups={[{ items: tabs.map((library) => ({ id: library.id, label: library.name })) }]}
            />
          )
        }
      >
        {isUnreachable ? (
          <p className="p-5 text-sm text-text-muted">
            The libraries could not be read from the server. This is not the same as holding
            nothing.
          </p>
        ) : tabs.length === 0 ? (
          <p className="p-5 text-sm text-text-muted">
            There is no library yet. Add one on the Libraries page.
          </p>
        ) : (
          tabs.map((library) => (
            <TabPanel key={library.id} value={library.id} travel={travel}>
              {library.kind === 'music' || library.kind === 'books' ? (
                <ShelfTable
                  label={`Everything in ${library.name}`}
                  items={library.id === libraryId ? shelfShown : []}
                  toolbar={toolbar}
                  emptyMessage={emptyMessage}
                  {...(onOpenFolder === undefined ? {} : { onOpenFolder })}
                />
              ) : (
                <DataTable
                  label={`Everything in ${library.name}`}
                  columns={columns}
                  rows={library.id === libraryId ? shown : []}
                  getRowId={(title) => title.id}
                  pageSize={25}
                  height="fills"
                  getSubRows={(title) => (title.parts.length === 0 ? undefined : title.parts)}
                  toolbar={toolbar}
                  emptyMessage={emptyMessage}
                />
              )}
            </TabPanel>
          ))
        )}

        <ConfirmDialog
          isOpen={confirming !== null}
          title={`Rebuild the previews for ${confirming === null ? 'this title' : confirming.title}?`}
          detail="Its previews and thumbnails are thrown away and made again from the file, which takes a while and uses the server's encoder."
          confirmLabel="Rebuild previews"
          isDestructive
          isBusy={rebuilding !== null}
          onClose={() => {
            setConfirming(null);
          }}
          onConfirm={() => {
            if (confirming === null) {
              return;
            }

            void rebuild(confirming).then(() => {
              setConfirming(null);
            });
          }}
        />

        {onDelete === undefined ? null : (
          <ConfirmDialog
            isOpen={condemned !== null}
            title={
              condemned?.isWholeSeries === true
                ? `Delete every episode of ${condemned.name}?`
                : `Delete ${condemned === null ? 'this file' : condemned.name}?`
            }
            detail={
              condemned?.isWholeSeries === true
                ? 'Every episode’s file is deleted from the disk, along with the subtitles and artwork kept beside each, and Valence forgets the series. This cannot be undone.'
                : 'The file is deleted from the disk, along with the subtitles and artwork kept beside it for it, and Valence forgets it. This cannot be undone.'
            }
            confirmLabel={condemned?.isWholeSeries === true ? 'Delete series' : 'Delete file'}
            isDestructive
            isBusy={isDeleting}
            onClose={() => {
              setCondemned(null);
            }}
            onConfirm={() => {
              if (condemned === null) {
                return;
              }

              setIsDeleting(true);

              void onDelete(condemned.item, condemned.isWholeSeries).then((isGone) => {
                setIsDeleting(false);

                if (isGone) {
                  setCondemned(null);
                }
              });
            }}
          />
        )}
      </PanelCard>
    </Tabs>
  );
};

MediaPanel.displayName = 'MediaPanel';

export { MediaPanel };
