import { Icon } from '@ValenceUI/Icon';
import { MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
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
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { TextField } from '@ValenceUI/TextField';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { MediaPanelProps, MediaRow } from './MediaPanel.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { formatBytes } from '@ValenceCore/functions/formatBytes';

const NO_ALBUMS: MusicAlbum[] = [];

const NO_BOOKS: Book[] = [];

/**
 * Names a row by its programme rather than by the episode standing in for it, so a series appears
 * under its own name rather than under whichever episode happened to be first.
 *
 * @param item - The item the row is for.
 * @returns What to call it.
 */
const nameOf = (item: MediaSummary): string => item.seriesTitle ?? item.title;

/**
 * Whether an item is an episode of a programme rather than a film, which decides both what its row
 * is called and which corrections make sense for it.
 *
 * @param item - The item.
 * @returns Whether it belongs to a programme.
 */
const isSeries = (item: MediaSummary): boolean =>
  item.seriesTitle !== null && item.seriesTitle !== undefined;

/**
 * What a row is called: a programme by its own name, an album by its title, a book by its title.
 *
 * @param row - The row.
 * @returns What to call it.
 */
const rowName = (row: MediaRow): string =>
  row.kind === 'video'
    ? nameOf(row.media)
    : row.kind === 'album'
      ? row.album.title
      : row.book.title;

/**
 * The line beneath a row's name: the episode standing for a series, an album's artist, a book's
 * authors.
 *
 * @param row - The row.
 * @returns The line, or nothing.
 */
const rowDetail = (row: MediaRow): string | null => {
  if (row.kind === 'album') {
    return row.album.artist.name;
  }

  if (row.kind === 'book') {
    return row.book.authors === null || row.book.authors.length === 0
      ? null
      : row.book.authors.join(', ');
  }

  return isSeries(row.media) ? row.media.title : null;
};

/**
 * What kind of thing a row is, as the kind column says it.
 *
 * @param row - The row.
 * @returns The kind.
 */
const rowKind = (row: MediaRow): string =>
  row.kind === 'album'
    ? 'Album'
    : row.kind === 'book'
      ? 'Book'
      : isSeries(row.media)
        ? 'Series'
        : 'Film';

/**
 * A row's own id, which is only unique within its kind.
 *
 * @param row - The row.
 * @returns A key unique across every kind.
 */
const rowKey = (row: MediaRow): string =>
  row.kind === 'album'
    ? `album:${row.album.id}`
    : row.kind === 'book'
      ? `book:${row.book.id}`
      : row.media.id;

/**
 * Everything the libraries hold, searchable, with the corrections an administrator can make to any
 * of it — films and programmes, and the albums and books a file or a lookup took for something
 * else: saying what a mismatched file really is, choosing the moment its hover preview is cut
 * from, rebuilding the previews and thumbnails made from it, and — for whoever may — deleting it
 * outright, which is asked twice since it cannot be undone. A series stands in the list as one row,
 * so deleting it deletes every episode rather than whichever one happened to stand for it.
 *
 * @param isUnreachable - Whether the service is not answering.
 * @param media - Everything the libraries hold.
 * @param albums - The albums in the music libraries.
 * @param books - The books on the shelves.
 * @param onCorrect - Called with the item whose match is to be corrected.
 * @param onCorrectAlbum - Called with the album whose record is to be corrected.
 * @param onCorrectBook - Called with the book whose work is to be corrected.
 * @param onChooseMoment - Called with the item whose preview moment is to be chosen.
 * @param onRebuildArtefacts - Called with the item whose previews and thumbnails are to be remade,
 *   answering whether the request was accepted.
 * @param onReencode - Called with the item to be re-encoded, where re-encoding is offered at all.
 * @param onDelete - Called with the item to be deleted — the whole series, for an episode — where
 *   deleting is offered at all, answering whether it went.
 */
const MediaPanel = ({
  isUnreachable = false,
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
}: MediaPanelProps) => {
  const [search, setSearch] = useState('');
  const [rebuilding, setRebuilding] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaSummary | null>(null);
  const [rebuilt, setRebuilt] = useState<ReadonlySet<string>>(new Set());
  const [condemned, setCondemned] = useState<MediaSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const ask = useCallback((item: MediaSummary) => {
    setConfirming(item);
  }, []);

  const rows = useMemo<MediaRow[]>(
    () => [
      ...media.map((item) => ({ kind: 'video' as const, media: item })),
      ...albums.map((album) => ({ kind: 'album' as const, album })),
      ...books.map((book) => ({ kind: 'book' as const, book })),
    ],
    [media, albums, books],
  );

  const shown = useMemo(
    () =>
      rows.filter((row) =>
        [rowName(row), rowDetail(row) ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [rows, search],
  );

  const columns = useMemo<DataTableColumn<MediaRow>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessorFn: rowName,
        cell: ({ row }) => {
          const detail = rowDetail(row.original);

          return (
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-text">{rowName(row.original)}</span>

              {detail === null ? null : (
                <span className="truncate font-body text-xs text-text-muted">{detail}</span>
              )}
            </span>
          );
        },
      },
      {
        id: 'kind',
        header: 'Kind',
        accessorFn: rowKind,
        filterFn: (row, columnId, filterValue) =>
          filterValue === undefined || row.getValue(columnId) === filterValue,
        meta: {
          filterOptions: [
            { id: 'Film', label: 'Films' },
            { id: 'Series', label: 'Series' },
            { id: 'Album', label: 'Albums' },
            { id: 'Book', label: 'Books' },
          ],
        },
        cell: ({ row }) => <Badge size="sm">{rowKind(row.original)}</Badge>,
      },
      {
        id: 'year',
        header: 'Year',
        accessorFn: (row) =>
          (row.kind === 'video'
            ? row.media.year
            : row.kind === 'album'
              ? row.album.year
              : row.book.year) ?? 0,
        cell: ({ row }) => {
          const year =
            row.original.kind === 'video'
              ? row.original.media.year
              : row.original.kind === 'album'
                ? row.original.album.year
                : row.original.book.year;

          return <span className="tabular-nums text-text-muted">{year ?? '—'}</span>;
        },
      },
      {
        id: 'size',
        header: 'Size',
        accessorFn: (row) =>
          row.kind === 'video'
            ? (row.media.sizeBytes ?? 0)
            : row.kind === 'album'
              ? row.album.sizeBytes
              : 0,
        cell: ({ row }) => {
          const bytes =
            row.original.kind === 'video'
              ? row.original.media.sizeBytes
              : row.original.kind === 'album'
                ? row.original.album.sizeBytes
                : null;

          return (
            <span className="tabular-nums text-text-muted">
              {bytes === null || bytes === undefined || bytes <= 0 ? '—' : formatBytes(bytes)}
            </span>
          );
        },
      },
      {
        id: 'artwork',
        header: 'Artwork',
        enableSorting: false,
        cell: ({ row }) =>
          (
            row.original.kind === 'video'
              ? row.original.media.hasPoster
              : row.original.kind === 'album'
                ? row.original.album.hasArtwork
                : row.original.book.hasCover
          ) ? (
            <span className="font-body text-xs text-text-muted">
              {row.original.kind === 'video' ? 'Poster' : 'Cover'}
            </span>
          ) : (
            <span className="font-body text-xs text-danger">Missing</span>
          ),
      },
      {
        id: 'correct',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const shelved = row.original;

          if (shelved.kind !== 'video') {
            const onChoose =
              shelved.kind === 'album'
                ? onCorrectAlbum === undefined
                  ? undefined
                  : () => {
                      onCorrectAlbum(shelved.album);
                    }
                : onCorrectBook === undefined
                  ? undefined
                  : () => {
                      onCorrectBook(shelved.book);
                    };

            return onChoose === undefined ? null : (
              <span className="flex justify-end">
                <ActionMenu
                  label={`Actions for ${rowName(shelved)}`}
                  trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                  groups={[
                    {
                      items: [
                        {
                          id: 'wrong-match',
                          label: 'Wrong match?',
                          icon: <Icon of={SearchFilledIcon} size={15} />,
                          onChoose,
                        },
                      ],
                    },
                  ]}
                />
              </span>
            );
          }

          const item = shelved.media;

          return (
            <span className="flex justify-end">
              <ActionMenu
                label={`Actions for ${nameOf(item)}`}
                trigger={<Icon of={MoreHorizontalIcon} size={16} />}
                groups={[
                  {
                    items: [
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
                          ask(item);
                        },
                      },
                      {
                        id: 'wrong-match',
                        label: 'Wrong match?',
                        icon: <Icon of={SearchFilledIcon} size={15} />,
                        onChoose: () => {
                          onCorrect(item);
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
                              label: 'Re-encode\u2026',
                              icon: <Icon of={TapeFilledIcon} size={15} />,
                              onChoose: () => {
                                onReencode(item);
                              },
                            },
                          ]),
                    ],
                  },
                  ...(onDelete === undefined
                    ? []
                    : [
                        {
                          items: [
                            {
                              id: 'delete',
                              label: isSeries(item) ? 'Delete series\u2026' : 'Delete file\u2026',
                              icon: <Icon of={BinFilledIcon} size={15} />,
                              isDestructive: true,
                              onChoose: () => {
                                setCondemned(item);
                              },
                            },
                          ],
                        },
                      ]),
                ]}
              />
            </span>
          );
        },
      },
    ],
    [
      ask,
      rebuilt,
      onCorrect,
      onCorrectAlbum,
      onCorrectBook,
      onReencode,
      onChooseMoment,
      onDelete,
      rebuilding,
    ],
  );

  return (
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
    >
      {isUnreachable ? (
        <p className="p-5 text-sm text-text-muted">
          The libraries could not be read from the server. This is not the same as holding nothing.
        </p>
      ) : (
        <DataTable
          label="Everything in the libraries"
          columns={columns}
          rows={shown}
          getRowId={rowKey}
          pageSize={10}
          emptyMessage={
            rows.length === 0 ? 'Nothing has been scanned yet.' : 'Nothing here matches that.'
          }
        />
      )}
      <ConfirmDialog
        isOpen={confirming !== null}
        title={`Rebuild the previews for ${confirming === null ? 'this title' : nameOf(confirming)}?`}
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
            condemned !== null && isSeries(condemned)
              ? `Delete every episode of ${nameOf(condemned)}?`
              : `Delete ${condemned === null ? 'this file' : nameOf(condemned)}?`
          }
          detail={
            condemned !== null && isSeries(condemned)
              ? 'Every episode’s file is deleted from the disk, along with the subtitles and artwork kept beside each, and Valence forgets the series. This cannot be undone.'
              : 'The file is deleted from the disk, along with the subtitles and artwork kept beside it for it, and Valence forgets it. This cannot be undone.'
          }
          confirmLabel={condemned !== null && isSeries(condemned) ? 'Delete series' : 'Delete file'}
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

            void onDelete(condemned).then((isGone) => {
              setIsDeleting(false);

              if (isGone) {
                setCondemned(null);
              }
            });
          }}
        />
      )}
    </PanelCard>
  );
};

MediaPanel.displayName = 'MediaPanel';

export { MediaPanel };
