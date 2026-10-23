import { useMemo } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { DataTable } from '@ValenceUI/DataTable';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { TITLE_PART_LOOKS } from '@ValenceScreens/requests/TITLE_PART_LOOKS';
import { FolderLink } from '@ValenceScreens/components/FolderLink/FolderLink';
import { folderOf } from '@ValenceScreens/components/AdminArea/components/MediaPanel/folderOf';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';
import type { TrackTableProps } from './TrackTable.types';
import { say } from '@ValenceI18n/say';

const TRACKS_A_DISC = 1000;

type TrackRow = {
  id: string;
  disc: number;
  number: number;
  title: string;
  seconds: number | null;
  part: TitlePart;
  path: string | null;
};

/**
 * Orders an album's files the way its tracks run: by disc, then by track.
 *
 * @param files - The files held.
 * @returns Them in order.
 */
const inTrackOrder = (files: readonly TitleFile[]): TitleFile[] =>
  files.toSorted(
    (left, right) =>
      (left.season ?? 1) - (right.season ?? 1) || (left.episode ?? 0) - (right.episode ?? 0),
  );

/**
 * An album's tracks as MusicBrainz lists its longest edition, each with how long it runs, whether
 * the library holds it, and the file it is held in, which opens its folder in Files. A file is
 * matched by disc and track number, or by its place on the album where every file says disc one.
 *
 * @param tracks - The album's tracks, in order.
 * @param files - The files the library holds of it.
 * @param missing - Where a track the library does not hold stands.
 * @param onOpenFolder - Called with a folder to open in Files, from a track's file.
 */
const TrackTable = ({ tracks, files, missing, onOpenFolder }: TrackTableProps) => {
  const rows = useMemo<TrackRow[]>(() => {
    const ordered = inTrackOrder(files);
    const isOneToOne = ordered.length === tracks.length;
    const isNumberedThrough = ordered.every((one) => (one.season ?? 1) === 1);

    return tracks.map((track, at) => {
      const file = isOneToOne
        ? ordered[at]
        : (ordered.find(
            (one) => (one.season ?? 1) === track.disc && one.episode === track.number,
          ) ??
          (isNumberedThrough && track.disc > 1
            ? ordered.find((one) => one.episode === at + 1)
            : undefined));

      return {
        id: at.toString(),
        disc: track.disc,
        number: track.number,
        title: track.title,
        seconds: track.seconds,
        part: file === undefined ? missing : 'library',
        path: file?.path ?? null,
      };
    });
  }, [tracks, files, missing]);

  const isOneDisc = tracks.every((track) => track.disc === 1);

  const columns = useMemo<DataTableColumn<TrackRow>[]>(
    () => [
      {
        id: 'number',
        header: '#',
        accessorFn: (row) => row.disc * TRACKS_A_DISC + row.number,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            {isOneDisc
              ? row.original.number
              : `${String(row.original.disc)}.${String(row.original.number)}`}
          </span>
        ),
      },
      {
        id: 'title',
        header: say('screens.adminArea.titlePage.trackTable.track'),
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <span className="block max-w-72 truncate text-sm font-medium text-text">
            {row.original.title}
          </span>
        ),
      },
      {
        id: 'length',
        header: say('screens.adminArea.titlePage.trackTable.length'),
        accessorFn: (row) => row.seconds ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums text-sm text-text-muted">
            {row.original.seconds === null ? '—' : formatDuration(row.original.seconds)}
          </span>
        ),
      },
      {
        id: 'status',
        header: say('common.status'),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge size="sm" tone={TITLE_PART_LOOKS[row.original.part].tone}>
            {TITLE_PART_LOOKS[row.original.part].label}
          </Badge>
        ),
      },
      {
        id: 'file',
        header: say('screens.adminArea.titlePage.episodeTable.fileName'),
        enableSorting: false,
        cell: ({ row }) => {
          const { path } = row.original;

          return path === null ? (
            <span className="text-xs text-text-muted">—</span>
          ) : (
            <span className="block max-w-52 text-xs text-text-muted">
              {onOpenFolder === undefined ? (
                <span className="block truncate">{path.split('/').at(-1) ?? path}</span>
              ) : (
                <FolderLink
                  shown={path.split('/').at(-1) ?? path}
                  folder={folderOf(path)}
                  onOpen={onOpenFolder}
                />
              )}
            </span>
          );
        },
      },
    ],
    [onOpenFolder, isOneDisc],
  );

  return (
    <DataTable
      label={say('screens.adminArea.titlePage.trackTable.tracks')}
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      height="compact"
    />
  );
};

TrackTable.displayName = 'TrackTable';

export { TrackTable };
