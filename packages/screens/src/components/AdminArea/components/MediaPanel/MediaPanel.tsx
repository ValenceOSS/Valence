import { Icon } from '@ValenceUI/Icon';
import {
  ClapperboardIcon,
  FilmRoll01Icon,
  MoreHorizontalIcon,
  RefreshIcon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { TextField } from '@ValenceUI/TextField';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MediaPanelProps } from './MediaPanel.types';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { formatBytes } from '@ValenceCore/functions/formatBytes';

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
 * Everything the libraries hold, searchable, with the corrections an administrator can make to any
 * of it: saying what a mismatched file really is, choosing the moment its hover preview is cut
 * from, and rebuilding the previews and thumbnails made from it.
 *
 * @param isUnreachable - Whether the service is not answering.
 * @param media - Everything the libraries hold.
 * @param onCorrect - Called with the item whose match is to be corrected.
 * @param onChooseMoment - Called with the item whose preview moment is to be chosen.
 * @param onRebuildArtefacts - Called with the item whose previews and thumbnails are to be remade,
 *   answering whether the request was accepted.
 * @param onReencode - Called with the item to be re-encoded, where re-encoding is offered at all.
 */
const MediaPanel = ({
  isUnreachable = false,
  media,
  onCorrect,
  onChooseMoment,
  onRebuildArtefacts,
  onReencode,
}: MediaPanelProps) => {
  const [search, setSearch] = useState('');
  const [rebuilding, setRebuilding] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<MediaSummary | null>(null);
  const [rebuilt, setRebuilt] = useState<ReadonlySet<string>>(new Set());

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

  const shown = useMemo(
    () => media.filter((item) => nameOf(item).toLowerCase().includes(search.trim().toLowerCase())),
    [media, search],
  );

  const live = useRef({ rebuilding, rebuilt, onCorrect, onChooseMoment, onReencode, ask });

  live.current = { rebuilding, rebuilt, onCorrect, onChooseMoment, onReencode, ask };

  const columns = useMemo<DataTableColumn<MediaSummary>[]>(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessorFn: nameOf,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-text">{nameOf(row.original)}</span>

            {isSeries(row.original) ? (
              <span className="truncate font-body text-xs text-text-muted">
                {row.original.title}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        id: 'kind',
        header: 'Kind',
        accessorFn: (item) => (isSeries(item) ? 'Series' : 'Film'),
        filterFn: (row, columnId, filterValue) =>
          filterValue === undefined || row.getValue(columnId) === filterValue,
        meta: {
          filterOptions: [
            { id: 'Film', label: 'Films' },
            { id: 'Series', label: 'Series' },
          ],
        },
        cell: ({ row }) => <Badge size="sm">{isSeries(row.original) ? 'Series' : 'Film'}</Badge>,
      },
      {
        id: 'year',
        header: 'Year',
        accessorFn: (item) => item.year ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">{row.original.year ?? '—'}</span>
        ),
      },
      {
        id: 'size',
        header: 'Size',
        accessorFn: (item) => item.sizeBytes ?? 0,
        cell: ({ row }) => (
          <span className="tabular-nums text-text-muted">
            {row.original.sizeBytes === null || row.original.sizeBytes === undefined
              ? '—'
              : formatBytes(row.original.sizeBytes)}
          </span>
        ),
      },
      {
        id: 'artwork',
        header: 'Artwork',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.hasPoster ? (
            <span className="font-body text-xs text-text-muted">Poster</span>
          ) : (
            <span className="font-body text-xs text-danger">Missing</span>
          ),
      },
      {
        id: 'correct',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex justify-end">
            <ActionMenu
              label={`Actions for ${nameOf(row.original)}`}
              trigger={<Icon of={MoreHorizontalIcon} size={16} />}
              groups={[
                {
                  items: [
                    {
                      id: 'rebuild',
                      label:
                        live.current.rebuilding === row.original.id
                          ? 'Rebuilding…'
                          : live.current.rebuilt.has(row.original.id)
                            ? 'Will rebuild'
                            : 'Rebuild previews',
                      icon: <Icon of={RefreshIcon} size={15} />,
                      isDisabled: live.current.rebuilding === row.original.id,
                      onChoose: () => {
                        live.current.ask(row.original);
                      },
                    },
                    {
                      id: 'wrong-match',
                      label: 'Wrong match?',
                      icon: <Icon of={Search01Icon} size={15} />,
                      onChoose: () => {
                        live.current.onCorrect(row.original);
                      },
                    },
                    {
                      id: 'preview-moment',
                      label: 'Choose the preview moment',
                      icon: <Icon of={ClapperboardIcon} size={15} />,
                      onChoose: () => {
                        live.current.onChooseMoment(row.original);
                      },
                    },
                    ...(live.current.onReencode === undefined
                      ? []
                      : [
                          {
                            id: 'reencode',
                            label: 'Re-encode\u2026',
                            icon: <Icon of={FilmRoll01Icon} size={15} />,
                            onChoose: () => {
                              live.current.onReencode?.(row.original);
                            },
                          },
                        ]),
                  ],
                },
              ]}
            />
          </span>
        ),
      },
    ],
    [],
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
          pageSize={10}
          emptyMessage={
            media.length === 0 ? 'Nothing has been scanned yet.' : 'Nothing here matches that.'
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
    </PanelCard>
  );
};

MediaPanel.displayName = 'MediaPanel';

export { MediaPanel };
